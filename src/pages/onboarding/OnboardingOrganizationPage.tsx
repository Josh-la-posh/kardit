import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function OnboardingOrganizationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, updateOrganization, updateContact } = useOnboardingDraft(draftId);

  const initial = useMemo(() => {
    return {
      legalName: draft?.organization?.legalName || '',
      registrationNumber: draft?.organization?.registrationNumber || '',
      country: draft?.organization?.country || '',
      addressLine1: draft?.organization?.addressLine1 || '',
      addressLine2: draft?.organization?.addressLine2 || '',
      city: draft?.organization?.city || '',
      state: draft?.organization?.state || '',
      contactName: draft?.contact?.contactName || '',
      contactEmail: draft?.contact?.contactEmail || draft?.email || '',
      contactPhone: draft?.contact?.contactPhone || draft?.phone || '',
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
    if (!form.legalName || !form.registrationNumber || !form.country || !form.addressLine1) {
      setLocalError('Please complete all required organization fields');
      return;
    }
    if (!form.contactName || !form.contactEmail || !form.contactPhone) {
      setLocalError('Please complete all required contact fields');
      return;
    }

    setSaving(true);
    try {
      await updateOrganization({
        legalName: form.legalName,
        registrationNumber: form.registrationNumber,
        country: form.country,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });
      await updateContact({
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      });
      navigate(`/onboarding/${draftId}/documents`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <KarditLogo size="md" />
        </div>

        <div className="kardit-card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Organization & contact details</h1>
            <p className="text-sm text-muted-foreground">Provide your business information.</p>
          </div>

          {(localError || error) && (
            <div className="mb-5 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={onNext} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Legal Name" value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={saving} />
                <TextField label="Registration Number" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} disabled={saving} />
                <TextField label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} disabled={saving} />
                <TextField label="State" value={form.state} onChange={(e) => set('state', e.target.value)} disabled={saving} />
                <TextField label="City" value={form.city} onChange={(e) => set('city', e.target.value)} disabled={saving} />
                <TextField label="Address Line 1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={saving} />
                <TextField label="Address Line 2" value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} disabled={saving} />
              </div>

              <div className="pt-4 border-t border-border">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Primary Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField label="Full Name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} disabled={saving} />
                  <TextField label="Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={saving} />
                  <TextField label="Phone" type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={saving} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/onboarding/start')} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Next'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
