import { Lead, CallRecord, DialerSession, CRMActivity, MockCRMContact } from './types';

export const leadsStore: Lead[] = [
  { id: '1', name: 'Alice Johnson',   company: 'TechCorp',    phone: '555-0101', email: 'alice@techcorp.com' },
  { id: '2', name: 'Bob Smith',        company: 'HealthInc',   phone: '555-0102', email: 'bob@healthinc.com' },
  { id: '3', name: 'Carol Williams',   company: 'FinanceHub',  phone: '555-0103', email: 'carol@financehub.com' },
  { id: '4', name: 'David Lee',        company: 'RetailGo',    phone: '555-0104', email: 'david@retailgo.com' },
  { id: '5', name: 'Eve Martinez',     company: 'EduFirst',    phone: '555-0105', email: 'eve@edufirst.com' },
  { id: '6', name: 'Frank Chen',       company: 'ManuCo',      phone: '555-0106', email: 'frank@manuco.com' },
  { id: '7', name: 'Grace Kim',        company: 'StartupX',    phone: '555-0107', email: 'grace@startupx.com' },
  { id: '8', name: 'Henry Davis',      company: 'LogisticsPro',phone: '555-0108', email: 'henry@logisticspro.com' },
];

export const callsStore:               CallRecord[]     = [];
export const sessionsStore:            DialerSession[]  = [];
export const crmActivitiesStore:       CRMActivity[]    = [];
export const mockCRMContactsStore:     MockCRMContact[] = [];
export const mockCRMActivitiesStore:   CRMActivity[]    = [];
