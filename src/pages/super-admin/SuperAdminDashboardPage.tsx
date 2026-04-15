import React from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  Bell,
  Building2,
  ClipboardCheck,
  FileText,
  Landmark,
  Receipt,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";

const modules: Array<{ label: string; icon: LucideIcon; path: string; description: string }> = [
  {
    label: "Banks",
    icon: Building2,
    path: "/super-admin/banks",
    description: "Manage platform banks",
  },
  {
    label: "Affiliates",
    icon: Users,
    path: "/super-admin/affiliates",
    description: "Review affiliate records",
  },
  {
    label: "Onboarding",
    icon: ClipboardCheck,
    path: "/super-admin/onboarding/cases",
    description: "Review submitted cases",
  },
  {
    label: "Issuing Banks",
    icon: Landmark,
    path: "/issuing-banks",
    description: "Provision issuing banks",
  },
  {
    label: "Pending Approval",
    icon: Shield,
    path: "/super-admin/pending-approval",
    description: "Handle approval queues",
  },
  {
    label: "Transactions",
    icon: Receipt,
    path: "/transactions",
    description: "Search card activity",
  },
  {
    label: "Reports",
    icon: FileText,
    path: "/reports",
    description: "View reporting tools",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    description: "Open system alerts",
  },
  {
    label: "Audit Logs",
    icon: Banknote,
    path: "/audit-logs",
    description: "Trace platform events",
  },
  {
    label: "User Management",
    icon: UserCog,
    path: "/users",
    description: "Manage users and roles",
  },
];

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ProtectedRoute requiredStakeholderTypes={["SERVICE_PROVIDER"]}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={`Welcome back, ${user?.name?.split(" ")[0] || "Admin"}`}
            subtitle={user?.tenantName || "Service Provider Dashboard"}
            showBack={false}
          />

          <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((module) => (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="kardit-card group p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <module.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground">{module.label}</h3>
                    <p className="truncate text-xs text-muted-foreground">{module.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
