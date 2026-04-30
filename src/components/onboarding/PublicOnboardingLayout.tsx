import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, FileText, Landmark, ShieldCheck } from 'lucide-react';
import { KarditLogo } from '@/components/KarditLogo';
import { cn } from '@/lib/utils';
import type { OnboardingDraft } from '@/types/onboardingContracts';

type OnboardingStepId = 'organization' | 'documents' | 'issuing-banks' | 'review';

interface OnboardingStepDefinition {
  id: OnboardingStepId;
  label: string;
  summary: string;
  eyebrow: string;
  icon: typeof Building2;
}

interface PublicOnboardingLayoutProps {
  currentStep: OnboardingStepId;
  draftId?: string;
  draft?: OnboardingDraft | null;
  title: string;
  description: string;
  children: ReactNode;
}

const steps: OnboardingStepDefinition[] = [
  {
    id: 'organization',
    label: 'Organization',
    summary: 'Business and contact details',
    eyebrow: 'Step 1',
    icon: Building2,
  },
  {
    id: 'documents',
    label: 'Documents',
    summary: 'Upload KYB and KYC files',
    eyebrow: 'Step 2',
    icon: FileText,
  },
  {
    id: 'issuing-banks',
    label: 'Issuing Banks',
    summary: 'Choose your preferred partners',
    eyebrow: 'Step 3',
    icon: Landmark,
  },
  {
    id: 'review',
    label: 'Review',
    summary: 'Confirm and submit',
    eyebrow: 'Step 4',
    icon: ShieldCheck,
  },
];

function getStepIndex(stepId: OnboardingStepId) {
  return steps.findIndex((step) => step.id === stepId);
}

function getStepHref(draftId: string | undefined, stepId: OnboardingStepId) {
  if (!draftId) return '#';
  if (stepId === 'organization') return `/onboarding/${draftId}/organization`;
  if (stepId === 'documents') return `/onboarding/${draftId}/documents`;
  if (stepId === 'issuing-banks') return `/onboarding/${draftId}/issuing-banks`;
  return `/onboarding/${draftId}/review`;
}

function isOrganizationComplete(draft?: OnboardingDraft | null) {
  const organization = draft?.organization;
  const contact = organization?.primaryContact;

  return Boolean(
    draft?.consentAccepted &&
      organization?.legalName?.trim() &&
      organization?.registrationNumber?.trim() &&
      organization?.address?.line1?.trim() &&
      organization?.address?.country?.trim() &&
      contact?.fullName?.trim() &&
      contact?.email?.trim() &&
      contact?.phone?.trim()
  );
}

function isDocumentsComplete(draft?: OnboardingDraft | null) {
  return (draft?.documents?.length || 0) > 0;
}

function isIssuingBanksComplete(draft?: OnboardingDraft | null) {
  return (draft?.issuingBankIds?.length || 0) > 0;
}

function getStepCompletion(stepId: OnboardingStepId, draft?: OnboardingDraft | null) {
  if (stepId === 'organization') return isOrganizationComplete(draft);
  if (stepId === 'documents') return isDocumentsComplete(draft);
  if (stepId === 'issuing-banks') return isIssuingBanksComplete(draft);
  return Boolean(draft?.submittedCaseId);
}

function isStepEnabled(stepId: OnboardingStepId, currentStep: OnboardingStepId, draft?: OnboardingDraft | null) {
  if (stepId === currentStep) return true;
  if (stepId === 'organization') return true;
  if (stepId === 'documents') return isOrganizationComplete(draft);
  if (stepId === 'issuing-banks') return isOrganizationComplete(draft) && isDocumentsComplete(draft);
  return isOrganizationComplete(draft) && isDocumentsComplete(draft) && isIssuingBanksComplete(draft);
}

function renderStyledTitle(title: string) {
  const separators = [' & ', ' and '];

  for (const separator of separators) {
    const index = title.indexOf(separator);
    if (index !== -1) {
      const firstPart = title.slice(0, index);
      const secondPart = title.slice(index + separator.length);

      return (
        <>
          <span className="text-slate-900">{firstPart}</span>
          <span className="text-primary">{separator}{secondPart}</span>
        </>
      );
    }
  }

  return <span className="text-primary">{title}</span>;
}

export default function PublicOnboardingLayout({
  currentStep,
  draftId,
  draft,
  title,
  description,
  children,
}: PublicOnboardingLayoutProps) {
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="min-h-screen bg-white px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden  border border-[#dbe7dd] bg-white shadow-[0_24px_80px_rgba(14,72,38,0.08)] md:flex-row">
        <aside className="hidden border-r border-[#e3ece5] bg-[#f8fbf8] p-6 md:block md:w-[320px]">
          <div className="flex h-full flex-col">
            <div className="mb-2">
              <Link to="/onboarding/start" className="inline-flex">
                <KarditLogo size="md" />
              </Link>
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">Affiliate onboarding Progress</p>
              </div>
            </div>

            <nav className="mt-6 space-y-3">
              {steps.map((step, index) => {
                const isCurrent = step.id === currentStep;
                const isComplete = index < currentStepIndex;
                const enabled = isStepEnabled(step.id, currentStep, draft);
                const Icon = step.icon;

                const content = (
                  <>
                    <div
                      className={cn(
                        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors',
                        isCurrent
                          ? 'border-primary/50 bg-primary text-primary-foreground'
                          : isComplete
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : enabled
                              ? 'border-[#dce7de] bg-white text-slate-600'
                              : 'border-[#e3e8e4] bg-[#f3f5f3] text-slate-400'
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{step.eyebrow}</p>
                      <p className={cn('mt-1 text-sm font-semibold', isCurrent ? 'text-slate-900' : enabled ? 'text-slate-700' : 'text-slate-400')}>
                        {step.label}
                      </p>
                      <p className={cn('mt-1 text-sm leading-5', enabled ? 'text-slate-500' : 'text-slate-400')}>{step.summary}</p>
                    </div>
                  </>
                );

                const itemClassName = cn(
                  'flex w-full items-start gap-4 rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200',
                  isCurrent
                    ? 'border-primary/25 bg-primary/10'
                    : enabled
                      ? 'border-[#dde8df] bg-white hover:border-primary/25 hover:bg-[#f6fbf7]'
                      : 'cursor-not-allowed border-[#ebefeb] bg-[#f8faf8] opacity-80'
                );

                return enabled ? (
                  <Link
                    key={step.id}
                    to={getStepHref(draftId, step.id)}
                    className={itemClassName}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <button key={step.id} type="button" disabled className={itemClassName} aria-disabled="true">
                    {content}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col rounded-[1.75rem] border border-[#e4ece5] bg-white p-6 md:p-8 lg:p-10">
            <div className="mb-6 rounded-[1.35rem] border border-[#e2ebe3] bg-[#fbfdfb] p-4 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">STEP {currentStepIndex + 1} OF {steps.length}</p>
                <span className="text-sm font-medium text-slate-700">{steps[currentStepIndex]?.label}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {steps.map((step, index) => {
                  const isActive = index <= currentStepIndex || getStepCompletion(step.id, draft);
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'h-2.5 flex-1 rounded-full transition-colors',
                        isActive ? 'bg-primary' : 'bg-[#dfe8df]'
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <div className='mb-10 text-center border-b border-[#e6eee7] md:mb-0 md:border-0 md:text-center'>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-3xl">{renderStyledTitle(title)}</h2>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-600">{description}</p>
            </div>

            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
