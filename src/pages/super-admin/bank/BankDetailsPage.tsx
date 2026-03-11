import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface BankAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  approvalDate: string;
  status: 'active' | 'inactive' | 'pending';
}

interface Bank {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  onboardedDate: string;
}

// Mock banks data
const mockBanks: { [key: string]: Bank } = {
  '1': {
    id: '1',
    code: 'PROVIDUS',
    name: 'Providus Bank',
    email: 'partnerships@providusbank.com',
    phone: '+234 1 295 5000',
    onboardedDate: '2024-01-15',
  },
  '2': {
    id: '2',
    code: 'WEMA',
    name: 'WEMA Bank',
    email: 'partners@wemabank.com',
    phone: '+234 1 225 4000',
    onboardedDate: '2024-01-10',
  },
  '3': {
    id: '3',
    code: 'STANBIC',
    name: 'Stanbic IBTC',
    email: 'corporate@stanbicibtc.com',
    phone: '+234 1 896 7000',
    onboardedDate: '2024-02-01',
  },
  '4': {
    id: '4',
    code: 'STERLING',
    name: 'Sterling Bank',
    email: 'business@sterling.ng',
    phone: '+234 1 279 5000',
    onboardedDate: '2024-02-05',
  },
  '5': {
    id: '5',
    code: 'FIRSTBANK',
    name: 'FirstBank',
    email: 'partnerships@firstbanknigeria.com',
    phone: '+234 1 448 0000',
    onboardedDate: '2024-01-20',
  },
};

// Mock affiliates data per bank
const mockBankAffiliates: { [key: string]: BankAffiliate[] } = {
  '1': [
    {
      id: '1',
      affiliateName: 'TechFlow Solutions',
      email: 'info@techflow.ng',
      contactPerson: 'Chioma Okafor',
      approvalDate: '2024-02-26',
      status: 'active',
    },
    {
      id: '2',
      affiliateName: 'Digital Commerce Solutions',
      email: 'support@digitalcommerce.ng',
      contactPerson: 'Blessing Okonkwo',
      approvalDate: '2024-02-16',
      status: 'active',
    },
    {
      id: '3',
      affiliateName: 'Finance Hub Ltd',
      email: 'contact@financehub.ng',
      contactPerson: 'Adekunle Olabode',
      approvalDate: '2024-02-12',
      status: 'inactive',
    },
  ],
  '2': [
    {
      id: '4',
      affiliateName: 'Global Trade Partners',
      email: 'contact@globalpartners.ng',
      contactPerson: 'Ahmed Hassan',
      approvalDate: '2024-02-26',
      status: 'active',
    },
    {
      id: '5',
      affiliateName: 'Premium Services Ltd',
      email: 'hello@premiumservices.ng',
      contactPerson: 'Victoria Adeyemi',
      approvalDate: '2024-02-22',
      status: 'active',
    },
    {
      id: '6',
      affiliateName: 'Smart Solutions Inc',
      email: 'info@smartsolutions.ng',
      contactPerson: 'Emeka Obi',
      approvalDate: '2024-02-18',
      status: 'active',
    },
  ],
  '3': [
    {
      id: '7',
      affiliateName: 'Tech Innovations Ltd',
      email: 'info@techinnovations.ng',
      contactPerson: 'Tunde Adebayo',
      approvalDate: '2024-02-28',
      status: 'active',

    },
  ],
  '4': [],
  '5': [],
};

export default function BankDetailsPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const bank = bankId ? mockBanks[bankId] : null;
  const allAffiliates = bankId ? mockBankAffiliates[bankId] || [] : [];

  const filteredAffiliates = useMemo(() => {
    return allAffiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || affiliate.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, allAffiliates]);

  const activeCount = allAffiliates.filter(a => a.status === 'active').length;
  const inactiveCount = allAffiliates.filter(a => a.status === 'inactive').length;
  const rejectedCount = allAffiliates.filter(a => a.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (!bank) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-12">
            <p className="text-gray-500">Bank not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/super-admin/banks')}
              className="mt-4 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/super-admin/banks')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHeader
              title={bank.name}
              subtitle={`Bank Code: ${bank.code}`}
              showBack={false}
            />
          </div>

          {/* Bank Details Card */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-sm">{bank.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold text-sm">{bank.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Onboarded Date</p>
                <p className="font-semibold text-sm">{bank.onboardedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Affiliates Issued</p>
                <p className="font-semibold text-lg text-blue-600">{allAffiliates.length}</p>
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Affiliates</p>
                  <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactive Affiliates</p>
                  <p className="text-3xl font-bold text-gray-600">{inactiveCount}</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-lg p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{rejectedCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-semibold mb-2 block">Status</Label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Affiliates Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Issued Affiliates</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affiliate Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Issued Date</th>
                      {/* <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{affiliate.affiliateName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.contactPerson}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.email}</td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(affiliate.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.approvalDate}</td>
                        {/* <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => toast.info('View details for ' + affiliate.affiliateName)}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAffiliates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>{allAffiliates.length === 0 ? 'No affiliates have been issued by this bank yet.' : 'No affiliates found matching your filters.'}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
