import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { Users, CreditCard, Wallet, Layers, FileText, Bell, History, UserCog, ArrowRight, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

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

  const [showComplianceBanner, setShowComplianceBanner] = useState(true);

  const complianceStatus = user?.complianceStatus || 'not_started';
  const isComplianceApproved = complianceStatus === 'approved';
  const isCompliancePending = complianceStatus === 'pending';
  const isComplianceNotStarted = complianceStatus === 'not_started';
  const isComplianceRejected = complianceStatus === 'rejected';
  const isAffiliate = user?.stakeholderType === 'AFFILIATE';

  // Get compliance banner info
  const getComplianceBannerInfo = () => {
    if (isComplianceNotStarted) {
      return {
        title: 'Compliance Form Required',
        message: 'Please complete your compliance form to access all features.',
        icon: AlertCircle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600',
      };
    }
    
    if (isCompliancePending) {
      return {
        title: 'Compliance Under Review',
        message: 'Your compliance form is being reviewed. This usually takes 2-5 business days.',
        icon: Clock,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
      };
    }

    if (isComplianceRejected) {
      return {
        title: 'Compliance Rejected',
        message: 'Your compliance application was rejected. Please contact support for assistance.',
        icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      };
    }

    if (isComplianceApproved) {
      return {
        title: 'Compliance Approved',
        message: 'Your account is fully verified. You have access to all features.',
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
      };
    }

    return null;
  };

  useEffect(() => {
    // set timeout to close compliance banner after 60 seconds
    const timer = setTimeout(() => {
      setShowComplianceBanner(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, [complianceStatus]);

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
          {/* Compliance Banner - Show above page header for affiliates */}
          {isAffiliate && showComplianceBanner && getComplianceBannerInfo() && (() => {
            const info = getComplianceBannerInfo();
            const Icon = info!.icon;
            return (
              <div className={`${info!.bgColor} border ${info!.borderColor} ${info!.textColor} text-sm px-4 py-4 mb-6 rounded-lg flex items-start gap-3`}>
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{info!.title}</h3>
                  <p className="text-sm">{info!.message}</p>
                </div>
                {isComplianceApproved && (
                  <button
                    onClick={() => setShowComplianceBanner(false)}
                    className="text-xl font-semibold opacity-50 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })()}
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
                onClick={() => {
                  if (isAffiliate && isComplianceApproved) {
                    navigate(module.path);
                  }
                }}
                disabled={isAffiliate && !isComplianceApproved}
                className={`kardit-card p-5 text-left transition-all duration-200 group ${
                  isAffiliate && isComplianceApproved 
                    ? 'hover:shadow-md hover:border-primary/30 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
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
