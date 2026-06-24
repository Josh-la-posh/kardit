import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * ProtectedRoute - Wrapper to protect authenticated routes
 * 
 * Usage:
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredStakeholderTypes?: Array<'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER'>;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredStakeholderTypes,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('code') && params.has('state')) {
      navigate(`/callback${location.search}`, { replace: true });
      return;
    }

    if (!isAuthenticated) {
      const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
      navigate(`/login?reason=protected_route&next=${next}`, { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname, location.search, location.hash]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredStakeholderTypes?.length) {
    const stakeholderType = user?.stakeholderType;
    const allowed = stakeholderType ? requiredStakeholderTypes.includes(stakeholderType) : false;
    if (!allowed) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  if (requiredRoles?.length) {
    const role = user?.role;
    const allowed = role ? requiredRoles.includes(role) : false;
    if (!allowed) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
