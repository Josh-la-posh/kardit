import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import { useAuth } from '@/hooks/useAuth';
import { useBankDashboardData } from '@/hooks/useBankPortal';
import type { BankAffiliateSummary, BankAuditLogItem, BankReportItem } from '@/types/bankPortalContracts';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export default function BankDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    affiliates,
    affiliatesError,
    auditLogs,
    auditError,
    reports,
    reportsError,
    auditPage,
    reportPage,
    reportPageSize,
    reportTotal,
    generatedAt,
    isLoading,
    error,
    refresh,
    goToReportPage,
  } = useBankDashboardData();

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
  const reportTotalPages = getTotalPages(reportTotal, reportPageSize);

  const affiliatesPreview = useMemo(() => affiliates.slice(0, 5), [affiliates]);

  const auditColumns = useMemo(
    () => [
      {
        key: 'eventType',
        header: 'Event',
        className: 'text-sm font-medium text-foreground',
        render: (log: BankAuditLogItem) => log.eventType || '-',
      },
      {
        key: 'resourceType',
        header: 'Resource Type',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) => log.resourceType || '-',
      },
      {
        key: 'actorUserId',
        header: 'Actor',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) => log.actorUserId || '-',
      },
      {
        key: 'occurredAt',
        header: 'Occurred',
        className: 'text-sm text-muted-foreground',
        render: (log: BankAuditLogItem) =>
          log.occurredAt ? format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm') : '-',
      },
    ],
    []
  );

  const affiliateColumns = useMemo(
    () => [
      {
        key: 'affiliateName',
        header: 'Affiliate',
        className: 'text-sm',
        render: (affiliate: BankAffiliateSummary) => (
          <p className="font-medium text-foreground">{affiliate.affiliateName || 'Unnamed Affiliate'}</p>
        ),
      },
      {
        key: 'totalCards',
        header: 'Total Cards',
        className: 'text-sm text-muted-foreground',
        render: (affiliate: BankAffiliateSummary) => formatNumber(affiliate.totalCards),
      },
      {
        key: 'activeCards',
        header: 'Active Cards',
        className: 'text-sm text-muted-foreground',
        render: (affiliate: BankAffiliateSummary) => formatNumber(affiliate.activeCards),
      },
      {
        key: 'totalFundingVolume',
        header: 'Funding',
        className: 'text-sm text-muted-foreground',
        render: (affiliate: BankAffiliateSummary) => formatNumber(affiliate.totalFundingVolume),
      },
    ],
    []
  );

  const reportColumns = useMemo(
    () => [
      {
        key: 'reportType',
        header: 'Report Type',
        className: 'text-sm font-medium text-foreground',
        render: (report: BankReportItem) => report.reportType,
      },
      {
        key: 'generatedAt',
        header: 'Generated',
        className: 'text-sm text-muted-foreground',
        render: (report: BankReportItem) => format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm'),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'text-sm text-muted-foreground',
        render: (report: BankReportItem) => (
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {report.status}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">{user?.tenantName || 'Bank'} Portal</h1>
                <p className="page-sub">Overview of audit activity, affiliates, and operational reports.</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => refresh({ auditPage, reportPage })} disabled={isLoading}>
                <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
              </button>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <section className="bch-card p-6 text-sm text-muted-foreground">{error || 'Dashboard data unavailable'}</section>
            ) : (
              <>
                <section className="kpis" style={{ marginTop: 14 }}>
                  <Kpi label="Generated" value={generatedAt ? format(new Date(generatedAt), 'MMM d, HH:mm') : '-'} sub="Latest snapshot time" />
                  <Kpi label="Audit events" value={String(auditLogs.length)} sub="Current dashboard page" />
                  <Kpi label="Affiliates" value={String(affiliates.length)} sub="Attached to this bank" />
                  <Kpi label="Reports" value={String(reportTotal)} sub="Total generated reports" />
                </section>

                <section className="section-head" style={{ marginTop: 20 }}>
                  <div>
                    <div className="section-title">Recent Audit Logs</div>
                    <div className="section-sub">Latest bank activity entries</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/bank/audit-logs')}>
                    View more
                  </Button>
                </section>
                <PaginatedTable<BankAuditLogItem>
                  className="!rounded-[var(--cs-radius-lg)] !border-[var(--cs-line)] !shadow-[var(--cs-shadow-sm)]"
                  columns={auditColumns}
                  rows={auditLogs}
                  error={auditError}
                  emptyMessage="No audit logs returned."
                  rowKey={(log, index) => log.auditLogId || `${log.eventType}-${index}`}
                  page={1}
                  pageSize={Math.max(auditLogs.length, 1)}
                  total={Math.max(auditLogs.length, 1)}
                  onPageChange={() => {}}
                />

                <div className="grid gap-6 lg:grid-cols-2" style={{ marginTop: 24 }}>
                  <div>
                    <section className="section-head">
                      <div>
                        <div className="section-title">Attached Affiliates</div>
                        <div className="section-sub">Portfolio affiliates attached to this bank.</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                        View more
                      </Button>
                    </section>
                    <PaginatedTable<BankAffiliateSummary>
                      className="!rounded-[var(--cs-radius-lg)] !border-[var(--cs-line)] !shadow-[var(--cs-shadow-sm)]"
                      columns={affiliateColumns}
                      rows={affiliatesPreview}
                      error={affiliatesError}
                      emptyMessage="No affiliates attached yet."
                      rowKey={(affiliate) => affiliate.affiliateId}
                      onRowClick={(affiliate) => navigate(`/bank/affiliates/${affiliate.affiliateId}`)}
                      page={1}
                      pageSize={Math.max(affiliatesPreview.length, 1)}
                      total={Math.max(affiliatesPreview.length, 1)}
                      onPageChange={() => {}}
                    />
                  </div>

                  <div>
                    <section className="section-head">
                      <div>
                        <div className="section-title">Recent Reports</div>
                        <div className="section-sub">Generated reports in this bank scope</div>
                      </div>
                    </section>
                    <PaginatedTable<BankReportItem>
                      className="!rounded-[var(--cs-radius-lg)] !border-[var(--cs-line)] !shadow-[var(--cs-shadow-sm)]"
                      columns={reportColumns}
                      rows={reports}
                      error={reportsError}
                      emptyMessage="No reports returned."
                      rowKey={(report) => report.reportId}
                      page={reportPage}
                      pageSize={reportPageSize}
                      total={reportTotal}
                      onPageChange={goToReportPage}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Page {reportPage} of {reportTotalPages}</div>
                  </div>
                </div>
              </>
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
