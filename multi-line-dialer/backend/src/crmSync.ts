import axios from 'axios';
import { v4 as uuid } from 'uuid';
import {
  leadsStore,
  crmActivitiesStore,
  mockCRMContactsStore,
  mockCRMActivitiesStore,
} from './db';
import { CallRecord, CRMActivity, MockCRMContact } from './types';

// Module-level idempotency guard. Safe for in-memory (same process lifetime).
const syncedCallIds = new Set<string>();

// CRM API configuration
const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:8000';

export const crmSync = {
  sync(call: CallRecord): void {
    if (syncedCallIds.has(call.id)) {
      console.log(`[crm-sync] call:${call.id} already synced (idempotency), skipping`);
      return;
    }
    syncedCallIds.add(call.id);

    const lead = leadsStore.find((l) => l.id === call.leadId);
    if (!lead) return; // defensive: shouldn't happen with valid session data

    // 1. Upsert mock CRM contact if lead has no external ID
    if (!lead.crmExternalId) {
      const contact: MockCRMContact = {
        id: uuid(),
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        createdAt: new Date(),
      };
      mockCRMContactsStore.push(contact);
      lead.crmExternalId = contact.id;
    }

    // 2. Create CRM activity — push same object ref to both stores (two views, one record)
    const activity: CRMActivity = {
      id: uuid(),
      leadId: call.leadId,
      crmExternalId: lead.crmExternalId,
      type: 'CALL',
      callId: call.id,
      disposition: call.status,
      notes: `Call ${call.status.toLowerCase().replace(/_/g, ' ')} at ${call.endedAt?.toISOString() ?? 'unknown'}`,
      createdAt: new Date(),
    };

    crmActivitiesStore.push(activity);
    mockCRMActivitiesStore.push(activity);

    // 3. Sync to actual CRM backend (lead-management-crm)
    crmSync.syncToCRMBackend(lead.phone, call.status);

    console.log(`[crm-sync] call:${call.id} disposition:${call.status} → activity created for lead:${call.leadId}`);
  },

  async syncToCRMBackend(phoneNumber: string, callStatus: string): Promise<void> {
    try {
      const response = await axios.post(`${CRM_API_URL}/leads/by-phone/call-status`, {
        phone_number: phoneNumber,
        call_status: callStatus,
      });
      console.log(`[crm-sync] Synced to CRM backend: ${response.data.name} → ${callStatus}`);
    } catch (error: any) {
      // Log but don't fail — the mock CRM sync still worked
      if (error.response?.status === 404) {
        console.log(`[crm-sync] Lead with phone ${phoneNumber} not found in CRM backend (OK - dialer has different lead set)`);
      } else {
        console.error(`[crm-sync] Failed to sync to CRM backend:`, error.message);
      }
    }
  },
};
