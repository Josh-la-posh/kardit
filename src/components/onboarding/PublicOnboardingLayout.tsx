import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, FileText, Landmark, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingDraft } from '@/types/onboardingContracts';

type OnboardingStepId = 'start' | 'organization' | 'documents' | 'issuing-banks' | 'review' | 'status';

interface OnboardingStepDefinition {
  id: OnboardingStepId;
  n: number;
  label: string;
  meta: string;
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
    n: 1,
    label: 'Organization & Contact',
    meta: 'Tell us about your business',
    icon: Building2,
  },
  {
    id: 'documents',
    n: 2,
    label: 'KYB/KYC Documents',
    meta: 'Upload required documents',
    icon: FileText,
  },
  {
    id: 'issuing-banks',
    n: 3,
    label: 'Issuing Banks',
    meta: 'Select your banking partners',
    icon: Landmark,
  },
  {
    id: 'review',
    n: 4,
    label: 'Review & Submit',
    meta: 'Confirm and send for approval',
    icon: ShieldCheck,
  },
  {
    id: 'status',
    n: 5,
    label: 'Status & Tracking',
    meta: 'Track your application',
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
  if (stepId === 'review') return `/onboarding/${draftId}/review`;
  return '#';
}

function isOrganizationComplete(draft?: OnboardingDraft | null) {
  const organization = draft?.organization;
  const contact = organization?.primaryContact;

  return Boolean(
    draft?.consentAccepted &&
      organization?.tenantId?.trim() &&
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
  if (stepId === 'review') return Boolean(draft?.submittedCaseId);
  return Boolean(draft?.submittedCaseId);
}

function isStepEnabled(stepId: OnboardingStepId, currentStep: OnboardingStepId, draft?: OnboardingDraft | null) {
  if (stepId === currentStep) return true;
  if (stepId === 'organization') return Boolean(draft?.consentAccepted);
  if (stepId === 'documents') return isOrganizationComplete(draft);
  if (stepId === 'issuing-banks') return isOrganizationComplete(draft) && isDocumentsComplete(draft);
  if (stepId === 'review') return isOrganizationComplete(draft) && isDocumentsComplete(draft) && isIssuingBanksComplete(draft);
  return Boolean(draft?.submittedCaseId);
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
          <span className="text-[var(--cs-ink-900)]">{firstPart}</span>
          <span className="text-[var(--cs-green-700)]">{separator}{secondPart}</span>
        </>
      );
    }
  }

  return <span className="text-[var(--cs-green-700)]">{title}</span>;
}

export default function PublicOnboardingLayout({
  currentStep,
  draftId,
  draft,
  title,
  description,
  children,
}: PublicOnboardingLayoutProps) {
  const normalizedStep = currentStep === 'start' ? 'organization' : currentStep;
  const currentStepIndex = getStepIndex(normalizedStep as OnboardingStepId);

  return (
    <div className="min-h-screen bg-[var(--cs-paper)]">
      <div className="flex min-h-screen flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="hidden overflow-auto border-r border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-6 md:block">
            <h6 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cs-ink-100)]">
              Onboarding Progress
            </h6>
            <ol className="space-y-1">
              {steps.map((step, index) => {
                const isCurrent = step.id === normalizedStep;
                const isComplete = index < currentStepIndex || getStepCompletion(step.id, draft);
                const enabled = isStepEnabled(step.id, normalizedStep as OnboardingStepId, draft);
                const content = (
                  <>
                    <span
                      className={cn(
                        'mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-[11px] font-bold',
                        isCurrent
                          ? 'border-[var(--cs-green-700)] bg-[var(--cs-green-700)] text-white'
                          : isComplete
                            ? 'border-[var(--cs-green-500)] bg-[var(--cs-green-500)] text-white'
                            : 'border-[var(--cs-line-strong)] bg-[var(--cs-mist)] text-[var(--cs-ink-200)]'
                      )}
                    >
                      {isComplete ? <Check className="h-3.5 w-3.5" /> : step.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--cs-ink-700)]">{step.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--cs-ink-100)]">{step.meta}</span>
                    </span>
                  </>
                );

                const itemClassName = cn(
                  'flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors',
                  isCurrent
                    ? 'bg-[var(--cs-green-100)]'
                    : enabled
                      ? 'hover:bg-[var(--cs-mist)]'
                      : 'cursor-not-allowed opacity-60'
                );

                return enabled ? (
                  <li key={step.id}>
                    <Link to={getStepHref(draftId, step.id)} className={itemClassName} aria-current={isCurrent ? 'step' : undefined}>
                      {content}
                    </Link>
                  </li>
                ) : (
                  <li key={step.id}>
                    <button type="button" disabled className={itemClassName} aria-disabled="true">
                      {content}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 rounded-xl border border-[var(--cs-green-300)] bg-[var(--cs-green-100)] p-3.5">
              <div className="text-xs font-bold text-[var(--cs-green-900)]">Need help?</div>
              <div className="mt-1.5 text-xs leading-5 text-[var(--cs-ink-200)]">
                Save your progress at any time. Our team is available 9am-6pm WAT to walk you through
                the process.
              </div>
              <a href="#" className="mt-2 inline-block text-xs font-bold text-[var(--cs-green-700)] no-underline">
                Talk to a Consultant -
              </a>
            </div>
          </aside>

          <main className="overflow-auto bg-[var(--cs-paper)] p-8 md:p-20">
            <div className="mx-auto w-full">
              {/* <div className="mb-6 rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cs-green-700)]">
                    Step {currentStepIndex + 1} of {steps.length}
                  </p>
                  <span className="text-sm font-medium text-[var(--cs-ink-200)]">
                    {steps[currentStepIndex]?.label}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {steps.map((step, index) => {
                    const isActive = index <= currentStepIndex || getStepCompletion(step.id, draft);
                    return (
                      <div key={step.id} className={cn('h-2.5 flex-1 rounded-full', isActive ? 'bg-[var(--cs-green-700)]' : 'bg-[var(--cs-line)]')} />
                    );
                  })}
                </div>
              </div> */}

              <div className="mb-6">
                <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cs-green-700)]">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
                <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.02em] text-[var(--cs-ink-900)]">
                  {renderStyledTitle(title)}
                </h2>
                <p className="mt-2 max-w-[640px] text-base leading-[1.55] text-[var(--cs-ink-200)]">{description}</p>
              </div>

              <div className="">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
