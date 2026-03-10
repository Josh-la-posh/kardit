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
import { ChevronLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface ActiveAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  approvedDate: string;
  totalUsers: number;
  totalCards: number;
}

// Mock data - Replace with API call
const mockActiveAffiliates: ActiveAffiliate[] = [
  {
    id: '1',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    approvedDate: '2024-02-25',
    totalUsers: 5,
    totalCards: 12,
  },
  {
    id: '2',
    affiliateName: 'Digital Commerce Solutions',
    email: 'support@digitalcommerce.ng',
    contactPerson: 'Blessing Okonkwo',
    approvedDate: '2024-02-15',
    totalUsers: 8,
    totalCards: 24,
  },
  {
    id: '3',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    approvedDate: '2024-02-10',
    totalUsers: 3,
    totalCards: 7,
  },
];

export default function ActiveAffiliatesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState<string>('all');

  const filteredAffiliates = useMemo(() => {
    return mockActiveAffiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

     
      return matchesSearch;
    });
  }, [searchTerm, filterScore]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bank/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHeader
              title="Active Affiliates"
              subtitle={`${filteredAffiliates.length} active affiliate${filteredAffiliates.length !== 1 ? 's' : ''}`}
              showBack={false}
            />
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

              <div className="mt-7 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterScore('all');
                }}
              >
                Clear Filters
              </Button>
            </div>

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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Users</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cards</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Approved Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{affiliate.affiliateName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.contactPerson}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-blue-600">{affiliate.totalUsers}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-green-600">{affiliate.totalCards}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{affiliate.approvedDate}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/bank/affiliates/${affiliate.id}`)}
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
                  <p>No active affiliates found matching your filters.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
