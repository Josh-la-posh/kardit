import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/hooks/useAuth";
import { useReviewerOnboardingCases } from "@/hooks/useOnboarding";
import { store } from "@/stores/mockStore";
import { Building2, CreditCard, Users, FileText, ArrowRight, TrendingUp } from "lucide-react";

export default function BankDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases } = useReviewerOnboardingCases();

  // Calculate bank portfolio metrics
  const metrics = useMemo(() => {
    // Count affiliates (from onboarding cases - approved/provisioned)
    const approvedAffiliates = cases.filter(c => 
      c.status === 'APPROVED' || c.status === 'PROVISIONED'
    ).length;
    const pendingAffiliates = cases.filter(c => 
      c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW'
    ).length;
    
    // Get all customers and cards across affiliates (for bank portfolio view)
    const allCustomers = store.getCustomers();
    const allCards = store.getCards();
    
    const totalCustomers = allCustomers.length;
    const activeCustomers = allCustomers.filter(c => c.status === 'ACTIVE').length;
    
    const totalCards = allCards.length;
    const activeCards = allCards.filter(c => c.status === 'ACTIVE').length;
    
    // Total balance across all cards
    const totalBalance = allCards.reduce((sum, card) => sum + card.currentBalance, 0);
    
    return {
      approvedAffiliates,
      pendingAffiliates,
      totalCustomers,
      activeCustomers,
      totalCards,
      activeCards,
      totalBalance,
    };
  }, [cases]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const quickActions = [
    { label: 'Affiliates', icon: Building2, path: '/bank/affiliates', description: 'Manage affiliate applications' },
    { label: 'Reports', icon: FileText, path: '/reports', description: 'View portfolio reports' },
  ];

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={`${user?.tenantName || "Bank"} Portal`}
            subtitle="Overview of your portfolio activity"
            showBack={false}
          />

          {/* Main Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Affiliates" 
              value={metrics.approvedAffiliates.toString()} 
              icon={Building2}
              subtitle={`${metrics.pendingAffiliates} pending`}
            />
            <StatCard 
              title="Total Customers" 
              value={metrics.totalCustomers.toString()} 
              icon={Users}
              subtitle={`${metrics.activeCustomers} active`}
            />
            <StatCard 
              title="Cards Issued" 
              value={metrics.totalCards.toString()} 
              icon={CreditCard}
              subtitle={`${metrics.activeCards} active`}
            />
            <StatCard 
              title="Portfolio Value" 
              value={formatCurrency(metrics.totalBalance)} 
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
            />
          </div>

          {/* Affiliate Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="kardit-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Affiliate Overview</h2>
                <button 
                  onClick={() => navigate('/bank/affiliates')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-semibold text-primary">{metrics.approvedAffiliates}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-semibold text-amber-500">{metrics.pendingAffiliates}</p>
                </div>
              </div>
            </div>

            <div className="kardit-card p-6">
              <h2 className="font-semibold mb-4">Card Distribution</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Cards</span>
                  <span className="font-medium">{metrics.activeCards}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${metrics.totalCards > 0 ? (metrics.activeCards / metrics.totalCards) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Frozen/Blocked: {metrics.totalCards - metrics.activeCards}</span>
                  <span>Total: {metrics.totalCards}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="kardit-card p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">{action.label}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
