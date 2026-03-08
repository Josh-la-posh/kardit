import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/hooks/useAuth';
import { store } from '@/stores/mockStore';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  Layers, 
  FileText,
  Bell, 
  UserCog,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
} from 'lucide-react';

/**
 * DashboardPage - SCR-DBL-001
 * 
 * Route: /dashboard
 * Affiliate dashboard with metrics and module navigation
 */

const modules: Array<{ label: string; icon: any; path: string; description: string; roles?: string[] }> = [
  { 
    label: 'Customers', 
    icon: Users, 
    path: '/customers',
    description: 'Manage customer accounts'
  },
  { 
    label: 'Cards', 
    icon: CreditCard, 
    path: '/cards',
    description: 'Card issuance and management'
  },
  { 
    label: 'Loads', 
    icon: Wallet, 
    path: '/loads',
    description: 'Load transactions'
  },
  { 
    label: 'Batch Operations', 
    icon: Layers, 
    path: '/batch-operations',
    description: 'Bulk processing'
  },
  { 
    label: 'Reports', 
    icon: FileText, 
    path: '/reports',
    description: 'Analytics and reporting'
  },
  { 
    label: 'Notifications', 
    icon: Bell, 
    path: '/notifications',
    description: 'System alerts'
  },
  { 
    label: 'User Management', 
    icon: UserCog, 
    path: '/users',
    description: 'Manage users and roles',
    roles: ['Admin', 'Super Admin']
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const stakeholderType = user?.stakeholderType;
    if (stakeholderType === 'BANK') {
      navigate('/bank/dashboard', { replace: true });
    }
    if (stakeholderType === 'SERVICE_PROVIDER') {
      navigate('/super-admin/dashboard', { replace: true });
    }
  }, [navigate, user?.stakeholderType]);

  // Calculate affiliate metrics
  const metrics = useMemo(() => {
    const tenantId = user?.tenantId;
    const customers = store.getCustomers(tenantId);
    const cards = store.getCards(tenantId);
    
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
    const inactiveCustomers = customers.filter(c => c.status !== 'ACTIVE').length;
    
    const totalCards = cards.length;
    const activeCards = cards.filter(c => c.status === 'ACTIVE').length;
    
    // Calculate total balance (credits) - simulating transaction totals
    const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
    
    // Simulated debit total (mock)
    const totalDebits = totalBalance * 0.3;
    
    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalCards,
      activeCards,
      totalBalance,
      totalDebits,
    };
  }, [user?.tenantId]);

  const visibleModules = modules.filter((m) => {
    if (!m.roles?.length) return true;
    const role = user?.role;
    return role ? m.roles.includes(role) : false;
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader 
            title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
            subtitle={user?.tenantName || 'Affiliate Dashboard'}
            showBack={false}
          />

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Total Customers" 
              value={metrics.totalCustomers.toString()} 
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard 
              title="Total Cards" 
              value={metrics.totalCards.toString()} 
              icon={CreditCard}
              subtitle={`${metrics.activeCards} active`}
            />
            <StatCard 
              title="Total Credits" 
              value={formatCurrency(metrics.totalBalance)} 
              icon={TrendingUp}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard 
              title="Total Debits" 
              value={formatCurrency(metrics.totalDebits)} 
              icon={TrendingDown}
            />
          </div>

          {/* Customer Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="kardit-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-semibold text-primary">{metrics.activeCustomers}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="kardit-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive/Pending Customers</p>
                  <p className="text-2xl font-semibold text-muted-foreground">{metrics.inactiveCustomers}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <UserX className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleModules.map((module) => (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="kardit-card p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <module.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">
                      {module.label}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {module.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
