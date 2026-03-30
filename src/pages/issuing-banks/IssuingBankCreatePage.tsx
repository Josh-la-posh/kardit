import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCreateIssuingBankSession, useIssuingBankSession } from '@/hooks/useIssuingBank';
import { Building2, AlertCircle } from 'lucide-react';
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
  const { sessionId } = useParams<{ sessionId: string }>();
  const { create } = useCreateIssuingBankSession();
  const { session: existingSession, isLoading: sessionLoading, updateBankDetails } = useIssuingBankSession(sessionId);

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load existing session data if editing
  useEffect(() => {
    if (existingSession && !sessionLoading) {
      setForm({
        name: existingSession.bankDetails.name,
        shortName: existingSession.bankDetails.shortName,
        code: existingSession.bankDetails.code,
        country: existingSession.bankDetails.country,
        contactFullName: (existingSession.bankDetails as any).contactFullName || '',
        contactEmail: existingSession.bankDetails.contactEmail,
        contactPhone: existingSession.bankDetails.contactPhone,
        bankAddress: existingSession.bankDetails.bankAddress || '',
        additionalInfo: existingSession.bankDetails.additionalInfo || '',
      });
    }
  }, [existingSession, sessionLoading]);

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Bank name is required';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'Bank name must be at least 3 characters';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'Bank name must not exceed 100 characters';
    }

    // Code validation
    if (!form.code.trim()) {
      newErrors.code = 'Bank code is required';
    } else if (!/^[A-Z0-9]{2,20}$/.test(form.code.trim())) {
      newErrors.code = 'Bank code must be 2-20 uppercase alphanumeric characters';
    }

    // Country validation
    if (!form.country) {
      newErrors.country = 'Country is required';
    }

    // Contact Full Name validation
    if (!form.contactFullName.trim()) {
      newErrors.contactFullName = 'Contact name is required';
    } else if (form.contactFullName.trim().length < 2) {
      newErrors.contactFullName = 'Contact name must be at least 2 characters';
    }

    // Email validation
    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (!form.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.contactPhone.trim())) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      let targetSessionId = sessionId;

      // If editing existing session, update it; otherwise create new
      if (existingSession) {
        // Update existing session
        await updateBankDetails({
          name: form.name.trim(),
          shortName: form.shortName.trim(),
          code: form.code.trim().toUpperCase(),
          country: form.country,
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          bankAddress: form.bankAddress.trim() || undefined,
          additionalInfo: form.additionalInfo.trim() || undefined,
        } as any);
        toast.success('Bank details updated');
      } else {
        // Create new session
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
        targetSessionId = session.sessionId;
        toast.success('Bank details saved');
      }

      navigate(`/issuing-banks/${targetSessionId}/review`);
    } catch (err) {
      toast.error('Failed to save bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/issuing-banks');
  };

  // Show loading state while existing session is being loaded
  if (sessionId && sessionLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bank details...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const isEditing = !!sessionId && !!existingSession;

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={isEditing ? 'Edit Bank Details' : 'Add Issuing Bank'}
            subtitle={isEditing ? 'Update the bank information before resubmitting' : 'Enter the details of the issuing bank you want to provision'}
          />

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bank Information Card */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Bank Information</h2>
                </div>

                <div className="space-y-4">
                  {/* Bank Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g., Alpha Bank"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.name ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Bank Short Name */}
                  <div>
                    <label htmlFor="shortName" className="block text-sm font-medium mb-1">
                      Bank Short Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="shortName"
                      type="text"
                      value={form.shortName}
                      onChange={(e) => set('shortName', e.target.value)}
                      placeholder="e.g., Alpha Bank"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.shortName ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.shortName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.shortName}
                      </p>
                    )}
                  </div>

                  {/* Bank Code */}
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium mb-1">
                      Bank Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={form.code}
                      onChange={(e) => set('code', e.target.value.toUpperCase())}
                      placeholder="e.g., ALPHA"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.code ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.code && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.code}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Select value={form.country} onValueChange={(v) => set('country', v)}>
                      <SelectTrigger
                        className={`bg-muted border-border ${
                          errors.country ? 'border-red-500' : ''
                        }`}
                      >
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="kardit-card p-6">
                <h2 className="text-lg font-semibold mb-6">Contact Information</h2>

                <div className="space-y-4">
                  {/* Contact Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                      Contact Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.contactFullName}
                      onChange={(e) => set('contactFullName', e.target.value)}
                      placeholder="e.g., John Doe"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.contactFullName ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.contactFullName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactFullName}
                      </p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => set('contactEmail', e.target.value)}
                      placeholder="contact@bank.com"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.contactEmail ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.contactEmail && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactEmail}
                      </p>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => set('contactPhone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className={`flex h-10 w-full rounded-md border ${
                        errors.contactPhone ? 'border-red-500' : 'border-border'
                      } bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                    {errors.contactPhone && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information Card */}
              <div className="kardit-card p-6">
                <h2 className="text-lg font-semibold mb-6">Additional Information</h2>

                <div className="space-y-4">
                  {/* Bank Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Bank Address
                    </label>
                    <textarea
                      id="address"
                      value={form.bankAddress}
                      onChange={(e) => set('bankAddress', e.target.value)}
                      placeholder="Enter the bank's physical address"
                      rows={2}
                      className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Additional Info */}
                  <div>
                    <label htmlFor="info" className="block text-sm font-medium mb-1">
                      Additional Information
                    </label>
                    <textarea
                      id="info"
                      value={form.additionalInfo}
                      onChange={(e) => set('additionalInfo', e.target.value)}
                      placeholder="Any additional details about the bank"
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Details' : 'Next'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
