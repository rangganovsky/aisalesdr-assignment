import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001',
});

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  crmExternalId?: string;
}

export type CallStatusEnum =
  | 'CONNECTING' | 'CONNECTED' | 'NO_ANSWER'
  | 'BUSY' | 'VOICEMAIL' | 'CANCELED_BY_DIALER';

export interface CallResult {
  id: string;
  leadId: string;
  status: CallStatusEnum;
  startedAt: string;
  endedAt?: string;
  crmActivityCreated: boolean;
}

export interface SessionResponse {
  id: string;
  agentId: string;
  leadQueue: string[];
  activeCallIds: string[];
  winnerCallId?: string;
  status: 'RUNNING' | 'STOPPED';
  metrics: { attempted: number; connected: number; failed: number; canceled: number };
  calls: CallResult[];
}

export const getLeads = () => api.get<Lead[]>('/leads').then((r) => r.data);

export const createSession = (leadIds: string[], agentId = 'agent-1') =>
  api.post<SessionResponse>('/sessions', { leadIds, agentId }).then((r) => r.data);

export const startSession = (id: string) =>
  api.post<SessionResponse>(`/sessions/${id}/start`).then((r) => r.data);

export const stopSession = (id: string) =>
  api.post<SessionResponse>(`/sessions/${id}/stop`).then((r) => r.data);

export const getSession = (id: string) =>
  api.get<SessionResponse>(`/sessions/${id}`).then((r) => r.data);
