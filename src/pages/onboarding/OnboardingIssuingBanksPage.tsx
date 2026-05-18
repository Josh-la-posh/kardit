import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIssuingBanks } from '@/hooks/useIssuingBank';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { Check, Landmark, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

export default function OnboardingIssuingBanksPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, updateIssuingBanks } = useOnboardingDraft(draftId);
  const initial = useMemo(() => new Set(draft?.issuingBankIds || []), [draft?.issuingBankIds]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const { banks, isLoading: banksLoading, error: banksError, refetch: refetchBanks } = useIssuingBanks(debouncedSearch);

  React.useEffect(() => {
    setSelected(initial);
  }, [initial]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

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

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => {
      const name = b.bankDetails.name?.toLowerCase() || '';
      const code = b.bankDetails.code?.toLowerCase() || '';
      return name.includes(q) || code.includes(q);
    });
  }, [banks, search]);

  return (
    <PublicOnboardingLayout
      currentStep="issuing-banks"
      draftId={draftId}
      draft={draft}
      title="Select your issuing banks"
      description="Choose the banks Kardit will route transactions through on your behalf. You can add more later from your dashboard."
    >
      <div className="animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex flex-col gap-3 border-b border-[var(--cs-line)] p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cs-ink-100)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search banks..."
                    className="h-10 w-full rounded-xl border border-[var(--cs-line)] bg-[var(--cs-paper)] pl-9 pr-3 text-sm text-[var(--cs-ink-900)] outline-none transition-colors focus:border-[var(--cs-green-500)]"
                  />
                </div>
                <div className="rounded-full border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] px-3 py-1 text-xs font-semibold text-[var(--cs-green-900)]">
                  {selected.size} selected
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {banksError && !banksLoading ? (
                  <div className="px-5 py-6 text-sm text-[hsl(var(--text-secondary))]">
                    <p>{banksError}</p>
                    <Button type="button" variant="outline" className="mt-4 h-10 rounded-xl border-[hsl(var(--landing-panel-border))] bg-card px-4" onClick={refetchBanks}>
                      Retry
                    </Button>
                  </div>
                ) : banksLoading ? (
                  <div>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className={cn('flex items-center gap-4 px-5 py-4', idx !== 5 && 'border-b border-[var(--cs-line)]')}>
                        <div className="h-5 w-5 animate-pulse rounded border border-[var(--cs-line)] bg-[var(--cs-mist)]" />
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-[var(--cs-mist)]" />
                        <div className="flex-1">
                          <div className="h-4 w-48 animate-pulse rounded bg-[var(--cs-mist)]" />
                          <div className="mt-2 h-3 w-28 animate-pulse rounded bg-[var(--cs-mist)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {filteredBanks.map((b, index) => {
                      const isSelected = selected.has(b.bankId);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggle(b.bankId)}
                          className={cn(
                            'flex w-full items-center gap-4 px-5 py-4 text-left transition-colors',
                            index !== filteredBanks.length - 1 && 'border-b border-[var(--cs-line)]',
                            isSelected ? 'bg-[var(--cs-green-100)]' : 'hover:bg-[var(--cs-mist)]'
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-5 w-5 place-items-center rounded border',
                              isSelected ? 'border-[var(--cs-green-700)] bg-[var(--cs-green-700)] text-white' : 'border-[var(--cs-line-strong)] bg-white'
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--cs-mist)] text-[var(--cs-ink-200)]">
                            <Landmark className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold text-[var(--cs-ink-900)]">{b.bankDetails.name}</span>
                            <span className="block text-sm text-[var(--cs-ink-200)]">CBN code - {b.bankDetails.code}</span>
                          </span>
                          <span className="text-[var(--cs-green-700)]">{isSelected ? <Check className="h-4 w-4" /> : null}</span>
                        </button>
                      );
                    })}
                    {!filteredBanks.length && (
                      <div className="px-5 py-8 text-center text-sm text-[var(--cs-ink-200)]">
                        No banks match your search.
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[hsl(var(--landing-panel-border))] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[hsl(var(--landing-panel-border))] bg-card px-5" onClick={() => navigate(`/onboarding/${draftId}/documents`)} disabled={saving}>Back</Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-11 rounded-xl border-[var(--cs-green-700)] px-5 text-[var(--cs-green-700)]" onClick={onNext} disabled={saving}>
                  Save Draft
                </Button>
                <Button type="button" className="h-11 rounded-xl px-6" onClick={onNext} disabled={saving}>Review &amp; Submit</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
