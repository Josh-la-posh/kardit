import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '@/components/MarketingHeader';
import { ArrowRight, Clock3, Loader2, Moon, Sun } from 'lucide-react';
import type { OnboardingDraft } from '@/types/onboardingContracts';
import { useTheme } from '@/components/ThemeProvider';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { JOURNEY_STEPS } from './journeySteps';
import { useCreateOnboardingSession } from '@/hooks/useOnboarding';

export default function OnboardingStartPage() {
  const navigate = useNavigate();
  const { create, isLoading } = useCreateOnboardingSession();

  const { theme, setTheme } = useTheme()
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const latestDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem('kardit.onboarding.drafts.v2');
      if (!raw) return null;
      const drafts = JSON.parse(raw) as Record<string, OnboardingDraft>;
      const values = Object.values(drafts || {});
      if (!values.length) return null;
      return values.sort((a, b) => (b.expiresAt || '').localeCompare(a.expiresAt || ''))[0] || null;
    } catch {
      return null;
    }
  }, []);

  const resumeRoute = useMemo(() => {
    if (!latestDraft) return '/onboarding/organization';
    if (latestDraft.submittedCaseId) return `/onboarding/status/${latestDraft.submittedCaseId}`;
    if ((latestDraft.issuingBankIds || []).length > 0) return `/onboarding/${latestDraft.draftId}/review`;
    if ((latestDraft.documents || []).length > 0) return `/onboarding/${latestDraft.draftId}/issuing-banks`;
    if (latestDraft.organization?.legalName) return `/onboarding/${latestDraft.draftId}/documents`;
    return `/onboarding/${latestDraft.draftId}/organization`;
  }, [latestDraft]);

  const resumeStepText = useMemo(() => {
    if (!latestDraft) return '';
    if (latestDraft.submittedCaseId) return 'Step 7 of 9 - Application Submitted';
    if ((latestDraft.issuingBankIds || []).length > 0) return 'Step 4 of 9 - Banks';
    if ((latestDraft.documents || []).length > 0) return 'Step 3 of 9 - Documents';
    if (latestDraft.organization?.legalName) return 'Step 2 of 9 - Organization';
    return 'Step 1 of 9 - Welcome';
  }, [latestDraft]);

  const onStart = async () => {
    setLocalError(null);
    if (!email || !phone) {
      setLocalError('Email and phone are required');
      return;
    }
    if (!consentAccepted) {
      setLocalError('You must accept consent to continue');
      return;
    }
    try {
      const res = await create({
        channel: 'web',
        email,
        phone,
        consentAccepted: true,
      });
      navigate(`/onboarding/${res.draftId}/organization`);
    } catch (err: any) {
      setLocalError((err as Error)?.message || 'Failed to start onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cs-paper)] text-[var(--cs-fg)]">
      <div className="flex min-h-screen flex-col">
        <MarketingHeader
          showStartEnrollment={false}
          rightSlot={
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel)/0.72)] px-3 py-2 shadow-[0_10px_24px_hsl(var(--landing-fg)/0.1)] backdrop-blur">
              <Sun className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
              <Moon className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
            </div>
          }
        />

        <main className="relative flex-1 overflow-auto">
          <div className="relative mx-auto max-w-[1280px] px-8 py-16">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-green-700)]">
              Affiliate Onboarding
            </div>
            <h1 className="mt-2 text-[44px] font-extrabold leading-tight tracking-[-0.02em] text-[var(--cs-ink-900)]">
              Welcome to Kardit.
            </h1>
            <p className="mt-3 max-w-[640px] text-lg leading-[1.55] text-[var(--cs-ink-200)]">
              Let&apos;s get your organization onboarded as a Kardit affiliate. The process takes about 15
              minutes - you can save your progress and come back at any time.
            </p>

            {latestDraft && (
              <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-full border border-[var(--cs-green-300)] bg-[var(--cs-bg-elevated)] text-[var(--cs-green-700)]">
                    <Clock3 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[30px] font-semibold text-[var(--cs-ink-900)]">
                      Welcome back - your application is saved.
                    </div>
                    <div className="mt-1 text-sm text-[var(--cs-ink-400)]">{resumeStepText}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-[10px] bg-red-700 px-5 py-2.5 text-sm font-bold text-white"
                  onClick={() => navigate(resumeRoute)}
                >
                  Resume Application
                </button>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-[var(--cs-line)] border-t-4 border-t-[var(--cs-green-700)] bg-[var(--cs-bg-elevated)] p-7 shadow-[var(--cs-shadow-sm)]">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-green-700)]">
                  New application
                </div>
                <h3 className="mt-1.5 text-[22px] font-bold text-[var(--cs-ink-900)]">Start fresh</h3>
                <p className="mt-2 text-sm leading-[1.6] text-[var(--cs-ink-200)]">
                  Begin a new onboarding application. We&apos;ll guide you through 4 short steps.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    'Organization & contact details',
                    'KYB / KYC documents',
                    'Issuing bank selection',
                    'Review & submit',
                  ].map((t, i) => (
                    <li key={t} className="flex items-center gap-2.5 text-[13px] text-[var(--cs-ink-400)]">
                      <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] text-[11px] font-bold text-[var(--cs-green-900)]">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
                  onClick={onStart}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Onboarding <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-7 shadow-[var(--cs-shadow-sm)]">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cs-ink-100)]">
                  {JOURNEY_STEPS[0].title}
                </div>
                <h3 className="mt-1.5 text-lg font-bold text-[var(--cs-ink-700)]">Continue where you left off</h3>
                <div className="mt-3.5 space-y-3">
                  <TextField
                    label="Work email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ops@acmefinance.ng"
                    size="lg"
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348012345678"
                    size="lg"
                  />
                  <label className="flex items-start gap-2 text-xs text-[var(--cs-ink-200)]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                    />
                    <span>I confirm I&apos;m authorized to submit onboarding information.</span>
                  </label>
                  {localError && (
                    <div className="rounded-md border border-[var(--cs-red-300)] bg-[var(--cs-red-100)] px-3 py-2 text-xs text-[var(--cs-red-900)]">
                      {localError}
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-[10px] bg-[var(--cs-green-700)] px-3.5 py-2.5 text-[13px] font-bold text-white"
                    onClick={onStart}
                    disabled={isLoading}
                  >
                    Start onboarding
                  </button>
                </div>
                <div className="mt-5 rounded-[10px] bg-[var(--cs-mist)] px-4 py-3.5 text-xs leading-[1.55] text-[var(--cs-ink-200)]">
                  <strong className="text-[var(--cs-ink-700)]">Tip:</strong> Have your CAC certificate, TIN
                  and director IDs ready before you start.
                </div>
              </div>
            </div>

            <div className="mt-7 text-[13px] text-[var(--cs-ink-100)]">
              Trouble starting?{' '}
              <a className="font-semibold text-[var(--cs-green-700)]" href="#">
                Contact support
              </a>{' '}
              or call +234-803-394-4566.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
