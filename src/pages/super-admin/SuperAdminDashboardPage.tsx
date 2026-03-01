import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Building2, Shield, Users } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={user?.tenantName || "Service Provider"}
            subtitle="Global oversight dashboard"
            showBack={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Affiliates" value={"—"} icon={Users} />
            <StatCard title="Banks" value={"—"} icon={Building2} />
            <StatCard title="Compliance Events" value={"—"} icon={Shield} />
            <StatCard title="Platform Activity" value={"—"} icon={Activity} />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
