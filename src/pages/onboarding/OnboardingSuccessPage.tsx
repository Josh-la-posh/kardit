import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function OnboardingSuccessPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const submittedOn = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cs-paper)]">
      <div className="mx-auto w-full max-w-[780px] animate-fade-in px-4 py-10 text-center md:px-8 md:py-14">
        <div className="mx-auto grid h-22 w-22 place-items-center rounded-full border-4 border-[var(--cs-green-300)] bg-[var(--cs-green-100)] text-[var(--cs-green-700)] md:h-24 md:w-24">
          <Check className="h-10 w-10" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-green-700)]">Application submitted</p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em] text-[var(--cs-ink-900)] md:text-4xl">You're all set.</h1>
        <p className="mx-auto mt-4 max-w-[640px] text-sm leading-[1.6] text-[var(--cs-ink-200)] md:text-base">
          We've received your application. Our compliance team reviews most submissions within 2 working days, and we'll email you the moment there's news.
        </p>

        <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-6 text-left shadow-[var(--cs-shadow-sm)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--cs-ink-100)]">Case ID</p>
              <p className="mt-1 break-all text-sm font-extrabold tracking-[-0.02em] text-[var(--cs-ink-900)] md:text-base">
                {caseId || 'N/A'}
              </p>
            </div>
            <span className="inline-flex h-9 items-center rounded-full border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] px-4 text-sm font-semibold text-[var(--cs-green-900)]">
               Submitted
            </span>
          </div>

          <div className="mt-4 border-t border-[var(--cs-line)] pt-4 text-xs text-[var(--cs-ink-200)] md:text-sm">
            Submitted on {submittedOn} - Expected response by 2 working days.
          </div>
        </section>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl border-[var(--cs-green-700)] px-7 text-[var(--cs-green-700)]"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </Button>
          <Button
            type="button"
            className="h-12 rounded-xl px-8"
            onClick={() => caseId && navigate(`/onboarding/status/${caseId}`)}
            disabled={!caseId}
          >
            View Status
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full border-[22px] border-[var(--cs-red-100)] opacity-70" />
      <div className="pointer-events-none absolute -bottom-10 right-24 h-20 w-40 rounded-full bg-[var(--cs-red-50)] opacity-70" />
    </div>
  );
}
