import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, DollarSign, FileText, Users } from "lucide-react";

export default function BankDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={`${user?.tenantName || "Bank"} Portal`}
            subtitle="Overview of portfolio activity"
            showBack={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Customers" value={"—"} icon={Users} />
            <StatCard title="Total Cards" value={"—"} icon={CreditCard} />
            <StatCard title="Total Loads" value={"—"} icon={DollarSign} />
            <StatCard title="Reports" value={"—"} icon={FileText} />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
