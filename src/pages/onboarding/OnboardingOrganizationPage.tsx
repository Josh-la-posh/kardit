import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

export default function OnboardingOrganizationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, updateOrganization } = useOnboardingDraft(draftId);

  const initial = useMemo(() => {
    return {
      legalName: draft?.organization?.legalName || '',
      tradingName: draft?.organization?.tradingName || '',
      registrationNumber: draft?.organization?.registrationNumber || '',
      addressLine1: draft?.organization?.address?.line1 || '',
      city: draft?.organization?.address?.city || '',
      state: draft?.organization?.address?.state || '',
      country: draft?.organization?.address?.country || '',
      contactFullName: draft?.organization?.primaryContact?.fullName || '',
      contactEmail: draft?.organization?.primaryContact?.email || draft?.email || '',
      contactPhone: draft?.organization?.primaryContact?.phone || draft?.phone || '',
    };
  }, [draft]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!draftId || !draft) return;

    if (!form.legalName || !form.registrationNumber || !form.country || !form.addressLine1 || !form.contactFullName || !form.contactEmail || !form.contactPhone) {
      setLocalError('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      if (!draft?.onboardingSessionId) {
        setLocalError('Missing onboarding session ID. Please restart onboarding.');
        return;
      }
      await updateOrganization({
        onboardingSessionId: draft.onboardingSessionId,
        legalName: form.legalName,
        tradingName: form.tradingName,
        registrationNumber: form.registrationNumber,
        address: {
          line1: form.addressLine1,
          city: form.city,
          state: form.state,
          country: form.country,
        },
        primaryContact: {
          fullName: form.contactFullName,
          email: form.contactEmail,
          phone: form.contactPhone,
        },
      });
      navigate(`/onboarding/${draftId}/documents`);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save organization details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicOnboardingLayout
      currentStep="organization"
      draftId={draftId}
      draft={draft}
      title="Organization & contact details"
      description="Provide the core business and contact information required to begin your affiliate KYB review."
    >
      <div className="animate-fade-in">

        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={onNext} className="space-y-8">
            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Business information</h3>
                <p className="mt-1 text-sm text-slate-600">Enter the official details exactly as they appear in your registration records.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Legal Name" value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Trading Name" value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Registration Number" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="State" value={form.state} onChange={(e) => set('state', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} disabled={saving} />
                <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white md:col-span-2" label="Address Line 1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={saving} />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Primary contact</h3>
                <p className="mt-1 text-sm text-slate-600">We will use this contact for onboarding communication and verification updates.</p>
              </div>
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contact details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Full Name" value={form.contactFullName} onChange={(e) => set('contactFullName', e.target.value)} disabled={saving} />
                  <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={saving} />
                  <TextField className="h-12 rounded-xl border-[#d6e3d8] bg-white" label="Phone" type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={saving} />
                </div>
              </div>
            </section>

            <div className="flex flex-col justify-end gap-3 border-t border-[#e6eee7] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={() => navigate('/onboarding/start')} disabled={saving}>Cancel</Button>
              <Button type="submit" className="h-11 rounded-xl px-6" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save and continue'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
