import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBankAffiliates } from '@/hooks/useBankPortal';
import { ChevronLeft, Eye, Loader2 } from 'lucide-react';

export default function ActiveAffiliatesPage() {
  const navigate = useNavigate();
  const { affiliates, isLoading, error } = useBankAffiliates();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAffiliates = useMemo(() => {
    return affiliates.filter((affiliate) => {
      const query = searchTerm.toLowerCase();
      if (!query) return true;
      return (
        affiliate.affiliateId.toLowerCase().includes(query) ||
        affiliate.tenantId.toLowerCase().includes(query) ||
        (affiliate.affiliateName || '').toLowerCase().includes(query)
      );
    });
  }, [affiliates, searchTerm]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bank/dashboard')} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHeader
              title="Active Affiliates"
              subtitle={`${filteredAffiliates.length} affiliate${filteredAffiliates.length !== 1 ? 's' : ''}`}
              showBack={false}
            />
          </div>

          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by affiliate name, ID, or tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="mt-7 flex gap-3">
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-gray-500">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affiliate</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tenant ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Active Cards</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Cards</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Funding Volume</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.affiliateId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <p className="font-medium">{affiliate.affiliateName || 'Unnamed Affiliate'}</p>
                            <p className="text-xs text-gray-500">{affiliate.affiliateId}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.tenantId}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.activeCards}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.totalCards}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.totalFundingVolume.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/bank/active-affiliates/${affiliate.affiliateId}`)}>
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && !error && filteredAffiliates.length === 0 && (
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
