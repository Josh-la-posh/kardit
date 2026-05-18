import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOnboardingCase } from '@/hooks/useOnboarding';
import { Download, Check, MessageSquare, RefreshCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import MarketingHeader from '@/components/MarketingHeader';

function formatDateTime(value?: string) {
  if (!value) return '--';
  try {
    return format(new Date(value), 'dd MMM yyyy, HH:mm');
  } catch {
    return '--';
  }
}

export default function OnboardingStatusPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);

  const status = caseItem?.status || 'SUBMITTED';
  const isClarification = status === 'CLARIFICATION_REQUESTED';

  const timeline = [
    {
      key: 'submitted',
      title: 'Submitted',
      description: 'Application received',
      at: formatDateTime(caseItem?.submittedAt),
      state: 'done' as const,
    },
    {
      key: 'review',
      title: 'In Review',
      description: 'Compliance team reviewing your documents',
      at: formatDateTime(caseItem?.updatedAt),
      state: status === 'SUBMITTED' ? ('todo' as const) : ('done' as const),
    },
    {
      key: 'clarification',
      title: 'Clarification',
      description: isClarification ? 'We need a small piece of extra info' : 'No clarification required',
      at: isClarification ? formatDateTime(caseItem?.updatedAt) : '--',
      state: isClarification ? ('current' as const) : ('todo' as const),
    },
    {
      key: 'approved',
      title: 'Approved',
      description: 'Welcome aboard - credentials issued',
      at: status === 'APPROVED' || status === 'PROVISIONED' ? formatDateTime(caseItem?.updatedAt) : '--',
      state: status === 'APPROVED' || status === 'PROVISIONED' ? ('done' as const) : ('todo' as const),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--cs-paper)]">
      <MarketingHeader showStartEnrollment={false} pathLabel="Application Status" />

      <main className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-6 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !caseItem ? (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive">
            {error || 'Case not found'}
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--cs-green-700)]">Application</div>
                <h1 className="mt-1 break-all text-sm font-extrabold tracking-[-0.02em] text-[var(--cs-ink-900)] md:text-lg">{caseItem.caseId}</h1>
                <p className="mt-1 text-[9px] md:text-xs text-[var(--cs-ink-200)]">
                  Submitted {formatDateTime(caseItem.submittedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="h-10 px-3" onClick={refresh}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
                {/* <Button type="button" variant="outline" className="h-10 rounded-xl border-[var(--cs-green-700)] px-4 text-[var(--cs-green-700)]">
                  <Download className="h-4 w-4" /> Download summary
                </Button> */}
              </div>
            </section>

            {isClarification && (
              <section className="mt-6 rounded-3xl border border-[hsl(var(--destructive)/0.15)] border-l-4 border-l-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)] p-6">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-full bg-white text-[hsl(var(--destructive))]">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[30px] font-bold text-[hsl(var(--destructive))]">Clarification requested</h2>
                    <p className="mt-1 text-sm text-[var(--cs-ink-700)]">
                      {caseItem.reviewerNote || caseItem.decisionReason || 'Compliance asked for additional information.'}
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button type="button" className="h-10 rounded-xl px-5" onClick={() => navigate(`/onboarding/notifications/${caseItem.caseId}`)}>
                        Respond to Clarification
                      </Button>
                      <Button type="button" variant="ghost" className="h-10 px-2 text-[hsl(var(--destructive))]" onClick={() => navigate(`/onboarding/notifications/${caseItem.caseId}`)}>
                        View message
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex items-center justify-between border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-base md:text-xl font-semibold text-[var(--cs-ink-900)]">Timeline</h3>
                <span className="rounded-full border border-[#E8CF8C] bg-[#FFF5DE] px-3 py-1 text-xs font-semibold text-[#8B6500]">
                  {isClarification ? '- Awaiting your response' : '- In progress'}
                </span>
              </div>

              <div className="px-5 py-5">
                {timeline.map((item, index) => (
                  <div key={item.key} className="grid grid-cols-[34px_1fr] gap-4">
                    <div className="relative flex justify-center">
                      <div
                        className={
                          item.state === 'done'
                            ? 'grid h-8 w-8 place-items-center rounded-full bg-[#2EA463] text-white'
                            : item.state === 'current'
                              ? 'grid h-8 w-8 place-items-center rounded-full border-4 border-[#DDF2E7] bg-white text-[#2EA463]'
                              : 'grid h-8 w-8 place-items-center rounded-full border border-[#C8D0CA] bg-[#F5F7F5] text-[#8A928C]'
                        }
                      >
                        {item.state === 'done' ? <Check className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                      </div>
                      {index !== timeline.length - 1 && <div className="absolute top-8 h-[42px] w-px bg-[#2EA463]" />}
                    </div>
                    <div className={`pb-7 ${index === timeline.length - 1 ? 'pb-0' : ''}`}>
                      <div className={`text:base md:text-lg font-semibold ${item.state === 'todo' ? 'text-[var(--cs-ink-100)]' : 'text-[var(--cs-ink-900)]'}`}>{item.title}</div>
                      <div className="text-xs md:text-sm text-[var(--cs-ink-200)]">{item.description}</div>
                      <div className="mt-1 text-[9px] md:text-xs text-[var(--cs-ink-100)]">{item.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-base md:text-xl font-semibold text-[var(--cs-ink-900)]">Messages</h3>
              </div>
              <div className="p-5">
                {caseItem.messages?.length ? (
                  <div className="space-y-3">
                    {caseItem.messages.map((message, index) => (
                      <div key={`${message.at}-${index}`} className="flex gap-3 rounded-2xl bg-[var(--cs-mist)] p-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cs-line)] text-xs font-bold text-[var(--cs-ink-200)]">
                          {(message.from || 'CO').slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-[var(--cs-ink-100)]">
                            <span className="font-semibold">{message.from || 'Compliance Officer'}</span>
                            <span>{formatDateTime(message.at)}</span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--cs-ink-700)]">
                            {message.text || message.message || 'No message body'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-paper)] px-4 py-5 text-sm text-[var(--cs-ink-200)]">
                    No messages yet.
                  </div>
                )}
              </div>
            </section>

            {/* <div className="mt-5">
              <Button type="button" variant="ghost" className="px-0 text-[var(--cs-ink-900)]" onClick={() => navigate('/onboarding/start')}>
                Back
              </Button>
            </div> */}
          </>
        )}
      </main>
    </div>
  );
}
