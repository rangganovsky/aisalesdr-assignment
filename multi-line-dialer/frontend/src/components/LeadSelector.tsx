import { useEffect, useState, useCallback } from 'react';
import { getLeads, createSession, Lead } from '../services/api';

interface Props {
  onSessionCreated: (sessionId: string) => void;
}

export function LeadSelector({ onSessionCreated }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getLeads().then((data) => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  const toggleLead = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === leads.length) {
        return new Set();
      }
      return new Set(leads.map((l) => l.id));
    });
  }, [leads]);

  const handleCreate = useCallback(async () => {
    if (selected.size === 0) return;
    setCreating(true);
    const leadIds = Array.from(selected);
    const session = await createSession(leadIds);
    setCreating(false);
    onSessionCreated(session.id);
  }, [selected, onSessionCreated]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select Leads</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{selected.size} selected</span>
          <button
            onClick={toggleAll}
            className="text-sm text-blue-600 hover:underline"
          >
            {selected.size === leads.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {leads.map((lead) => {
          const isSelected = selected.has(lead.id);
          return (
            <label
              key={lead.id}
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleLead(lead.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-gray-500">
                  {lead.company} • {lead.phone} • {lead.email}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          disabled={selected.size === 0 || creating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {creating ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </div>
  );
}
