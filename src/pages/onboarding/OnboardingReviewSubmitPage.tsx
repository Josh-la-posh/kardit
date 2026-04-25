import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingReviewSubmitPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, submit } = useOnboardingDraft(draftId);
  const { banks } = useIssuingBanks();
  const [infoAccurate, setInfoAccurate] = useState(false);
  const [authorizedSigner, setAuthorizedSigner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const issuingBankNames = useMemo(() => {
    const map = new Map(banks.map((bank) => [bank.bankDetails.code, bank.bankDetails.name] as const));
    return (draft?.issuingBankIds || []).map((code) => map.get(code) || code);
  }, [banks, draft?.issuingBankIds]);

  const onSubmit = async () => {
    setLocalError(null);
    if (!draftId || !draft) return;
    if (!infoAccurate || !authorizedSigner) {
      setLocalError('Please accept the declarations to submit.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submit({
        onboardingSessionId: draft.onboardingSessionId,
        declarations: { infoAccurate, authorizedSigner },
      });
      toast.success('Onboarding submitted');
      navigate(`/onboarding/success/${res.caseId}`);
    } catch (e: any) {
      setLocalError(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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
            <h1 className="text-xl font-semibold">Review & submit</h1>
            <p className="text-sm text-muted-foreground">Confirm details before submission.</p>
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
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-md border border-border p-4">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Organization</h2>
                  <p className="text-sm">{draft?.organization?.legalName || '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    Reg No: {draft?.organization?.registrationNumber || '-'}
                  </p>
                </div>

                <div className="rounded-md border border-border p-4">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h2>
                  <p className="text-sm">{draft?.organization?.primaryContact?.fullName || '-'}</p>
                  <p className="text-xs text-muted-foreground">{draft?.organization?.primaryContact?.email || '-'}</p>
                </div>

                <div className="rounded-md border border-border p-4 md:col-span-2">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documents</h2>
                  <p className="text-sm text-muted-foreground">{draft?.documents?.length || 0} document(s) uploaded</p>
                </div>

                <div className="rounded-md border border-border p-4 md:col-span-2">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Issuing Banks</h2>
                  {issuingBankNames.length ? (
                    <ul className="space-y-1 text-sm">
                      {issuingBankNames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">None selected</p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={infoAccurate}
                    onChange={(e) => setInfoAccurate(e.target.checked)}
                    disabled={submitting}
                  />
                  <span>I confirm the information provided is accurate.</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={authorizedSigner}
                    onChange={(e) => setAuthorizedSigner(e.target.checked)}
                    disabled={submitting}
                  />
                  <span>I confirm I am an authorized signer for this organization.</span>
                </label>
              </div>

              <div className="mt-6 flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={submitting}>
                  Back
                </Button>
                <Button type="button" onClick={onSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
