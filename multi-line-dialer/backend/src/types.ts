export type CallStatusEnum =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'VOICEMAIL'
  | 'CANCELED_BY_DIALER';

export type SessionStatus = 'STOPPED' | 'RUNNING';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  crmExternalId?: string;
}

export interface CallRecord {
  id: string;
  leadId: string;
  sessionId: string;
  status: CallStatusEnum;
  startedAt: Date;
  endedAt?: Date;
  providerCallId: string;
}

export interface DialerSession {
  id: string;
  agentId: string;
  leadQueue: string[];       // remaining lead IDs not yet dialed
  concurrency: 2;
  activeCallIds: string[];   // max 2 at any time
  winnerCallId?: string;
  status: SessionStatus;
  metrics: {
    attempted: number;
    connected: number;
    failed: number;
    canceled: number;
  };
}

export interface CRMActivity {
  id: string;
  leadId: string;
  crmExternalId: string;
  type: 'CALL';
  callId: string;
  disposition: CallStatusEnum;
  notes: string;
  createdAt: Date;
}

export interface MockCRMContact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  createdAt: Date;
}
