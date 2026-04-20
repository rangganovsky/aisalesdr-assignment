import { Lead, CallRecord, DialerSession, CRMActivity, MockCRMContact } from './types';

// Seed data matches CRM backend (lead-management-crm/backend/db.py) by phone number.
// Phone number is the join key used by crmSync to update call_status in the CRM.
export const leadsStore: Lead[] = [
  { id: '1',  name: 'John Doe',        company: 'Tech Corp',          phone: '555-0101', email: 'john@techcorp.com' },
  { id: '2',  name: 'Jane Smith',      company: 'Health Inc',         phone: '555-0102', email: 'jane@healthinc.com' },
  { id: '3',  name: 'Michael Chen',    company: 'DataFlow Systems',   phone: '555-0103', email: 'michael@dataflow.io' },
  { id: '4',  name: 'Sarah Williams',  company: 'GrowthLabs',         phone: '555-0104', email: 'sarah@growthlabs.com' },
  { id: '5',  name: 'Robert Johnson',  company: 'Enterprise Solutions',phone: '555-0105', email: 'robert@enterprise.com' },
  { id: '6',  name: 'Emily Brown',     company: 'ProductFirst',       phone: '555-0106', email: 'emily@productfirst.co' },
  { id: '7',  name: 'David Martinez',  company: 'FinanceHub Pro',     phone: '555-0107', email: 'david@financehub.com' },
  { id: '8',  name: 'Lisa Anderson',   company: 'Logistics Plus',     phone: '555-0108', email: 'lisa@logisticsplus.net' },
];

export const callsStore:               CallRecord[]     = [];
export const sessionsStore:            DialerSession[]  = [];
export const crmActivitiesStore:       CRMActivity[]    = [];
export const mockCRMContactsStore:     MockCRMContact[] = [];
export const mockCRMActivitiesStore:   CRMActivity[]    = [];
