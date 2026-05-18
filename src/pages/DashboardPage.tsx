import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bell,
  CreditCard,
  FileText,
  Layers,
  Receipt,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { store } from '@/stores/mockStore';

/**
 * DashboardPage - SCR-DBL-001
 *
 * Route: /dashboard
 * Affiliate dashboard with metrics and module navigation
 */

type DashboardModule = {
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
  actionLabel: string;
  highlight?: boolean;
  roles?: string[];
};

const modules: DashboardModule[] = [
  {
    label: 'New customer',
    icon: Users,
    path: '/customers',
    description: 'Capture customer records, review KYC progress, and continue onboarding journeys.',
    actionLabel: 'Start',
  },
  {
    label: 'Batch issuance',
    icon: Layers,
    path: '/batch-operations',
    description: 'Upload and manage bulk processing runs for customer and card operations.',
    actionLabel: 'Start',
  },
  {
    label: 'Find a customer',
    icon: Receipt,
    path: '/transactions',
    description: 'Search activity, inspect records, and review linked card and transaction details.',
    actionLabel: 'Search',
  },
  {
    label: 'Issue a card',
    icon: CreditCard,
    path: '/cards',
    description: 'Create, activate, and manage virtual or physical cards for approved customers.',
    actionLabel: 'Start',
  },
  {
    label: 'Load funds',
    icon: Wallet,
    path: '/loads',
    description: 'Fund linked accounts, review submitted loads, and monitor operational flow.',
    actionLabel: 'Start',
    highlight: true,
  },
  {
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    description: 'Open reporting tools for performance, funding activity, and export-ready summaries.',
    actionLabel: 'Open',
  },
  {
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    description: 'Review alerts, approvals, and operational updates across the platform.',
    actionLabel: 'Open',
  },
  {
    label: 'User access',
    icon: UserCog,
    path: '/users',
    description: 'Manage user access, role assignments, and operating permissions for your team.',
    actionLabel: 'Manage',
    roles: ['Admin'],
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

  const metrics = useMemo(() => {
    const tenantId = user?.tenantId;
    const customers = store.getCustomers(tenantId);
    const cards = store.getCards(tenantId);

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((customer) => customer.status === 'ACTIVE').length;
    const totalCards = cards.length;
    const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);

    return {
      totalCustomers,
      activeCustomers,
      totalCards,
      totalBalance,
    };
  }, [user?.tenantId]);

  const visibleModules = modules.filter((module) => {
    if (!module.roles?.length) return true;
    const role = user?.role;
    return role ? module.roles.includes(role) : false;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in space-y-8">
          <section className="">

            <div className="relative space-y-6">
              <PageHeader
                title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
                subtitle={user?.tenantName || 'Affiliate Dashboard'}
                showBack={false}
                className="mb-0"
              />

              {/* <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Customers
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{metrics.totalCustomers}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {metrics.activeCustomers} active accounts
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Cards
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{metrics.totalCards}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Issued across your portfolio</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-4 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Balance
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatCurrency(metrics.totalBalance)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Current aggregate card value</p>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
                    Workspace
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">Get started</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Launch the most common journeys from one place.
                  </p>
                </div>
              </div> */}
            </div>

            {/* <section className="space-y-2 py-10">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Get started</h2>
            <p className="text-sm text-muted-foreground">Available journeys in this build</p>
            </section> */}

            <section className="grid grid-cols-1 gap-5 md:grid-cols-3 2xl:grid-cols-3 mt-10">
              {visibleModules.map((module) => (
                <button
                  key={module.path}
                  onClick={() => navigate(module.path)}
                  className={[
                    'group relative overflow-hidden rounded-[28px] border p-7 text-left transition-all duration-300',
                    'bg-card shadow-[0_18px_50px_-32px_rgba(0,0,0,0.55)] hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_28px_70px_-34px_rgba(34,197,94,0.28)]',
                    module.highlight ? 'border-primary/35' : 'border-border/80',
                  ].join(' ')}
                >
                  {/* <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" /> */}

                  <div className="relative flex h-full flex-col">

                    <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <module.icon className="h-6 w-6" />
                    </div>

                    <div className="mt-6 space-y-4">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                        {module.label}
                      </h3>
                      <p className="max-w-[34ch] text-base leading-8 text-muted-foreground">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-base font-semibold text-primary">
                      <span>{module.actionLabel}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
            </section>
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
