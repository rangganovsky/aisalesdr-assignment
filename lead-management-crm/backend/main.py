from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from models import Lead, LeadCreate, BulkEnrichRequest, BulkEnrichResponse
from db import leads_db, add_lead, get_lead, update_lead, get_all_leads

app = FastAPI(title="Lead Management API")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://crm-backend-sepia-three.vercel.app", 
    "*", # Allow all for simplicity in this MVP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function for enrichment logic
def _enrich_lead(lead: Lead) -> Lead:
    """Enrich a lead - normalize data and mark as enriched."""
    lead.is_enriched = True
    lead.job_title = lead.job_title.title()
    return lead

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Sales Doctor Lead Management API"}

@app.get("/leads", response_model=List[Lead])
def get_leads(
    industry: Optional[str] = Query(None, description="Filter by industry"),
    min_headcount: Optional[int] = Query(None, description="Minimum headcount"),
    max_headcount: Optional[int] = Query(None, description="Maximum headcount")
):
    filtered_leads = get_all_leads()
    
    if industry:
        # Case-insensitive partial match for better UX
        filtered_leads = [l for l in filtered_leads if industry.lower() in l.industry.lower()]
    
    if min_headcount is not None:
        filtered_leads = [l for l in filtered_leads if l.headcount >= min_headcount]
    
    if max_headcount is not None:
        filtered_leads = [l for l in filtered_leads if l.headcount <= max_headcount]
        
    return filtered_leads

@app.post("/leads", response_model=Lead)
def create_lead(lead: LeadCreate):
    # Generate ID
    current_leads = get_all_leads()
    new_id = 1
    if current_leads:
        new_id = max(l.id for l in current_leads) + 1
        
    new_lead = Lead(
        id=new_id,
        **lead.model_dump(),
        is_enriched=False,
        call_status=None
    )
    add_lead(new_lead)
    return new_lead

@app.post("/leads/{lead_id}/enrich", response_model=Lead)
def enrich_lead(lead_id: int):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Use the helper function
    enriched_lead = _enrich_lead(lead)
    update_lead(lead_id, enriched_lead)
    return enriched_lead

@app.post("/leads/bulk-enrich", response_model=BulkEnrichResponse)
def bulk_enrich_leads(request: BulkEnrichRequest):
    """Bulk enrich multiple leads. Best-effort: enriches found IDs, reports not-found IDs."""
    # Build lookup map for O(1) access
    lead_map = {lead.id: lead for lead in leads_db}
    
    enriched_leads: List[Lead] = []
    not_found_ids: List[int] = []
    
    for lead_id in request.lead_ids:
        if lead_id in lead_map:
            lead = lead_map[lead_id]
            # Enrich the lead
            enriched_lead = _enrich_lead(lead)
            # Update in database
            update_lead(lead_id, enriched_lead)
            enriched_leads.append(enriched_lead)
        else:
            not_found_ids.append(lead_id)
    
    return BulkEnrichResponse(
        enriched=enriched_leads,
        not_found=not_found_ids
    )


@app.post("/leads/by-phone/call-status")
def update_call_status_by_phone(request: dict):
    """
    Update call_status for a lead by phone number.
    Called by the dialer when a call completes.
    """
    phone_number = request.get("phone_number")
    call_status = request.get("call_status")
    
    if not phone_number or not call_status:
        raise HTTPException(status_code=422, detail="phone_number and call_status are required")
    
    # Find lead by phone number
    for lead in leads_db:
        if lead.phone_number == phone_number:
            # Update the call_status
            lead.call_status = call_status
            print(f"[CRM] Updated lead {lead.id} ({lead.name}) call_status to {call_status}")
            return {
                "success": True,
                "lead_id": lead.id,
                "name": lead.name,
                "phone_number": phone_number,
                "call_status": call_status
            }
    
    # Lead not found
    raise HTTPException(status_code=404, detail=f"Lead with phone number {phone_number} not found")
