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
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, passwordMustChange } = useAuth();
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

  return <>{children}</>;
}
