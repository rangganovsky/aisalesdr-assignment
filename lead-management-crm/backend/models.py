from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LeadBase(BaseModel):
    name: str
    job_title: str
    phone_number: str
    company: str
    email: EmailStr
    headcount: int
    industry: str

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    id: int
    is_enriched: bool = False
    call_status: Optional[str] = None  # e.g. CONNECTED, NO_ANSWER, BUSY, VOICEMAIL — set by dialer

    class Config:
        from_attributes = True

class BulkEnrichRequest(BaseModel):
    lead_ids: list[int] = Field(..., min_length=1)  # FastAPI returns 422 for empty list

class BulkEnrichResponse(BaseModel):
    enriched: list[Lead]
    not_found: list[int]
