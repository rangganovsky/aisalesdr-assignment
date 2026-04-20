import { useEffect, useState, useCallback } from 'react';
import { getLeads, enrichLead, bulkEnrichLeads, type Lead, type BulkEnrichResponse } from '../services/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Users, RefreshCw, Wand2, Filter, AlertCircle, CheckSquare, Square } from 'lucide-react';

// Headcount range options
const HEADCOUNT_OPTIONS = [
    { label: 'All', min: undefined, max: undefined },
    { label: '1–50', min: 1, max: 50 },
    { label: '51–200', min: 51, max: 200 },
    { label: '201–1000', min: 201, max: 1000 },
    { label: '1000+', min: 1000, max: undefined },
];

export const LeadTable = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ industry: '', headcountRange: 'All' });
    const [enriching, setEnriching] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkEnriching, setBulkEnriching] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Clear selection when filters change
    useEffect(() => {
        setSelected(new Set());
        setBulkResult(null);
    }, [filters]);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const rangeOption = HEADCOUNT_OPTIONS.find(o => o.label === filters.headcountRange);
            const data = await getLeads(
                filters.industry,
                rangeOption?.min,
                rangeOption?.max
            );
            setLeads(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load leads. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleEnrich = async (id: number) => {
        setEnriching(id);
        setError(null);
        try {
            await enrichLead(id);
            await fetchLeads();
        } catch (err) {
            console.error(err);
            setError('Failed to enrich lead. Please try again.');
        } finally {
            setEnriching(null);
        }
    };

    // Checkbox selection handlers - immutable Set updates
    const toggleLead = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        const allVisible = selected.size === leads.length && leads.length > 0;
        setSelected(allVisible ? new Set() : new Set(leads.map(l => l.id)));
    };

    const handleBulkEnrich = async () => {
        if (selected.size === 0) return;
        
        setBulkEnriching(true);
        setBulkResult(null);
        setError(null);
        
        try {
            const result: BulkEnrichResponse = await bulkEnrichLeads(Array.from(selected));
            await fetchLeads(); // Re-fetch first to reflect actual DB state
            
            const enrichedCount = result.enriched.length;
            const notFoundCount = result.not_found.length;
            
            if (notFoundCount > 0) {
                setBulkResult({
                    message: `Enriched ${enrichedCount} leads (${notFoundCount} not found)`,
                    type: 'success'
                });
            } else {
                setBulkResult({
                    message: `Enriched ${enrichedCount} leads successfully`,
                    type: 'success'
                });
            }
            
            setSelected(new Set()); // Clear selection after bulk enrich
        } catch (err) {
            console.error(err);
            setBulkResult({
                message: 'Failed to enrich leads. Please try again.',
                type: 'error'
            });
        } finally {
            setBulkEnriching(false);
        }
    };

    const allSelected = leads.length > 0 && selected.size === leads.length;
    const someSelected = selected.size > 0 && selected.size < leads.length;

    return (
        <div className="space-y-6">
            {/* Inline Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-red-700 text-sm">{error}</div>
                </div>
            )}

            {/* Bulk Result Message */}
            {bulkResult && (
                <div className={`rounded-lg p-4 flex items-start gap-3 ${
                    bulkResult.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">{bulkResult.message}</div>
                </div>
            )}

            <Card className="p-5 bg-white shadow-sm ring-1 ring-gray-200/75">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <Input
                            label="Industry"
                            placeholder="search industry..."
                            value={filters.industry}
                            onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                        />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Headcount</label>
                            <select
                                value={filters.headcountRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, headcountRange: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                {HEADCOUNT_OPTIONS.map(option => (
                                    <option key={option.label} value={option.label}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Bulk Enrich Button */}
                        {selected.size > 0 && (
                            <Button 
                                variant="primary" 
                                onClick={handleBulkEnrich}
                                disabled={bulkEnriching}
                                className="h-10"
                            >
                                {bulkEnriching ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Enriching...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Enrich Selected ({selected.size})
                                    </>
                                )}
                            </Button>
                        )}
                        <Button variant="secondary" onClick={fetchLeads} className="h-10 mb-[1px]">
                            <Filter className="w-4 h-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden shadow-sm ring-1 ring-gray-200/75 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <button 
                                        onClick={toggleAll}
                                        className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                    >
                                        {allSelected ? (
                                            <CheckSquare className="w-4 h-4" />
                                        ) : someSelected ? (
                                            <div className="w-4 h-4 border-2 border-indigo-500 rounded bg-indigo-500 flex items-center justify-center">
                                                <div className="w-2 h-0.5 bg-white rounded" />
                                            </div>
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                                {['ID', 'Name', 'Title', 'Company', 'Contact', 'Headcount', 'Industry', 'Call Status', 'Status', 'Actions'].map((h) => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && leads.length === 0 ? (
                                <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500 italic">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500 italic">No leads found matching criteria.</td></tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => toggleLead(lead.id)}
                                                className="flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                            >
                                                {selected.has(lead.id) ? (
                                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">#{lead.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{lead.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lead.job_title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {lead.company.charAt(0)}
                                                </div>
                                                {lead.company}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{lead.email}</div>
                                            <div className="text-xs text-gray-500">{lead.phone_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-gray-400" /> {lead.headcount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {lead.industry}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.call_status || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lead.is_enriched ? (
                                                <Badge variant="success">Enriched</Badge>
                                            ) : (
                                                <Badge variant="warning">Raw</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {!lead.is_enriched ? (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => handleEnrich(lead.id)}
                                                    disabled={enriching === lead.id}
                                                    className="text-xs h-8 px-3"
                                                >
                                                    {enriching === lead.id ? (
                                                        <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                                                    ) : (
                                                        <Wand2 className="w-3 h-3 mr-1.5" />
                                                    )}
                                                    Enrich
                                                </Button>
                                            ) : (
                                                <span className="text-gray-400 text-xs flex items-center justify-end gap-1">
                                                    <CheckCircleIcon className="w-3 h-3" /> All set
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Simple icon for "All set"
const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
)
