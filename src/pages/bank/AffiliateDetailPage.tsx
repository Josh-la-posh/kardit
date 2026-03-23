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

interface AffiliateUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdDate: string;
}

interface AffiliateCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  cardType: string;
  status: 'active' | 'blocked' | 'expired';
  issuedDate: string;
  balance: number;
}

interface Affiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  approvedDate: string;
  status: 'active' | 'inactive';
}

// Mock affiliates data
const mockAffiliatesDetail: { [key: string]: Affiliate } = {
  '1': {
    id: '1',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    approvedDate: '2024-02-25',
    status: 'active',
  },
  '2': {
    id: '2',
    affiliateName: 'Digital Commerce Solutions',
    email: 'support@digitalcommerce.ng',
    contactPerson: 'Blessing Okonkwo',
    approvedDate: '2024-02-15',
    status: 'active',
  },
  '3': {
    id: '3',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    approvedDate: '2024-02-10',
    status: 'active',
  },
  '4': {
    id: '4',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    approvedDate: '2024-02-10',
    status: 'inactive',
  },
};

// Mock users data per affiliate
const mockAffiliateUsers: { [key: string]: AffiliateUser[] } = {
  '1': [
    {
      id: '1',
      fullName: 'Ahmed Hassan',
      email: 'ahmed@globalpartners.ng',
      phone: '+234 803 234 5678',
      status: 'active',
      createdDate: '2024-02-25',
    },
    {
      id: '2',
      fullName: 'Fatima Hassan',
      email: 'fatima@globalpartners.ng',
      phone: '+234 803 234 5678',
      status: 'active',
      createdDate: '2024-02-26',
    },
    {
      id: '3',
      fullName: 'Yusuf Usman',
      email: 'yusuf@globalpartners.ng',
      phone: '+234 803 234 5678',
      status: 'inactive',
      createdDate: '2024-02-28',
    },
  ],
  '2': [
    {
      id: '4',
      fullName: 'Blessing Okonkwo',
      email: 'blessing@digitalcommerce.ng',
      phone: '+234 803 234 5678',
      status: 'active',
      createdDate: '2024-02-15',
    },
    {
      id: '5',
      fullName: 'Chidinma Okafor',
      email: 'chidinma@digitalcommerce.ng',
      phone: '+234 804 234 5678',
      status: 'active',
      createdDate: '2024-02-16',
    },
  ],
  '3': [
    {
      id: '6',
      fullName: 'Tunde Adebayo',
      email: 'tunde@techinnovations.ng',
      phone: '+234 803 234 5678',
      status: 'active',
      createdDate: '2024-02-10',
    },
  ],
  '4': [],
};

// Mock cards data per affiliate
const mockAffiliateCards: { [key: string]: AffiliateCard[] } = {
  '1': [
    {
      id: 'CARD001',
      cardNumber: '****-****-****-1234',
      cardHolder: 'Ahmed Hassan',
      cardType: 'Platinum',
      status: 'active',
      issuedDate: '2024-02-25',
      balance: 250000,
    },
    {
      id: 'CARD002',
      cardNumber: '****-****-****-5678',
      cardHolder: 'Fatima Hassan',
      cardType: 'Gold',
      status: 'active',
      issuedDate: '2024-02-26',
      balance: 150000,
    },
    {
      id: 'CARD003',
      cardNumber: '****-****-****-9012',
      cardHolder: 'Yusuf Usman',
      cardType: 'Standard',
      status: 'blocked',
      issuedDate: '2024-02-28',
      balance: 50000,
    },
  ],
  '2': [
    {
      id: 'CARD004',
      cardNumber: '****-****-****-3456',
      cardHolder: 'Blessing Okonkwo',
      cardType: 'Platinum',
      status: 'active',
      issuedDate: '2024-02-15',
      balance: 300000,
    },
    {
      id: 'CARD005',
      cardNumber: '****-****-****-7890',
      cardHolder: 'Chidinma Okafor',
      cardType: 'Gold',
      status: 'active',
      issuedDate: '2024-02-16',
      balance: 200000,
    },
  ],
  '3': [
    {
      id: 'CARD006',
      cardNumber: '****-****-****-2468',
      cardHolder: 'Tunde Adebayo',
      cardType: 'Platinum',
      status: 'active',
      issuedDate: '2024-02-10',
      balance: 280000,
    },
  ],
  '4': [],
};

export default function AffiliateDetailPages() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'cards'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const affiliate = affiliateId ? mockAffiliatesDetail[affiliateId] : null;
  const allUsers = affiliateId ? mockAffiliateUsers[affiliateId] || [] : [];
  const allCards = affiliateId ? mockAffiliateCards[affiliateId] || [] : [];

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, allUsers]);

  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesSearch = 
        card.cardHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || card.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, allCards]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (!affiliate) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="text-center py-12">
            <p className="text-gray-500">Affiliate not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/bank/dashboard')}
              className="mt-4 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bank/active-affiliates')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <PageHeader
              title={affiliate.affiliateName}
              subtitle={`Contact: ${affiliate.contactPerson}`}
              showBack={false}
            />
          </div>

          {/* Affiliate Details Card */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Affiliate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-sm">{affiliate.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <div>{getStatusBadge(affiliate.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved Date</p>
                <p className="font-semibold text-sm">{affiliate.approvedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users & Cards</p>
                <div className="flex gap-3">
                  <span className="font-semibold text-blue-600">{allUsers.length} Users</span>
                  <span className="font-semibold text-green-600">{allCards.length} Cards</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Users ({allUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'cards'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards ({allCards.length})
            </button>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                <Input
                  id="search"
                  placeholder={activeTab === 'users' ? 'Search by name or email...' : 'Search by holder or card number...'}
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
                  {activeTab === 'users' ? (
                    <>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </>
                  ) : (
                    <>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="expired">Expired</option>
                    </>
                  )}
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

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card className="border-0 shadow-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Users</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{user.fullName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(user.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.createdDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>{allUsers.length === 0 ? 'No users assigned to this affiliate.' : 'No users found matching your filters.'}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Cards Tab */}
          {activeTab === 'cards' && (
            <Card className="border-0 shadow-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Cards</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Card Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Card Holder</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Balance</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Issued Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((card) => (
                        <tr key={card.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{card.cardNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{card.cardHolder}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{card.cardType}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(card.status)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">₦{card.balance.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{card.issuedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredCards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>{allCards.length === 0 ? 'No cards issued to this affiliate.' : 'No cards found matching your filters.'}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
