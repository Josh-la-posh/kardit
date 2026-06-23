import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
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
              <section className="bch-card" style={{ display: 'grid', placeItems: 'center', padding: 48, marginTop: 14 }}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </section>
            ) : error || !caseItem ? (
              <section className="bch-card card-pad" style={{ marginTop: 14 }}>
                <div className="empty-list-title">Case not found</div>
                <div className="empty-list-sub">{error || 'The onboarding case could not be resolved.'}</div>
              </section>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                <section className="kpis">
                  <Kpi label="Submitted" value={formatDateTime(caseItem.submittedAt)} sub={`Updated ${formatDateTime(caseItem.updatedAt)}`} />
                  <Kpi label="Registration" value={caseItem.kybSummary?.registrationNumber || caseItem.organization?.registrationNumber || '-'} sub="Business identifier" />
                  <Kpi label="Country" value={caseItem.kybSummary?.country || caseItem.organization?.country || caseItem.organization?.address?.country || '-'} sub="Operating jurisdiction" />
                  <Kpi label="Documents" value={String(caseItem.documents.length)} sub="Submitted files" />
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <InfoSection title="Organization">
                    <Detail label="Legal name" value={caseItem.organization?.legalName || caseItem.affiliateName || '-'} />
                    <Detail label="Trading name" value={caseItem.organization?.tradingName || '-'} />
                    <Detail label="Affiliate ID" value={caseItem.affiliateId || '-'} mono />
                    <Detail label="Address" value={caseItem.organization?.address?.line1 || caseItem.organization?.addressLine1 || '-'} />
                  </InfoSection>

                  <InfoSection title="Primary Contact">
                    <Detail label="Name" value={primaryContact?.fullName || '-'} />
                    <Detail label="Email" value={primaryContact?.email || '-'} />
                    <Detail label="Phone" value={primaryContact?.phone || '-'} />
                    <Detail label="KYB status" value={caseItem.kybSummary?.status || caseItem.status} />
                  </InfoSection>
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Panel title="Documents" subtitle={`${caseItem.documents.length} document${caseItem.documents.length === 1 ? '' : 's'}`}>
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

                  <Panel title="Timeline" subtitle={`${caseItem.timeline.length} event${caseItem.timeline.length === 1 ? '' : 's'}`}>
                    {caseItem.timeline.length === 0 ? (
                      <EmptyLine>No timeline events available.</EmptyLine>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseItem.timeline.map((entry, index) => (
                              <tr key={`${entry.status}-${entry.at}-${index}`}>
                                <td>{entry.status}</td>
                                <td>{formatDateTime(entry.at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                </section>

                <section className="bch-card card-pad">
                  <div className="section-head" style={{ marginTop: 0 }}>
                    <div>
                      <div className="section-title">Reviewer Action</div>
                      <div className="section-sub">Record the review outcome for this onboarding case.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                        style={{ minHeight: 94, resize: 'vertical' }}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={working}
                        placeholder="Internal reviewer note"
                      />
                    </Field>
                  </div>

                  <div className="row-end divider-top" style={{ marginTop: 16 }}>
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
                    {canApprove && (
                      <Button onClick={() => doDecision('APPROVE')} disabled={working}>
                        Approve
                      </Button>
                    )}
                    <Button variant="secondary" onClick={doProvision} disabled={working || !canProvision}>
                      Provision
                    </Button>
                  </div>
                </section>

                <Panel title="Messages" subtitle={`${caseItem.messages.length} message${caseItem.messages.length === 1 ? '' : 's'}`}>
                  {caseItem.messages.length === 0 ? (
                    <EmptyLine>No case messages yet.</EmptyLine>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Message</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseItem.messages.map((message, index) => (
                            <tr key={`${message.type}-${message.at}-${index}`}>
                              <td>{message.type}</td>
                              <td>{message.text || message.message || '-'}</td>
                              <td>{formatDateTime(message.at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                {caseItem.status === 'APPROVED' && (
                  <section className="bch-card card-pad">
                    <div className="section-title">Affiliate Creation Payload</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" style={{ marginTop: 12 }}>
                      <DetailTile label="Type" value="EXTERNAL" />
                      <DetailTile label="Case ID" value={caseItem.caseId} mono />
                      <DetailTile label="Legal name" value={caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'} />
                      <DetailTile label="Short name" value={caseItem.organization?.tradingName || caseItem.organization?.legalName || caseItem.affiliateName || 'N/A'} />
                      <DetailTile label="Selected banks" value={caseItem.issuingBankIds.length ? caseItem.issuingBankIds.join(', ') : 'None'} />
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
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

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bch-card card-pad">
      <div className="section-title">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ marginTop: 12 }}>
        {children}
      </div>
    </section>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <DetailTile label={label} value={value} mono={mono} />;
}

function DetailTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? 'text-sm font-medium mono break-all' : 'text-sm font-medium break-words'}>{value}</p>
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
