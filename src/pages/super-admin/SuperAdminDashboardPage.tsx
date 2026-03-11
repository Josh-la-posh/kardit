import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Building2, Shield, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComplianceAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  issuingBank: string;
}

// Mock data - Replace with API call
const mockComplianceAffiliates: ComplianceAffiliate[] = [
  {
    id: '1',
    affiliateName: 'TechFlow Solutions',
    email: 'info@techflow.ng',
    contactPerson: 'Chioma Okafor',
    submittedDate: '2024-02-28',
    status: 'pending',
    issuingBank: 'providus', 
  },
  {
    id: '2',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    submittedDate: '2024-02-25',
    status: 'approved',
    issuingBank: 'stanbic',
  },
  {
    id: '3',
    affiliateName: 'Premium Services Ltd',
    email: 'hello@premiumservices.ng',
    contactPerson: 'Victoria Adeyemi',
    submittedDate: '2024-02-20',
    status: 'rejected',
    issuingBank: 'wema',
  },
];

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<ComplianceAffiliate[]>(mockComplianceAffiliates);

  const pendingCount = affiliates.filter(a => a.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getBankLabel = (bank: string) => {
    const bankMap: { [key: string]: string } = {
      providus: 'Providus Bank',
      wema: 'WEMA Bank',
      stanbic: 'Stanbic IBTC',
      sterling: 'Sterling Bank',
      firstbank: 'FirstBank',
    };
    return bankMap[bank] || bank;
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <PageHeader
            title={user?.tenantName || "Service Provider"}
            subtitle="Global oversight dashboard"
            showBack={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate('/super-admin/affiliates')}
            >
              <StatCard title="Total Affiliates" value={affiliates.length.toString()} icon={Users} />
            </div>
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate('/super-admin/pending-approval')}
            >
              <StatCard title="Pending Approval" value={pendingCount.toString()} icon={Shield} />
            </div>
            {/* <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate('/super-admin/approved')}
            >
              <StatCard title="Approved" value={approvedCount.toString()} icon={CheckCircle} />
            </div> */}
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate('/super-admin/banks')}
            >
              <StatCard title="Banks" value={"5"} icon={Building2} />
            </div>
            {/* <StatCard title="Compliance Events" value={"—"} icon={Shield} /> */}
            <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/audit-logs')}>
              <StatCard title="Platform Activity" value={"—"} icon={Activity} />
            </div>
          </div>

          {/* Compliance Affiliates Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Affiliate Onboarding Submissions</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affiliate Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{affiliate.affiliateName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.contactPerson}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getBankLabel(affiliate.issuingBank)}</td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(affiliate.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.submittedDate}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/super-admin/affiliates/${affiliate.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
