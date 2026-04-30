import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

export default function OnboardingIssuingBanksPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, updateIssuingBanks } = useOnboardingDraft(draftId);
  const { banks, isLoading: banksLoading, error: banksError, refetch: refetchBanks } = useIssuingBanks();
  const initial = useMemo(() => new Set(draft?.issuingBankIds || []), [draft?.issuingBankIds]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [saving, setSaving] = useState(false);
  const loading = isLoading || banksLoading;

  React.useEffect(() => {
    setSelected(initial);
  }, [initial]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onNext = async () => {
    if (!draftId || !draft?.onboardingSessionId) return;
    setSaving(true);
    try {
      await updateIssuingBanks(Array.from(selected), draft.onboardingSessionId);
      navigate(`/onboarding/${draftId}/review`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicOnboardingLayout
      currentStep="issuing-banks"
      draftId={draftId}
      draft={draft}
      title="Select issuing banks"
      description="Choose the issuing banks you want to work with. You can select multiple partners, and you can always come back to update this list later."
    >
      <div className="animate-fade-in">

        {loading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banksError ? (
          <div className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6 text-sm text-slate-700">
            <p>{banksError}</p>
            <Button type="button" variant="outline" className="mt-4 h-11 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={refetchBanks}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Available issuing partners</h3>
                  <p className="mt-1 text-sm text-slate-600">Click any card to toggle selection. Selected partners are highlighted immediately.</p>
                </div>
                <div className="rounded-full border border-primary/15 bg-[#e9f5eb] px-3 py-1 text-xs font-semibold text-primary">
                  {selected.size} selected
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {banks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.bankDetails.code)}
                    className={cn(
                      'relative overflow-hidden rounded-[1.35rem] border p-5 text-left transition-all duration-200',
                      selected.has(b.bankDetails.code)
                        ? 'border-primary/30 bg-[#eff8f0] shadow-[0_14px_30px_rgba(14,159,76,0.08)]'
                        : 'border-[#dde8df] bg-white hover:border-primary/25 hover:bg-[#f7fbf8]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{b.bankDetails.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{b.bankDetails.code}</p>
                      </div>
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                          selected.has(b.bankDetails.code)
                            ? 'border-primary/40 bg-primary text-primary-foreground'
                            : 'border-[#d9e4db] bg-[#f8fbf8] text-slate-500'
                        )}
                      >
                        {selected.has(b.bankDetails.code) ? <Check className="h-4 w-4" /> : <span className="text-xs">{String.fromCharCode(43)}</span>}
                      </div>
                    </div>
                    <p className="mt-6 text-sm text-slate-600">{selected.has(b.bankDetails.code) ? 'Selected for onboarding' : 'Tap to add this issuing bank to your draft.'}</p>
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[#e6eee7] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={() => navigate(`/onboarding/${draftId}/documents`)} disabled={saving}>Back</Button>
              <Button type="button" className="h-11 rounded-xl px-6" onClick={onNext} disabled={saving}>Continue to review</Button>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
