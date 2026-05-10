import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

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
    <PublicOnboardingLayout
      currentStep="review"
      draftId={draftId}
      draft={draft}
      title="Review and submit"
      description="Check your draft before submission. If you need to make changes, you can go back to previous steps. Once you submit, our team will review your information and get in touch if we need anything else."
    >
      <div className="animate-fade-in">

        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Submission summary</h3>
                <p className="mt-1 text-sm text-muted-foreground">Everything below is pulled from the same data you already entered in earlier steps.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-5">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Organization</h2>
                  <p className="text-sm font-medium text-foreground">{draft?.organization?.legalName || '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    Reg No: {draft?.organization?.registrationNumber || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-5">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Contact</h2>
                  <p className="text-sm font-medium text-foreground">{draft?.organization?.primaryContact?.fullName || '-'}</p>
                  <p className="text-xs text-muted-foreground">{draft?.organization?.primaryContact?.email || '-'}</p>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-5 md:col-span-2">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Documents</h2>
                  <p className="text-sm text-[hsl(var(--text-secondary))]">{draft?.documents?.length || 0} document(s) uploaded</p>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-5 md:col-span-2">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Issuing Banks</h2>
                  {issuingBankNames.length ? (
                    <ul className="space-y-1 text-sm">
                      {issuingBankNames.map((name) => (
                        <li key={name} className="text-[hsl(var(--text-secondary))]">{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">None selected</p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Required declarations</h3>
                <p className="mt-1 text-sm text-muted-foreground">Accept both declarations before submitting your onboarding draft.</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-4 text-sm text-[hsl(var(--text-secondary))]">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={infoAccurate}
                    onChange={(e) => setInfoAccurate(e.target.checked)}
                    disabled={submitting}
                  />
                  <span>I confirm the information provided is accurate.</span>
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--landing-panel-border))] bg-card p-4 text-sm text-[hsl(var(--text-secondary))]">
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
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[hsl(var(--landing-panel-border))] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[hsl(var(--landing-panel-border))] bg-card px-5" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={submitting}>
                Back
              </Button>
              <Button type="button" className="h-11 rounded-xl px-6" onClick={onSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit onboarding'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}


