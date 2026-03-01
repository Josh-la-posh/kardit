import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, passwordMustChange, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (passwordMustChange) {
      navigate('/change-password');
    }
  }, [isAuthenticated, passwordMustChange, navigate]);

  if (!isAuthenticated || passwordMustChange) {
    return null;
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
