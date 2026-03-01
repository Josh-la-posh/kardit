import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  Layers, 
  FileText,
  Bell, 
  History,
  UserCog,
  ArrowRight,
} from 'lucide-react';

/**
 * DashboardPage - SCR-DBL-001
 * 
 * Route: /dashboard
 * Main dashboard with module navigation cards
 */

const modules: Array<{ label: string; icon: any; path: string; description: string; roles?: string[] }> = [
  { 
    label: 'Customers', 
    icon: Users, 
    path: '/customers',
    description: 'Manage customer accounts and profiles'
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
    description: 'Load transactions and history'
  },
  { 
    label: 'Batch Operations', 
    icon: Layers, 
    path: '/batch-operations',
    description: 'Bulk processing and batch jobs'
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
    description: 'System alerts and messages'
  },
  { 
    label: 'Audit Logs', 
    icon: History, 
    path: '/audit-logs',
    description: 'Activity history and audit trails',
    roles: ['Super Admin']
  },
  { 
    label: 'User Management', 
    icon: UserCog, 
    path: '/users',
    description: 'Manage system users and roles',
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

  const visibleModules = modules.filter((m) => {
    if (!m.roles?.length) return true;
    const role = user?.role;
    return role ? m.roles.includes(role) : false;
  });

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader 
            title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
            subtitle="Access your modules from the dashboard"
            showBack={false}
          />

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleModules.map((module) => (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="kardit-card p-5 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  {module.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
