import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, FileText, Landmark, PlayCircle, ShieldCheck } from 'lucide-react';
import { KarditLogo } from '@/components/KarditLogo';
import { cn } from '@/lib/utils';
import type { OnboardingDraft } from '@/types/onboardingContracts';

type OnboardingStepId = 'start' | 'organization' | 'documents' | 'issuing-banks' | 'review';

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
    id: 'start',
    label: 'Start',
    summary: 'Confirm consent and begin',
    eyebrow: 'Step 1',
    icon: PlayCircle,
  },
  {
    id: 'organization',
    label: 'Organization',
    summary: 'Business and contact details',
    eyebrow: 'Step 2',
    icon: Building2,
  },
  {
    id: 'documents',
    label: 'Documents',
    summary: 'Upload KYB and KYC files',
    eyebrow: 'Step 3',
    icon: FileText,
  },
  {
    id: 'issuing-banks',
    label: 'Issuing Banks',
    summary: 'Choose your preferred partners',
    eyebrow: 'Step 4',
    icon: Landmark,
  },
  {
    id: 'review',
    label: 'Review',
    summary: 'Confirm and submit',
    eyebrow: 'Step 5',
    icon: ShieldCheck,
  },
];

function getStepIndex(stepId: OnboardingStepId) {
  return steps.findIndex((step) => step.id === stepId);
}

function getStepHref(draftId: string | undefined, stepId: OnboardingStepId) {
  if (stepId === 'start') return '/onboarding/start';
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
  if (stepId === 'start') return Boolean(draft?.consentAccepted);
  if (stepId === 'organization') return isOrganizationComplete(draft);
  if (stepId === 'documents') return isDocumentsComplete(draft);
  if (stepId === 'issuing-banks') return isIssuingBanksComplete(draft);
  return Boolean(draft?.submittedCaseId);
}

function isStepEnabled(stepId: OnboardingStepId, currentStep: OnboardingStepId, draft?: OnboardingDraft | null) {
  if (stepId === currentStep) return true;
  if (stepId === 'start') return true;
  if (stepId === 'organization') return currentStep !== 'start' && Boolean(draft?.consentAccepted);
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
          <span className="text-foreground">{firstPart}</span>
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
    <div className="min-h-screen bg-[hsl(var(--landing-bg))] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] shadow-[0_24px_80px_hsl(var(--landing-brand)/0.12)] md:flex-row">
        <aside className="hidden border-r border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-soft))] p-3 lg:p-6 md:block w-56 lg:w-80">
          <div className="flex h-full flex-col">
            <div className="mb-2">
              <Link to="/onboarding/start" className="inline-flex">
                <KarditLogo size="md" />
              </Link>
              <div className="mt-8">
                <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">Affiliate onboarding Progress</p>
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
                        'flex h-8 lg:h-11 w-8 lg:w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-colors',
                        isCurrent
                          ? 'border-primary/50 bg-primary text-primary-foreground'
                          : isComplete
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : enabled
                              ? 'border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] text-muted-foreground'
                              : 'border-[hsl(var(--landing-panel-border)/0.8)] bg-[hsl(var(--landing-soft-2))] text-[hsl(var(--text-muted))]'
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 lg:space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] lg:tracking-[0.24em] text-[hsl(var(--text-muted))]">{step.eyebrow}</p>
                      <p className={cn('text-sm font-semibold', isCurrent ? 'text-foreground' : enabled ? 'text-[hsl(var(--text-secondary))]' : 'text-[hsl(var(--text-muted))]')}>
                        {step.label}
                      </p>
                      <p className={cn('text-xs lg:text-sm leading-5', enabled ? 'text-muted-foreground' : 'text-[hsl(var(--text-muted))]')}>{step.summary}</p>
                    </div>
                  </>
                );

                const itemClassName = cn(
                  'flex w-full items-start gap-3 lg:gap-4 rounded-2xl lg:rounded-3xl border px-2 lg:px-4 py-4 text-left transition-all duration-200',
                  isCurrent
                    ? 'border-primary/25 bg-primary/10'
                    : enabled
                      ? 'border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] hover:border-primary/25 hover:bg-[hsl(var(--landing-soft))]'
                      : 'cursor-not-allowed border-[hsl(var(--landing-panel-border)/0.7)] bg-[hsl(var(--landing-soft-2))] opacity-80'
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
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col rounded-[1.75rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] p-6 md:p-8 lg:p-10">
            <div className="mb-6 rounded-[1.35rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-soft))] p-4 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">STEP {currentStepIndex + 1} OF {steps.length}</p>
                <span className="text-sm font-medium text-[hsl(var(--text-secondary))]">{steps[currentStepIndex]?.label}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {steps.map((step, index) => {
                  const isActive = index <= currentStepIndex || getStepCompletion(step.id, draft);
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'h-2.5 flex-1 rounded-full transition-colors',
                        isActive ? 'bg-primary' : 'bg-[hsl(var(--landing-soft-2))]'
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <div className='mb-10 text-center border-b border-[hsl(var(--landing-panel-border))] md:mb-0 md:border-0 md:text-center'>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-3xl">{renderStyledTitle(title)}</h2>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground">{description}</p>
            </div>

            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
