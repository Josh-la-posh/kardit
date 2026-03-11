import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, Eye,
} from "lucide-react";

interface Affiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  issuingBank: string;
  enabled?: boolean;
}

// Mock data - Replace with API call
const mockAffiliates: Affiliate[] = [
  {
    id: '1',
    affiliateName: 'TechFlow Solutions',
    email: 'info@techflow.ng',
    contactPerson: 'Chioma Okafor',
    submittedDate: '2024-02-28',
    status: 'pending',
    issuingBank: 'providus',
    enabled: false,
  },
  {
    id: '2',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    submittedDate: '2024-02-25',
    status: 'approved',
    issuingBank: 'stanbic',
    enabled: true,
  },
  {
    id: '3',
    affiliateName: 'Premium Services Ltd',
    email: 'hello@premiumservices.ng',
    contactPerson: 'Victoria Adeyemi',
    submittedDate: '2024-02-20',
    status: 'rejected',
    issuingBank: 'wema',
    enabled: false,
  },
  {
    id: '4',
    affiliateName: 'Digital Commerce Solutions',
    email: 'support@digitalcommerce.ng',
    contactPerson: 'Blessing Okonkwo',
    submittedDate: '2024-02-15',
    status: 'approved',
    issuingBank: 'sterling',
    enabled: true,
  },
  {
    id: '5',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    submittedDate: '2024-02-10',
    status: 'pending',
    issuingBank: 'firstbank',
    enabled: false,
  },
];

export default function AffiliatesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const [affiliates, setAffiliates] = useState<Affiliate[]>(mockAffiliates);
  
    const pendingCount = affiliates.filter(a => a.status === 'pending').length;
    const approvedCount = affiliates.filter(a => a.status === 'approved').length;
  

  const banks = ['providus', 'wema', 'stanbic', 'sterling', 'firstbank'];
  const statuses = ['pending', 'approved', 'rejected'];

  const filteredAffiliates = useMemo(() => {
    return mockAffiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || affiliate.status === filterStatus;
      const matchesBank = filterBank === 'all' || affiliate.issuingBank === filterBank;
      const matchesDate = !filterDate || affiliate.submittedDate === filterDate;

      return matchesSearch && matchesStatus && matchesBank && matchesDate;
    });
  }, [searchTerm, filterStatus, filterBank, filterDate]);

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
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/super-admin/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHeader
              title="All Affiliates"
              subtitle="View and manage all onboarded affiliates"
              showBack={false}
            />
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="bank" className="text-sm font-semibold mb-2 block">Issuing Bank</Label>
                <select
                  id="bank"
                  value={filterBank}
                  onChange={(e) => setFilterBank(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Banks</option>
                  {banks.map(bank => (
                    <option key={bank} value={bank}>
                      {getBankLabel(bank)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-semibold mb-2 block">Submitted Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterBank('all');
                  setFilterDate('');
                }}
              >
                Clear Filters
              </Button>
              <span className="text-sm text-gray-600 self-center ml-auto">
                Showing {filteredAffiliates.length} of {mockAffiliates.length} affiliates
              </span>
            </div>
          </Card>

          {/* Affiliates Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
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
                    {filteredAffiliates.map((affiliate) => (
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

              {filteredAffiliates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No affiliates found matching your filters.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
