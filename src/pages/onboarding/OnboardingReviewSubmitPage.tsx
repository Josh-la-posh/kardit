import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Check, Loader2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

type RequiredDoc = {
  key: string;
  label: string;
  type: 'CERTIFICATE_OF_INCORPORATION' | 'TAX_IDENTIFICATION_CERTIFICATE' | 'MEMORANDUM_OF_ASSOCIATION' | 'ARTICLES_OF_ASSOCIATION' | 'BOARD_RESOLUTION';
};

const requiredDocs: RequiredDoc[] = [
  { key: 'cac', label: 'CAC', type: 'CERTIFICATE_OF_INCORPORATION' },
  { key: 'tin', label: 'TIN', type: 'TAX_IDENTIFICATION_CERTIFICATE' },
  { key: 'moa', label: 'Memorandum of Association', type: 'MEMORANDUM_OF_ASSOCIATION' },
  { key: 'aoa', label: 'Articels Of Association', type: 'ARTICLES_OF_ASSOCIATION' },
  { key: 'br', label: 'Board Resolution', type: 'BOARD_RESOLUTION' },
];

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
    const map = new Map(banks.map((bank) => [bank.bankId, bank.bankDetails.shortName || bank.bankDetails.name] as const));
    return (draft?.issuingBankIds || []).map((id) => map.get(id) || id);
  }, [banks, draft?.issuingBankIds]);

  const docsByType = useMemo(() => {
    const grouped = new Map<string, string>();
    (draft?.documents || []).forEach((doc) => {
      if (!grouped.has(doc.type)) grouped.set(doc.type, doc.fileName);
    });
    return grouped;
  }, [draft?.documents]);

  const uploadedDocCount = requiredDocs.filter((doc) => Boolean(docsByType.get(doc.type))).length;

  const organizationRows = [
    { label: 'TENANT ID', value: draft?.organization?.tenantId || '-' },
    { label: 'LEGAL NAME', value: draft?.organization?.legalName || '-' },
    { label: 'RC NUMBER', value: draft?.organization?.registrationNumber || '-' },
    { label: 'TIN', value: docsByType.get('TAX_IDENTIFICATION_CERTIFICATE') ? draft?.organization?.registrationNumber || '-' : '-' },
    {
      label: 'ADDRESS',
      value: [
        draft?.organization?.address?.line1,
        draft?.organization?.address?.city,
        draft?.organization?.address?.state,
        draft?.organization?.address?.country,
      ]
        .filter(Boolean)
        .join(', ') || '-',
    },
    { label: 'CONTACT', value: draft?.organization?.primaryContact?.fullName || '-' },
    { label: 'EMAIL', value: draft?.organization?.primaryContact?.email || '-' },
    { label: 'PHONE', value: draft?.organization?.primaryContact?.phone || '-' },
  ];

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
      description="Please confirm every detail before final submission."
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
            <section className="overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex items-center justify-between border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-[32px] font-semibold text-[var(--cs-ink-900)]">Organization &amp; contact</h3>
                <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--cs-green-700)]" onClick={() => navigate(`/onboarding/${draftId}/organization`)}>
                  <PencilLine className="h-4 w-4" /> Edit
                </button>
              </div>
              <div className="px-5 py-3">
                {organizationRows.map((row, idx) => (
                  <div key={row.label} className={`grid grid-cols-[170px_1fr] gap-6 py-3 ${idx !== organizationRows.length - 1 ? 'border-b border-[var(--cs-line)]' : ''}`}>
                    <div className="text-xs font-bold tracking-[0.08em] text-[var(--cs-ink-100)]">{row.label}</div>
                    <div className="text-sm text-[var(--cs-ink-900)]">{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex items-center justify-between border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-[32px] font-semibold text-[var(--cs-ink-900)]">Documents ({uploadedDocCount}/{requiredDocs.length})</h3>
                <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--cs-green-700)]" onClick={() => navigate(`/onboarding/${draftId}/documents`)}>
                  <PencilLine className="h-4 w-4" /> Edit
                </button>
              </div>
              <div className="px-5 py-3">
                {requiredDocs.map((doc, idx) => {
                  const fileName = docsByType.get(doc.type);
                  return (
                    <div key={doc.key} className={`grid grid-cols-[170px_1fr] gap-6 py-3 ${idx !== requiredDocs.length - 1 ? 'border-b border-[var(--cs-line)]' : ''}`}>
                      <div className="text-xs font-bold tracking-[0.08em] text-[var(--cs-ink-100)]">{doc.label}</div>
                      <div className="text-sm">
                        {fileName ? (
                          <span className="inline-flex items-center gap-2 text-[var(--cs-ink-900)]">
                            <Check className="h-4 w-4 text-[var(--cs-green-700)]" /> {fileName}
                          </span>
                        ) : (
                          <span className="text-destructive">Missing</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex items-center justify-between border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-[32px] font-semibold text-[var(--cs-ink-900)]">Issuing banks ({issuingBankNames.length})</h3>
                <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--cs-green-700)]" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)}>
                  <PencilLine className="h-4 w-4" /> Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-5 py-4">
                {issuingBankNames.length ? (
                  issuingBankNames.map((name) => (
                    <span key={name} className="rounded-full border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] px-3 py-1 text-xs font-bold text-[var(--cs-green-900)]">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--cs-ink-200)]">No banks selected</span>
                )}
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] px-5 py-4">
              <label className="mb-4 flex items-start gap-3 text-sm text-[var(--cs-ink-700)]">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={infoAccurate} onChange={(e) => setInfoAccurate(e.target.checked)} disabled={submitting} />
                <span>
                  I confirm that all information provided is accurate, and I have authority to submit this application on behalf of my organization. I accept the <a href="#" className="font-semibold text-[var(--cs-green-700)] underline">Kardit Affiliate Terms</a> and <a href="#" className="font-semibold text-[var(--cs-green-700)] underline">Privacy Policy</a>.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-[var(--cs-ink-700)]">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={authorizedSigner} onChange={(e) => setAuthorizedSigner(e.target.checked)} disabled={submitting} />
                <span>Kardit may contact me about my application via email or phone.</span>
              </label>
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[hsl(var(--landing-panel-border))] pt-2 sm:flex-row">
              <Button type="button" variant="ghost" className="h-11 px-0 text-[var(--cs-ink-900)]" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={submitting}>
                Back
              </Button>
              <Button type="button" className="h-11 rounded-xl px-6" onClick={onSubmit} disabled={submitting || !infoAccurate || !authorizedSigner}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit application'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
