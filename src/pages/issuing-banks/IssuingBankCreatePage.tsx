import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssuingBankSession } from '@/hooks/useIssuingBank';
import { AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'SN', name: 'Senegal' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

type Step = 'details' | 'review';

interface FormState {
  name: string;
  shortName: string;
  code: string;
  country: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  bankAddress: string;
  additionalInfo: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function IssuingBankCreatePage() {
  const navigate = useNavigate();
  const { create } = useCreateIssuingBankSession();

  const [step, setStep] = useState<Step>('details');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    shortName: '',
    code: '',
    country: '',
    contactFullName: '',
    contactEmail: '',
    contactPhone: '',
    bankAddress: '',
    additionalInfo: '',
  });

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Bank name is required';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'Bank name must be at least 3 characters';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'Bank name must not exceed 100 characters';
    }

    if (!form.shortName.trim()) {
      newErrors.shortName = 'Bank short name is required';
    } else if (form.shortName.trim().length < 2) {
      newErrors.shortName = 'Bank short name must be at least 2 characters';
    }

    if (!form.code.trim()) {
      newErrors.code = 'Bank code is required';
    } else if (!/^[A-Z0-9]{2,20}$/.test(form.code.trim())) {
      newErrors.code = 'Bank code must be 2-20 uppercase alphanumeric characters';
    }

    if (!form.country) {
      newErrors.country = 'Country is required';
    }

    if (!form.contactFullName.trim()) {
      newErrors.contactFullName = 'Contact name is required';
    } else if (form.contactFullName.trim().length < 2) {
      newErrors.contactFullName = 'Contact name must be at least 2 characters';
    }

    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (!form.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.contactPhone.trim())) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToReview = () => {
    if (!validate()) return;
    setStep('review');
  };

  const handleFinalSubmit = async () => {
    if (!validate()) {
      setStep('details');
      return;
    }

    if (!confirmed) {
      toast.error('Please confirm the details are accurate');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await create({
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        code: form.code.trim().toUpperCase(),
        country: form.country,
        contactFullName: form.contactFullName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        bankAddress: form.bankAddress.trim() || undefined,
        additionalInfo: form.additionalInfo.trim() || undefined,
      });

      toast.success('Bank created successfully. Starting provisioning...');
      navigate(`/issuing-banks/${session.sessionId}/provisioning`);
    } catch (error) {
      toast.error('Failed to create issuing bank');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/issuing-banks');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Add Issuing Bank"
            subtitle="Capture the bank details, review them, then submit once to provision the bank."
          />

          <div className="max-w-3xl space-y-6">
            <div className="kardit-card p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                    step === 'details' ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 1</p>
                  <p className="font-semibold">Bank Details</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'review' || validate()) setStep('review');
                  }}
                  className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                    step === 'review' ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 2</p>
                  <p className="font-semibold">Review & Submit</p>
                </button>
              </div>
            </div>

            {step === 'details' && (
              <div className="space-y-6">
                <div className="kardit-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Bank Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="e.g., Example Bank Plc"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.name ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="shortName" className="block text-sm font-medium mb-1">
                        Bank Short Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="shortName"
                        type="text"
                        value={form.shortName}
                        onChange={(e) => set('shortName', e.target.value)}
                        placeholder="e.g., Example Bank"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.shortName ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.shortName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.shortName}</p>}
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-sm font-medium mb-1">
                        Bank Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="code"
                        type="text"
                        value={form.code}
                        onChange={(e) => set('code', e.target.value.toUpperCase())}
                        placeholder="e.g., EXB001"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.code ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.code && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.code}</p>}
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <Select value={form.country} onValueChange={(value) => set('country', value)}>
                        <SelectTrigger className={`bg-muted ${errors.country ? 'border-red-500' : 'border-border'}`}>
                          <SelectValue placeholder="Select country..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.country}</p>}
                    </div>
                  </div>
                </div>

                <div className="kardit-card p-6">
                  <h2 className="text-lg font-semibold mb-6">Contact Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                        Contact Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.contactFullName}
                        onChange={(e) => set('contactFullName', e.target.value)}
                        placeholder="e.g., Bank Admin"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.contactFullName ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.contactFullName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.contactFullName}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => set('contactEmail', e.target.value)}
                        placeholder="admin@examplebank.com"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.contactEmail ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.contactEmail && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.contactEmail}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.contactPhone}
                        onChange={(e) => set('contactPhone', e.target.value)}
                        placeholder="+2348012345678"
                        className={`flex h-10 w-full rounded-md border ${
                          errors.contactPhone ? 'border-red-500' : 'border-border'
                        } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      />
                      {errors.contactPhone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.contactPhone}</p>}
                    </div>
                  </div>
                </div>

                <div className="kardit-card p-6">
                  <h2 className="text-lg font-semibold mb-6">Additional Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium mb-1">
                        Bank Address
                      </label>
                      <textarea
                        id="address"
                        rows={2}
                        value={form.bankAddress}
                        onChange={(e) => set('bankAddress', e.target.value)}
                        placeholder="Enter the bank's physical address"
                        className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div>
                      <label htmlFor="info" className="block text-sm font-medium mb-1">
                        Additional Information
                      </label>
                      <textarea
                        id="info"
                        rows={3}
                        value={form.additionalInfo}
                        onChange={(e) => set('additionalInfo', e.target.value)}
                        placeholder="Any additional details about the bank"
                        className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleContinueToReview} className="bg-blue-600 hover:bg-blue-700">
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <div className="kardit-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Review Bank Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                      <p className="font-semibold text-foreground">{form.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bank Short Name</p>
                      <p className="font-semibold text-foreground">{form.shortName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bank Code</p>
                      <p className="font-semibold text-foreground">{form.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Country</p>
                      <p className="font-semibold text-foreground">{form.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contact Name</p>
                      <p className="font-semibold text-foreground">{form.contactFullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contact Phone</p>
                      <p className="font-semibold text-foreground">{form.contactPhone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Contact Email</p>
                      <p className="font-semibold text-foreground">{form.contactEmail}</p>
                    </div>
                    {form.bankAddress && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Bank Address</p>
                        <p className="font-semibold text-foreground whitespace-pre-wrap">{form.bankAddress}</p>
                      </div>
                    )}
                    {form.additionalInfo && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Additional Information</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{form.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="kardit-card p-6 border-l-4 border-l-blue-500">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border border-border text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-foreground">I confirm the details are accurate</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The bank creation request will be sent only when you click the final submit button below.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isSubmitting}>
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={!confirmed || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Provisioning'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
