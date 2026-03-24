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
import { useAuth } from "@/hooks/useAuth";
import { store } from "@/stores/mockStore";

interface CustomerDisplay {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  affiliateName: string;
  status: string;
  registrationDate: string;
  totalTransactions: number;
  totalCards: number;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get customers from store for current bank/affiliate
  const storeCustomers = useMemo(() => {
    if (!user?.tenantId) return [];
    return store.getCustomers(user.tenantId);
  }, [user?.tenantId]);

  // Get all cards for calculating per-customer card count
  const allCards = useMemo(() => {
    if (!user?.tenantId) return [];
    return store.getCards(user.tenantId);
  }, [user?.tenantId]);

  // Transform store customers to display format
  const displayCustomers = useMemo((): CustomerDisplay[] => {
    return storeCustomers.map(customer => {
      const customerCards = allCards.filter(card => card.customerId === customer.id);
      return {
        id: customer.id,
        fullName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phoneNumber: customer.phone || '-',
        affiliateName: user?.tenantName || 'Unknown',
        status: customer.status.toLowerCase() === 'pending' ? 'inactive' : 'active',
        registrationDate: new Date(customer.createdAt).toISOString().split('T')[0],
        totalTransactions: 0, // Not available in current data model
        totalCards: customerCards.length,
      };
    });
  }, [storeCustomers, allCards, user?.tenantName]);

  const filteredCustomers = useMemo(() => {
    return displayCustomers.filter(customer => {
      const matchesSearch = 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm) ||
        customer.affiliateName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, displayCustomers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

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
              title="Total Customers"
              subtitle={`${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''}`}
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
                  placeholder="Search by name, email, or phone..."
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
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
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

          {/* Customers Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affiliate</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cards</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{customer.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phoneNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.affiliateName}</td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(customer.status)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{customer.totalTransactions}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{customer.totalCards}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.registrationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No customers found matching your filters.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
