import React, { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Activity, Bell, Building2, CreditCard, Loader2, Shield, TriangleAlert, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getSuperAdminDashboard, listNotifications, listSuperAdminAuditLogs } from "@/services/superAdminApi";
import type { GetSuperAdminDashboardResponse, SuperAdminAuditLog, SuperAdminNotification } from "@/types/superAdminContracts";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<GetSuperAdminDashboardResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>([]);
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [dashboardResponse, auditLogsResponse, notificationsResponse] = await Promise.all([
          getSuperAdminDashboard(),
          listSuperAdminAuditLogs({
            requestContext: {
              actorUserId: user.id,
              userType: user.stakeholderType || "SERVICE_PROVIDER",
              tenantId: user.tenantId,
            },
            filters: {
              fromDate: getDateDaysAgo(30),
              toDate: new Date().toISOString().slice(0, 10),
            },
            pagination: {
              page: 1,
              pageSize: 5,
            },
          }),
          listNotifications(),
        ]);

        if (cancelled) return;

        setDashboard(dashboardResponse);
        setAuditLogs(auditLogsResponse.results);
        setNotifications(notificationsResponse.notifications);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const metrics = dashboard?.metrics;
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.status !== "READ"),
    [notifications]
  );

  const getAuditStatusBadge = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === "SUCCESS") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
    }
    if (normalizedStatus === "FAILED" || normalizedStatus === "ERROR") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>;
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={["SERVICE_PROVIDER"]}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <PageHeader
            title={user?.tenantName || "Service Provider"}
            subtitle="Global oversight dashboard"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/notifications")}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Button size="sm" onClick={() => navigate("/super-admin/reports")}>
                  View Reports
                </Button>
              </div>
            }
            showBack={false}
          />

          {isLoading ? (
            <Card className="border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3 p-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading dashboard data...</span>
              </div>
            </Card>
          ) : error ? (
            <Card className="border-0 shadow-lg">
              <div className="flex flex-col items-start gap-3 p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <TriangleAlert className="h-5 w-5" />
                  <span className="font-medium">Could not load dashboard data</span>
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button size="sm" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </Card>
          ) : metrics ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => navigate("/super-admin/affiliates")}>
                  <StatCard title="Total Tenants" value={numberFormatter.format(metrics.totalTenants)} icon={Shield} />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => navigate("/super-admin/banks")}>
                  <StatCard title="Total Banks" value={numberFormatter.format(metrics.totalBanks)} icon={Building2} />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => navigate("/super-admin/pending-approval")}>
                  <StatCard title="Pending Approvals" value={numberFormatter.format(metrics.pendingApprovals)} icon={Bell} accentValue />
                </div>
                <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => navigate("/audit-logs")}>
                  <StatCard title="Failed CMS Requests" value={numberFormatter.format(metrics.failedCmsRequests)} icon={Activity} />
                </div>
                <StatCard title="Cards Issued" value={numberFormatter.format(metrics.totalCardsIssued)} subtitle={`${numberFormatter.format(metrics.activeCards)} active`} icon={CreditCard} />
                <StatCard title="Frozen Cards" value={numberFormatter.format(metrics.frozenCards)} subtitle={`${numberFormatter.format(metrics.terminatedCards)} terminated`} icon={Shield} />
                <StatCard title="Funding Volume" value={currencyFormatter.format(metrics.globalFundingVolume)} subtitle={`Unloads ${currencyFormatter.format(metrics.globalUnloadVolume)}`} icon={Wallet} />
                <StatCard title="Transaction Volume" value={currencyFormatter.format(metrics.globalTransactionVolume)} subtitle={`Error rate ${metrics.errorRatePercentage}%`} icon={Activity} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <Card className="border-0 shadow-lg">
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Recent Audit Logs</h2>
                        <p className="text-sm text-muted-foreground">
                          Last refreshed {dashboard.generatedAt ? format(new Date(dashboard.generatedAt), "MMM d, yyyy HH:mm") : "just now"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/audit-logs")}>
                        View all
                      </Button>
                    </div>

                    {auditLogs.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No audit events found for the selected window.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Event</th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actor</th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {auditLogs.map((log) => (
                              <tr key={log.auditId} className="hover:bg-muted/30">
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  <div>{log.eventType}</div>
                                  <div className="text-xs text-muted-foreground">{log.action}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  <div>{log.entityType}</div>
                                  <div className="text-xs">{log.entityId}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  <div>{log.actorUserId}</div>
                                  <div className="text-xs">{log.actorRole}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{getAuditStatusBadge(log.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border-0 shadow-lg">
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Notifications</h2>
                        <p className="text-sm text-muted-foreground">
                          {unreadNotifications.length} unread of {notifications.length}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/notifications")}>
                        Open inbox
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.notificationId}
                          className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <Badge variant={notification.status === "READ" ? "secondary" : "default"}>
                              {notification.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{notification.type}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      ))}

                      {notifications.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                          No notifications available.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
