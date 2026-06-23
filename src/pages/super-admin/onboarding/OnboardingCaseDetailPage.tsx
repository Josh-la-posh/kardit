import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useReviewerOnboardingCase, useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  IN_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUIRED: 'WARNING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM d, yyyy HH:mm');
}

export default function OnboardingCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useReviewerOnboardingCase(caseId);
  const { decide, provision } = useReviewerOnboardingCases();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);

  const canProvision = caseItem?.status === 'APPROVED';
  const canRequestClarification =
    caseItem?.status !== 'APPROVED' &&
    caseItem?.status !== 'REJECTED' &&
    caseItem?.status !== 'CLARIFICATION_REQUIRED' &&
    caseItem?.status !== 'CLARIFICATION_REQUESTED';
  const canReject = caseItem?.status !== 'APPROVED' && caseItem?.status !== 'REJECTED';
  const canApprove = caseItem?.status !== 'APPROVED' && caseItem?.status !== 'REJECTED';

  const title = useMemo(
    () => caseItem?.affiliateName || caseItem?.organization?.legalName || 'Onboarding case',
    [caseItem?.affiliateName, caseItem?.organization?.legalName]
  );

  const primaryContact = caseItem?.contact
    ? {
        fullName: caseItem.contact.contactName,
        email: caseItem.contact.contactEmail,
        phone: caseItem.contact.contactPhone,
      }
    : caseItem?.organization?.primaryContact;

  const address = [
    caseItem?.organization?.address?.line1 || caseItem?.organization?.addressLine1,
    caseItem?.organization?.address?.city,
    caseItem?.organization?.address?.state,
    caseItem?.organization?.address?.country || caseItem?.organization?.country,
  ].filter(Boolean).join(', ');

  const doDecision = async (decision: 'APPROVE' | 'REJECT' | 'CLARIFY') => {
    if (!caseId) return;
    setWorking(true);
    try {
      await decide(caseId, { decision, reason: reason || undefined, reviewerNote: note || undefined });
      toast.success('Decision saved');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save decision');
    } finally {
      setWorking(false);
    }
  };

  const doProvision = async () => {
    if (!caseId || !caseItem) return;

    if (!primaryContact?.fullName || !primaryContact?.email || !primaryContact?.phone) {
      toast.error('This case is missing primary contact details.');
      return;
    }

    setWorking(true);
    try {
      await provision(caseId, primaryContact);
      toast.success('Provisioned');
      navigate(`/super-admin/onboarding/cases/${caseId}?provisioned=1`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to provision onboarding case');
    } finally {
      setWorking(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <button className="back-link" onClick={() => navigate('/super-admin/onboarding/cases')}>
                  <ArrowLeft /> Back to onboarding cases
                </button>
                <h1 className="page-title">{title}</h1>
                <p className="page-sub">{caseItem ? `Case ${caseItem.caseId}` : 'Case detail'}</p>
              </div>

              <div className="row-end">
                {caseItem && <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />}
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </header>

            {isLoading ? (
              <section className="bch-card" style={{ display: 'grid', placeItems: 'center', padding: 56, marginTop: 14 }}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </section>
            ) : error || !caseItem ? (
              <section className="bch-card card-pad" style={{ marginTop: 14 }}>
                <div className="empty-list-title">Case not found</div>
                <div className="empty-list-sub">{error || 'The onboarding case could not be resolved.'}</div>
              </section>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" style={{ marginTop: 14 }}>
                <div className="space-y-4">
                  <section className="bch-card card-pad">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-green-700)]">
                          <ShieldCheck className="h-4 w-4" />
                          Compliance review workspace
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-foreground">{caseItem.organization?.legalName || caseItem.affiliateName || '-'}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{caseItem.organization?.tradingName || 'No trading name provided'}</p>
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <SummaryMetric label="Submitted" value={formatDateTime(caseItem.submittedAt)} icon={<Clock3 className="h-4 w-4" />} />
                          <SummaryMetric label="Registration" value={caseItem.kybSummary?.registrationNumber || caseItem.organization?.registrationNumber || '-'} icon={<FileText className="h-4 w-4" />} />
                          <SummaryMetric label="Documents" value={`${caseItem.documents.length}`} icon={<CheckCircle2 className="h-4 w-4" />} />
                        </div>
                      </div>

                      <div className="rounded-md border border-border bg-muted/30 p-4 lg:w-[260px]">
                        <p className="text-xs text-muted-foreground">Case ID</p>
                        <p className="mono mt-1 break-all text-sm font-semibold">{caseItem.caseId}</p>
                        <p className="mt-3 text-xs text-muted-foreground">Updated</p>
                        <p className="mt-1 text-sm font-medium">{formatDateTime(caseItem.updatedAt)}</p>
                      </div>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Panel title="Organization Profile" subtitle="Business identity and registered address">
                      <div className="space-y-3">
                        <InfoLine icon={<Building2 className="h-4 w-4" />} label="Legal name" value={caseItem.organization?.legalName || caseItem.affiliateName || '-'} />
                        <InfoLine icon={<FileText className="h-4 w-4" />} label="Affiliate ID" value={caseItem.affiliateId || '-'} mono />
                        <InfoLine icon={<MapPin className="h-4 w-4" />} label="Address" value={address || '-'} />
                        <InfoLine icon={<ShieldCheck className="h-4 w-4" />} label="KYB status" value={caseItem.kybSummary?.status || caseItem.status} />
                      </div>
                    </Panel>

                    <Panel title="Primary Contact" subtitle="Responsible contact for the application">
                      <div className="space-y-3">
                        <InfoLine icon={<UserRound className="h-4 w-4" />} label="Name" value={primaryContact?.fullName || '-'} />
                        <InfoLine icon={<Mail className="h-4 w-4" />} label="Email" value={primaryContact?.email || '-'} />
                        <InfoLine icon={<Phone className="h-4 w-4" />} label="Phone" value={primaryContact?.phone || '-'} />
                        <InfoLine icon={<MapPin className="h-4 w-4" />} label="Country" value={caseItem.kybSummary?.country || caseItem.organization?.country || caseItem.organization?.address?.country || '-'} />
                      </div>
                    </Panel>
                  </section>

                  <Panel title="Submitted Documents" subtitle={`${caseItem.documents.length} document${caseItem.documents.length === 1 ? '' : 's'} attached`}>
                    {caseItem.documents.length === 0 ? (
                      <EmptyLine>No documents attached yet.</EmptyLine>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data">
                          <thead>
                            <tr>
                              <th>Document</th>
                              <th>ID</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseItem.documents.map((document) => (
                              <tr key={document.documentId}>
                                <td>{document.documentType || document.type}</td>
                                <td className="mono">{document.documentId}</td>
                                <td>
                                  <StatusChip
                                    status={
                                      document.verificationStatus === 'VERIFIED'
                                        ? 'VERIFIED'
                                        : document.verificationStatus === 'REJECTED'
                                          ? 'REJECTED'
                                          : 'PENDING'
                                    }
                                    label={document.verificationStatus || 'PENDING'}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>

                  <Panel title="Messages" subtitle={`${caseItem.messages.length} message${caseItem.messages.length === 1 ? '' : 's'} recorded`}>
                    {caseItem.messages.length === 0 ? (
                      <EmptyLine>No case messages yet.</EmptyLine>
                    ) : (
                      <div className="space-y-3">
                        {caseItem.messages.map((message, index) => (
                          <div key={`${message.type}-${message.at}-${index}`} className="rounded-md border border-border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                <MessageSquare className="h-4 w-4 text-[var(--cs-green-700)]" />
                                {message.type}
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDateTime(message.at)}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{message.text || message.message || '-'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  {caseItem.status === 'APPROVED' && (
                    <Panel title="Affiliate Creation Payload" subtitle="Provisioning values for the approved case">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <DetailTile label="Type" value="EXTERNAL" />
                        <DetailTile label="Case ID" value={caseItem.caseId} mono />
                        <DetailTile label="Legal name" value={caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'} />
                        <DetailTile label="Short name" value={caseItem.organization?.tradingName || caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'} />
                        <DetailTile label="Selected banks" value={caseItem.issuingBankIds.length ? caseItem.issuingBankIds.join(', ') : 'None'} />
                      </div>
                    </Panel>
                  )}
                </div>

                <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                  <section className="bch-card card-pad">
                    <div className="section-head" style={{ marginTop: 0 }}>
                      <div>
                        <div className="section-title">Reviewer Decision</div>
                        <div className="section-sub">Record the next review outcome.</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Field label="Reason">
                        <input
                          className="bch-input"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          disabled={working}
                          placeholder="Reason for decision"
                        />
                      </Field>
                      <Field label="Internal Reviewer Note">
                        <textarea
                          className="bch-input"
                          style={{ minHeight: 112, resize: 'vertical' }}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          disabled={working}
                          placeholder="Internal reviewer note"
                        />
                      </Field>
                    </div>

                    <div className="divider-top mt-4 grid grid-cols-1 gap-2">
                      {canApprove && (
                        <Button onClick={() => doDecision('APPROVE')} disabled={working}>
                          Approve
                        </Button>
                      )}
                      {canRequestClarification && (
                        <Button variant="secondary" onClick={() => doDecision('CLARIFY')} disabled={working}>
                          Request clarification
                        </Button>
                      )}
                      {canReject && (
                        <Button variant="danger" onClick={() => doDecision('REJECT')} disabled={working}>
                          Reject
                        </Button>
                      )}
                      <Button variant="secondary" onClick={doProvision} disabled={working || !canProvision}>
                        Provision
                      </Button>
                    </div>
                  </section>

                  <section className="bch-card card-pad">
                    <div className="section-head" style={{ marginTop: 0 }}>
                      <div>
                        <div className="section-title">Timeline</div>
                        <div className="section-sub">{caseItem.timeline.length} event{caseItem.timeline.length === 1 ? '' : 's'}</div>
                      </div>
                    </div>

                    {caseItem.timeline.length === 0 ? (
                      <EmptyLine>No timeline events available.</EmptyLine>
                    ) : (
                      <ol className="space-y-3">
                        {caseItem.timeline.map((entry, index) => (
                          <li key={`${entry.status}-${entry.at}-${index}`} className="relative pl-6">
                            <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--cs-green-700)]" />
                            {index !== caseItem.timeline.length - 1 && <span className="absolute left-[4px] top-5 h-[calc(100%+0.5rem)] w-px bg-border" />}
                            <p className="text-sm font-semibold">{entry.status}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </aside>
              </div>
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function SummaryMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bch-card card-pad">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">{title}</div>
          <div className="section-sub">{subtitle}</div>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoLine({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="mt-0.5 text-[var(--cs-green-700)]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={mono ? 'mono break-all text-sm font-medium' : 'break-words text-sm font-medium'}>{value}</p>
      </div>
    </div>
  );
}

function DetailTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? 'mono break-all text-sm font-medium' : 'break-words text-sm font-medium'}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="bch-label">{label}</label>
      {children}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="section-sub">{children}</p>;
}
