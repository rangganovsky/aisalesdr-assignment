import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Types
export interface Lead {
    id: number;
    name: string;
    job_title: string;
    phone_number: string;
    company: string;
    email: string;
    headcount: number;
    industry: string;
    is_enriched: boolean;
    call_status?: string | null;
}

export interface LeadCreate {
    name: string;
    job_title: string;
    phone_number: string;
    company: string;
    email: string;
    headcount: number;
    industry: string;
}

export interface BulkEnrichResponse {
    enriched: Lead[];
    not_found: number[];
}

export const getLeads = async (
    industry?: string,
    min_headcount?: number,
    max_headcount?: number
) => {
    const params = new URLSearchParams();
    if (industry) params.append('industry', industry);
    if (min_headcount !== undefined) params.append('min_headcount', min_headcount.toString());
    if (max_headcount !== undefined) params.append('max_headcount', max_headcount.toString());
    const response = await api.get<Lead[]>(`/leads?${params.toString()}`);
    return response.data;
};

export const createLead = async (data: LeadCreate) => {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
};

export const enrichLead = async (id: number) => {
    const response = await api.post<Lead>(`/leads/${id}/enrich`);
    return response.data;
};

export const bulkEnrichLeads = async (leadIds: number[]): Promise<BulkEnrichResponse> => {
    const response = await api.post<BulkEnrichResponse>('/leads/bulk-enrich', { lead_ids: leadIds });
    return response.data;
};
