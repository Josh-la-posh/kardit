import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBankDashboardData } from '@/hooks/useBankPortal';
import { Building2, CreditCard, FileText, Loader2, RefreshCw, ScrollText, TrendingUp } from 'lucide-react';

export default function BankDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bankId, metrics, affiliates, auditLogs, reports, generatedAt, isLoading, error, refresh } = useBankDashboardData();

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={`${user?.tenantName || 'Bank'} Portal`}
            subtitle={''}
            actions={
              <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCw className="mr-1 h-4 w-4" /> Refresh
              </Button>
            }
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error || !metrics ? (
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

              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div className="kardit-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                      <h2 className="font-semibold">Attached Affiliates</h2>
                      <p className="text-sm text-muted-foreground">Portfolio affiliates attached to this bank.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                      View all
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

                <div className="grid gap-6">
                  <div className="kardit-card overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                      <h2 className="font-semibold">Recent Audit Logs</h2>
                    </div>
                    {auditLogs.length === 0 ? (
                      <div className="px-6 py-8 text-sm text-muted-foreground">No audit logs returned.</div>
                    ) : (
                      <div className="space-y-3 px-6 py-4">
                        {auditLogs.map((log) => (
                          <div key={log.auditLogId} className="rounded-md border border-border p-3">
                            <p className="text-sm font-medium">{log.eventType}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm')}</p>
                          </div>
                        ))}
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
                      <div className="space-y-3 px-6 py-4">
                        {reports.map((report) => (
                          <div key={report.reportId} className="flex items-center justify-between rounded-md border border-border p-3">
                            <div>
                              <p className="text-sm font-medium">{report.reportType}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm')}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              {report.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
