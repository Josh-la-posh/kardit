import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBankDashboardData } from '@/hooks/useBankPortal';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export default function BankDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    affiliates,
    auditLogs,
    reports,
    auditPage,
    auditPageSize,
    auditTotal,
    reportPage,
    reportPageSize,
    reportTotal,
    generatedAt,
    isLoading,
    error,
    refresh,
    goToAuditPage,
    goToReportPage,
  } = useBankDashboardData();

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
  const auditTotalPages = getTotalPages(auditTotal, auditPageSize);
  const reportTotalPages = getTotalPages(reportTotal, reportPageSize);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={`${user?.tenantName || 'Bank'} Portal`}
            subtitle={''}
            actions={
              <Button variant="outline" size="sm" onClick={() => refresh({ auditPage, reportPage })} disabled={isLoading}>
                <RefreshCw className="mr-1 h-4 w-4" /> Refresh
              </Button>
            }
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="kardit-card p-6 text-sm text-muted-foreground">{error || 'Dashboard data unavailable'}</div>
          ) : (
            <>
              <div className="mb-3 text-xs text-muted-foreground">
                Generated {generatedAt ? format(new Date(generatedAt), 'MMM d, yyyy HH:mm') : '-'}
              </div>

              {/* <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Cards Issued" value={formatNumber(metrics.totalCardsIssued)} icon={CreditCard} subtitle={`${formatNumber(metrics.activeCards)} active`} />
                <StatCard title="Funding Volume" value={formatNumber(metrics.totalFundingVolume)} icon={TrendingUp} subtitle={`Unload ${formatNumber(metrics.totalUnloadVolume)}`} />
                <StatCard title="Transactions" value={formatNumber(metrics.totalTransactionVolume)} icon={ScrollText} subtitle={`${formatNumber(metrics.failedCmsRequests)} failed CMS`} />
                <StatCard title="Pending Approvals" value={formatNumber(metrics.pendingApprovals)} icon={Building2} subtitle={`${formatNumber(metrics.frozenCards)} frozen, ${formatNumber(metrics.terminatedCards)} terminated`} />
              </div> */}

              <div className="grid gap-6">
                <div className="kardit-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="font-semibold">Recent Audit Logs</h2>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-muted-foreground">No audit logs returned.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Resource Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Occurred</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {auditLogs.map((log) => (
                            <tr key={log.auditLogId} className="hover:bg-muted/30">
                              <td className="px-4 py-3 text-sm font-medium">{log.eventType}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{log.resourceType || '-'}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{log.actorUserId || '-'}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border px-6 py-4">
                    <p className="text-sm text-muted-foreground">
                      Page {auditPage} of {auditTotalPages} • {auditTotal} total log{auditTotal === 1 ? '' : 's'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={isLoading || auditPage <= 1} onClick={() => goToAuditPage(auditPage - 1)}>
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || auditPage >= auditTotalPages}
                        onClick={() => goToAuditPage(auditPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6 grid gap-6 lg:grid-cols-2 mt-10">
                <div className="kardit-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                      <h2 className="font-semibold">Attached Affiliates</h2>
                      <p className="text-sm text-muted-foreground">Portfolio affiliates attached to this bank.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                      View more
                    </Button>
                  </div>
                  {affiliates.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-muted-foreground">No affiliates attached yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Cards</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Cards</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Funding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {affiliates.slice(0, 5).map((affiliate) => (
                            <tr
                              key={affiliate.affiliateId}
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => navigate(`/bank/affiliates/${affiliate.affiliateId}`)}
                            >
                              <td className="px-4 py-3 text-sm">
                                <p className="font-medium">{affiliate.affiliateName || 'Unnamed Affiliate'}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{formatNumber(affiliate.activeCards)}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {formatNumber(affiliate.totalCards)}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{formatNumber(affiliate.totalFundingVolume)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="kardit-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="font-semibold">Recent Reports</h2>
                  </div>
                  {reports.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-muted-foreground">No reports returned.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Report Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Generated</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reports.map((report) => (
                            <tr key={report.reportId} className="hover:bg-muted/30">
                              <td className="px-4 py-3 text-sm font-medium">{report.reportType}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm')}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {report.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border px-6 py-4">
                    <p className="text-sm text-muted-foreground">
                      Page {reportPage} of {reportTotalPages} • {reportTotal} total report{reportTotal === 1 ? '' : 's'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={isLoading || reportPage <= 1} onClick={() => goToReportPage(reportPage - 1)}>
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || reportPage >= reportTotalPages}
                        onClick={() => goToReportPage(reportPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
