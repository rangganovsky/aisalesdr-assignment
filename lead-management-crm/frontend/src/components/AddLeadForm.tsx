import { useState } from 'react';
import { createLead, type LeadCreate } from '../services/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { CheckCircle2, ChevronRight, UserPlus, AlertCircle } from 'lucide-react';

export const AddLeadForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState<LeadCreate>({
        name: '',
        job_title: '',
        phone_number: '',
        company: '',
        email: '',
        headcount: 0,
        industry: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear error on new submit attempt
        try {
            await createLead(formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError('Failed to create lead. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof LeadCreate, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (success) {
        return (
            <Card className="flex flex-col items-center justify-center p-16 text-center animate-in fade-in zoom-in duration-300 max-w-lg mx-auto mt-12">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Lead Added Successfully!</h3>
                <p className="text-gray-500 mt-2">Redirecting you back to the leads list...</p>
            </Card>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Lead</h2>
                <p className="text-gray-500 mt-1">Enter the details below to add a new prospect to your pipeline.</p>
            </div>

            <Card className="p-8 shadow-md">
                {/* Inline Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-red-700 text-sm">{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 border-b pb-2">Personal Information</h4>
                        </div>
                        <Input
                            required label="Full Name"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                        />
                        <Input
                            required label="Job Title"
                            placeholder="e.g. Chief Executive Officer"
                            value={formData.job_title}
                            onChange={e => handleChange('job_title', e.target.value)}
                        />
                        <Input
                            required label="Email Address"
                            type="email"
                            placeholder="john@company.com"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                        <Input
                            required label="Phone Number"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone_number}
                            onChange={e => handleChange('phone_number', e.target.value)}
                        />

                        <div className="col-span-1 md:col-span-2 mt-2">
                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 border-b pb-2">Company Details</h4>
                        </div>

                        <Input
                            required label="Company Name"
                            placeholder="e.g. Acme Corp"
                            value={formData.company}
                            onChange={e => handleChange('company', e.target.value)}
                        />
                        <Input
                            required label="Industry"
                            placeholder="e.g. SaaS, Fintech"
                            value={formData.industry}
                            onChange={e => handleChange('industry', e.target.value)}
                        />
                        <Input
                            required label="Headcount"
                            type="number"
                            placeholder="e.g. 100"
                            value={formData.headcount || ''}
                            onChange={e => handleChange('headcount', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
                        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
                        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto min-w-[140px]">
                            {loading ? 'Saving...' : (
                                <>
                                    Create Lead <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
