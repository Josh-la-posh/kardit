import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface Bank {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  onboardedDate: string;
  totalAffiliates: number;
  approvedAffiliates: number;
  rejectedAffiliates: number;
}

// Mock data - Replace with API call
const mockBanks: Bank[] = [
  {
    id: '1',
    code: 'PROVIDUS',
    name: 'Providus Bank',
    email: 'partnerships@providusbank.com',
    phone: '+234 1 295 5000',
    onboardedDate: '2024-01-15',
    totalAffiliates: 24,
    approvedAffiliates: 18,
    rejectedAffiliates: 2,
  },
  {
    id: '2',
    code: 'WEMA',
    name: 'WEMA Bank',
    email: 'partners@wemabank.com',
    phone: '+234 1 225 4000',
    onboardedDate: '2024-01-10',
    totalAffiliates: 31,
    approvedAffiliates: 25,
    rejectedAffiliates: 3,
  },
  {
    id: '3',
    code: 'STANBIC',
    name: 'Stanbic IBTC',
    email: 'corporate@stanbicibtc.com',
    phone: '+234 1 896 7000',
    onboardedDate: '2024-02-01',
    totalAffiliates: 19,
    approvedAffiliates: 16,
    rejectedAffiliates: 1,
  },
  {
    id: '4',
    code: 'STERLING',
    name: 'Sterling Bank',
    email: 'business@sterling.ng',
    phone: '+234 1 279 5000',
    onboardedDate: '2024-02-05',
    totalAffiliates: 22,
    approvedAffiliates: 20,
    rejectedAffiliates: 1,
  },
  {
    id: '5',
    code: 'FIRSTBANK',
    name: 'FirstBank',
    email: 'partnerships@firstbanknigeria.com',
    phone: '+234 1 448 0000',
    onboardedDate: '2024-01-20',
    totalAffiliates: 28,
    approvedAffiliates: 23,
    rejectedAffiliates: 2,
  },
];

export default function BanksPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanks = useMemo(() => {
    return mockBanks.filter(bank => {
      const matchesSearch = 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [searchTerm]);

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
              title="Partner Banks"
              subtitle={`${filteredBanks.length} bank${filteredBanks.length !== 1 ? 's' : ''} on the platform`}
              showBack={false}
            />
          </div>

          {/* Search Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Search Banks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by bank name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {searchTerm && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </Card>

          {/* Banks Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bank Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Affiliates</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Onboarded Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBanks.map((bank) => (
                      <tr key={bank.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{bank.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">
                            {bank.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bank.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bank.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-gray-900">{bank.totalAffiliates}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bank.onboardedDate}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/super-admin/banks/${bank.id}`)}
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

              {filteredBanks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No banks found matching your search.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
