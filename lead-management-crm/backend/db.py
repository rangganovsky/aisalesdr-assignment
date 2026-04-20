from typing import List, Optional
from models import Lead

# In-memory database with diverse mock data
leads_db: List[Lead] = [
    # Original seed leads
    Lead(
        id=1,
        name="John Doe",
        job_title="CEO",
        phone_number="555-0101",
        company="Tech Corp",
        email="john@techcorp.com",
        headcount=100,
        industry="Technology",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=2,
        name="Jane Smith",
        job_title="CTO",
        phone_number="555-0102",
        company="Health Inc",
        email="jane@healthinc.com",
        headcount=500,
        industry="Healthcare",
        is_enriched=True,
        call_status="CONNECTED"
    ),
    
    # Additional mock leads (10 more)
    Lead(
        id=3,
        name="Michael Chen",
        job_title="VP of Engineering",
        phone_number="555-0103",
        company="DataFlow Systems",
        email="michael@dataflow.io",
        headcount=250,
        industry="Technology",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=4,
        name="Sarah Williams",
        job_title="Chief Marketing Officer",
        phone_number="555-0104",
        company="GrowthLabs",
        email="sarah@growthlabs.com",
        headcount=75,
        industry="Marketing",
        is_enriched=True,
        call_status="NO_ANSWER"
    ),
    Lead(
        id=5,
        name="Robert Johnson",
        job_title="Director of Sales",
        phone_number="555-0105",
        company="Enterprise Solutions",
        email="robert@enterprise.com",
        headcount=1200,
        industry="Enterprise Software",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=6,
        name="Emily Brown",
        job_title="Head of Product",
        phone_number="555-0106",
        company="ProductFirst",
        email="emily@productfirst.co",
        headcount=45,
        industry="SaaS",
        is_enriched=True,
        call_status="BUSY"
    ),
    Lead(
        id=7,
        name="David Martinez",
        job_title="CEO",
        phone_number="555-0107",
        company="FinanceHub Pro",
        email="david@financehub.com",
        headcount=350,
        industry="Finance",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=8,
        name="Lisa Anderson",
        job_title="VP of Operations",
        phone_number="555-0108",
        company="Logistics Plus",
        email="lisa@logisticsplus.net",
        headcount=800,
        industry="Logistics",
        is_enriched=True,
        call_status="VOICEMAIL"
    ),
    Lead(
        id=9,
        name="James Wilson",
        job_title="Chief Technology Officer",
        phone_number="555-0109",
        company="CloudNative Inc",
        email="james@cloudnative.io",
        headcount=180,
        industry="Cloud Computing",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=10,
        name="Amanda Taylor",
        job_title="Director of HR",
        phone_number="555-0110",
        company="PeopleFirst HR",
        email="amanda@peoplefirst.com",
        headcount=60,
        industry="Human Resources",
        is_enriched=True,
        call_status="CANCELED_BY_DIALER"
    ),
    Lead(
        id=11,
        name="Christopher Lee",
        job_title="Founder & CEO",
        phone_number="555-0111",
        company="StartupX",
        email="chris@startupx.io",
        headcount=25,
        industry="Startups",
        is_enriched=False,
        call_status=None
    ),
    Lead(
        id=12,
        name="Jennifer Garcia",
        job_title="VP of Customer Success",
        phone_number="555-0112",
        company="CustomerDelight",
        email="jennifer@customerdelight.co",
        headcount=150,
        industry="Customer Service",
        is_enriched=True,
        call_status="CONNECTED"
    ),
]

def get_all_leads() -> List[Lead]:
    return leads_db

def add_lead(lead: Lead) -> Lead:
    leads_db.append(lead)
    return lead

def get_lead(lead_id: int) -> Optional[Lead]:
    for lead in leads_db:
        if lead.id == lead_id:
            return lead
    return None

def update_lead(lead_id: int, updated_lead: Lead) -> Optional[Lead]:
    for index, lead in enumerate(leads_db):
        if lead.id == lead_id:
            leads_db[index] = updated_lead
            return updated_lead
    return None
