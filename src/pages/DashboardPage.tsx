import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  Layers, 
  Bell, 
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';

/**
 * DashboardPage - SCR-DBL-001
 * 
 * Route: /dashboard
 * Main dashboard with summary widgets
 */

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardSummary();
  const { forceSessionExpired } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader 
            title="Dashboard" 
            subtitle="Overview of your business operations"
            actions={
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            }
          />

          {/* Loading State */}
          {isLoading && !data && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Customers */}
              <StatCard
                title="Total Customers"
                value={formatNumber(data.totalCustomers)}
                caption={`${formatNumber(data.activeCustomers)} active`}
                icon={Users}
                trend={{ value: 3.2, isPositive: true }}
              />

              {/* Cards */}
              <StatCard
                title="Total Cards"
                value={formatNumber(data.totalCards)}
                caption={`${formatNumber(data.activeCards)} active`}
                icon={CreditCard}
                trend={{ value: 5.1, isPositive: true }}
              />

              {/* Today's Loads */}
              <StatCard
                title="Today's Loads"
                value={formatNumber(data.todayLoadsCount)}
                caption={formatCurrency(data.todayLoadsAmount)}
                icon={Wallet}
                accentValue
              />

              {/* Pending Customer Batches */}
              <StatCard
                title="Pending Customer Batches"
                value={formatNumber(data.pendingCustomerBatches)}
                caption="Awaiting processing"
                icon={Layers}
              />

              {/* Pending Load Batches */}
              <StatCard
                title="Pending Load Batches"
                value={formatNumber(data.pendingLoadBatches)}
                caption="Awaiting processing"
                icon={Layers}
              />

              {/* Unread Notifications */}
              <StatCard
                title="Unread Notifications"
                value={formatNumber(data.unreadNotifications)}
                caption="Requires attention"
                icon={Bell}
                accentValue={data.unreadNotifications > 0}
              />
            </div>
          )}

          {/* Demo: Session Expiry Button */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="kardit-card p-4 max-w-md">
              <h3 className="text-sm font-medium mb-2">Demo Controls</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Test session expiry behavior
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={forceSessionExpired}
              >
                <AlertTriangle className="h-4 w-4" />
                Simulate Session Expiry
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
