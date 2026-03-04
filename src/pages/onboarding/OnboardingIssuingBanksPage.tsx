import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { ISSUING_BANKS } from '@/stores/mockStore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingIssuingBanksPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, updateIssuingBanks } = useOnboardingDraft(draftId);
  const initial = useMemo(() => new Set(draft?.issuingBankIds || []), [draft?.issuingBankIds]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [saving, setSaving] = useState(false);

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
    if (!draftId) return;
    setSaving(true);
    try {
      await updateIssuingBanks(Array.from(selected));
      navigate(`/onboarding/${draftId}/review`);
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
            <h1 className="text-xl font-semibold">Select issuing banks</h1>
            <p className="text-sm text-muted-foreground">Choose the issuing banks you want to work with.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ISSUING_BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={cn(
                      'rounded-md border border-border p-4 text-left transition-colors',
                      selected.has(b.id) ? 'bg-muted' : 'hover:bg-muted/40'
                    )}
                  >
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.has(b.id) ? 'Selected' : 'Not selected'}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => navigate(`/onboarding/${draftId}/documents`)} disabled={saving}>Back</Button>
                <Button type="button" onClick={onNext} disabled={saving}>Next</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
