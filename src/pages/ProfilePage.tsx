import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Shield, Building2 } from 'lucide-react';

/**
 * ProfilePage - User profile placeholder
 * 
 * Route: /profile
 */

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader 
            title="My Profile" 
            subtitle="View and manage your account settings"
          />

          <div className="max-w-2xl">
            <div className="kardit-card p-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.role}</p>
                </div>
              </div>

              {/* Details */}
              <div className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm">{user?.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Organization</p>
                    <p className="text-sm">{user?.tenantName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              Profile editing will be available in a future update.
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
