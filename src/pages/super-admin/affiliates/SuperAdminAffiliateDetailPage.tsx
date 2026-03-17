import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, FileText, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface AffiliateCustomer {
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

// Mock customers data per affiliate (only for approved affiliates)
const mockAffiliateCustomers: { [key: string]: AffiliateCustomer[] } = {
  '2': [
    {
      id: '1',
      fullName: 'Ahmed Hassan',
      email: 'ahmed@globalpartners.ng',
      phone: '+234 801 234 5678',
      status: 'active',
      createdDate: '2024-02-25',
    },
    {
      id: '2',
      fullName: 'Fatima Hassan',
      email: 'fatima@globalpartners.ng',
      phone: '+234 802 234 5678',
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
  '4': [
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
};

// Mock cards data per affiliate (only for approved affiliates)
const mockAffiliateCards: { [key: string]: AffiliateCard[] } = {
  '2': [
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
  '4': [
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
};

// Mock data - This would come from your store/API
const mockAffiliatesData: Record<string, any> = {
  '1': {
    id: '1',
    affiliateName: 'TechFlow Solutions',
    email: 'info@techflow.ng',
    contactPerson: 'Chioma Okafor',
    submittedDate: '2024-02-28',
    status: 'pending',
    issuingBank: 'providus',
    enabled: false,
    description: 'Trusted technology partner specializing in digital infrastructure solutions',
    registrationNumber: 'RC 123456',
    businessAddress: '45 Lekki Expressway, Lagos, Nigeria',
    phoneNumber: '+234 701 234 5678',
    documents: [
      { id: '1', name: 'Certificate of Incorporation.pdf', uploadedDate: '2024-02-28', size: '2.4 MB' },
      { id: '2', name: 'Business Registration.pdf', uploadedDate: '2024-02-28', size: '1.8 MB' },
      { id: '3', name: 'Tax Clearance.pdf', uploadedDate: '2024-02-28', size: '952 KB' },
      { id: '4', name: 'Board Resolution.pdf', uploadedDate: '2024-02-28', size: '1.1 MB' },
    ],
  },
  '2': {
    id: '2',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    submittedDate: '2024-02-25',
    status: 'approved',
    issuingBank: 'stanbic',
    enabled: true,
    description: 'International trading and commerce facilitation services',
    registrationNumber: 'RC 789012',
    businessAddress: '23 Victoria Island, Lagos, Nigeria',
    phoneNumber: '+234 801 234 5678',
    documents: [
      { id: '1', name: 'Certificate of Incorporation.pdf', uploadedDate: '2024-02-25', size: '2.1 MB' },
      { id: '2', name: 'Business Registration.pdf', uploadedDate: '2024-02-25', size: '1.9 MB' },
      { id: '3', name: 'Tax Clearance.pdf', uploadedDate: '2024-02-25', size: '876 KB' },
    ],
  },
  '3': {
    id: '3',
    affiliateName: 'Premium Services Ltd',
    email: 'hello@premiumservices.ng',
    contactPerson: 'Victoria Adeyemi',
    submittedDate: '2024-02-20',
    status: 'rejected',
    issuingBank: 'wema',
    enabled: false,
    description: 'Comprehensive business and professional services provider',
    registrationNumber: 'RC 345678',
    businessAddress: '89 Ikoyi Drive, Lagos, Nigeria',
    phoneNumber: '+234 902 234 5678',
    documents: [
      { id: '1', name: 'Certificate of Incorporation.pdf', uploadedDate: '2024-02-20', size: '2.3 MB' },
      { id: '2', name: 'Business Registration.pdf', uploadedDate: '2024-02-20', size: '2.0 MB' },
    ],
  },
  '4': {
    id: '4',
    affiliateName: 'Digital Commerce Solutions',
    email: 'support@digitalcommerce.ng',
    contactPerson: 'Blessing Okonkwo',
    submittedDate: '2024-02-15',
    status: 'approved',
    issuingBank: 'sterling',
    enabled: true,
    description: 'End-to-end digital commerce platform and payment solutions',
    registrationNumber: 'RC 567890',
    businessAddress: '56 Ajose Adeogun, Victoria Island, Lagos',
    phoneNumber: '+234 803 234 5678',
    documents: [
      { id: '1', name: 'Certificate of Incorporation.pdf', uploadedDate: '2024-02-15', size: '2.2 MB' },
      { id: '2', name: 'Business Registration.pdf', uploadedDate: '2024-02-15', size: '1.7 MB' },
      { id: '3', name: 'Tax Clearance.pdf', uploadedDate: '2024-02-15', size: '1.1 MB' },
      { id: '4', name: 'Board Resolution.pdf', uploadedDate: '2024-02-15', size: '945 KB' },
      { id: '5', name: 'Financial Statements.pdf', uploadedDate: '2024-02-15', size: '3.2 MB' },
    ],
  },
  '5': {
    id: '5',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    submittedDate: '2024-02-10',
    status: 'pending',
    issuingBank: 'firstbank',
    enabled: false,
    description: 'Innovative technology solutions for financial services',
    registrationNumber: 'RC 901234',
    businessAddress: '12 Lekki Phase 1, Lagos, Nigeria',
    phoneNumber: '+234 704 234 5678',
    documents: [
      { id: '1', name: 'Certificate of Incorporation.pdf', uploadedDate: '2024-02-10', size: '2.0 MB' },
      { id: '2', name: 'Business Registration.pdf', uploadedDate: '2024-02-10', size: '1.6 MB' },
    ],
  },
};

interface Affiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  issuingBank: string;
  enabled?: boolean;
  description?: string;
  registrationNumber?: string;
  businessAddress?: string;
  phoneNumber?: string;
  documents?: Array<{ id: string; name: string; uploadedDate: string; size: string }>;
}

export default function SuperAdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(
    affiliateId ? mockAffiliatesData[affiliateId] : null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const allCustomers = affiliate?.status === 'approved' && affiliateId 
    ? mockAffiliateCustomers[affiliateId] || [] 
    : [];
  const allCards = affiliate?.status === 'approved' && affiliateId
    ? mockAffiliateCards[affiliateId] || []
    : [];

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      const matchesSearch = 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, allCustomers]);

  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesSearch = 
        card.cardHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || card.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, allCards]);

  const bankMap: { [key: string]: string } = {
    providus: 'Providus Bank',
    wema: 'WEMA Bank',
    stanbic: 'Stanbic IBTC',
    sterling: 'Sterling Bank',
    firstbank: 'FirstBank',
  };

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

  const handleActivate = () => {
    if (!affiliate) return;
    setIsUpdating(true);
    setTimeout(() => {
      setAffiliate({ ...affiliate, enabled: true });
      toast.success('✓ Affiliate activated');
      setIsUpdating(false);
    }, 500);
  };

  const handleDeactivate = () => {
    if (!affiliate) return;
    setIsUpdating(true);
    setTimeout(() => {
      setAffiliate({ ...affiliate, enabled: false });
      toast.error('✗ Affiliate deactivated');
      setIsUpdating(false);
    }, 500);
  };

  const handleApprove = () => {
    if (!affiliate) return;
    setIsUpdating(true);
    setTimeout(() => {
      setAffiliate({ ...affiliate, status: 'approved' });
      toast.success('Affiliate approved');
      setIsUpdating(false);
    }, 500);
  };

  const handleReject = () => {
    if (!affiliate) return;
    setIsUpdating(true);
    setTimeout(() => {
      setAffiliate({ ...affiliate, status: 'rejected' });
      toast.error('Affiliate rejected');
      setIsUpdating(false);
    }, 500);
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          {affiliate && (
            <>
              <PageHeader
                title={affiliate.affiliateName}
                subtitle={`Affiliate ID: ${affiliate.id} • ${bankMap[affiliate.issuingBank] || affiliate.issuingBank}`}
                actions={
                  <div className="flex items-center gap-2">
                    {getStatusBadge(affiliate.status)}
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/super-admin/affiliates')}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button> */}
                  </div>
                }
              />

              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="customers">Customers ({allCustomers.length})</TabsTrigger>
                  <TabsTrigger value="cards">Cards ({allCards.length})</TabsTrigger>
                  <TabsTrigger value="management">Management</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                        <p className="text-sm font-medium">{affiliate.affiliateName}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Registration Number</p>
                        <p className="text-sm font-medium">{affiliate.registrationNumber || 'N/A'}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-medium">{affiliate.email}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="text-sm font-medium">{affiliate.phoneNumber || 'N/A'}</p>
                      </div>
                      <div className="rounded-md border border-border p-4 md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Business Address</p>
                        <p className="text-sm font-medium">{affiliate.businessAddress || 'N/A'}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
                        <p className="text-sm font-medium">{affiliate.contactPerson}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Issuing Bank</p>
                        <p className="text-sm font-medium">{bankMap[affiliate.issuingBank]}</p>
                      </div>
                    </div>
                    {affiliate.description && (
                      <div className="mt-4 rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{affiliate.description}</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Submission Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
                        <p className="text-sm font-medium">{affiliate.submittedDate}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Compliance Status</p>
                        {getStatusBadge(affiliate.status)}
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Submitted Documents
                    </h3>
                    {affiliate.documents && affiliate.documents.length > 0 ? (
                      <div className="space-y-2">
                        {affiliate.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {doc.uploadedDate} • {doc.size}
                                </p>
                              </div>
                            </div>
                            {/* <Button size="sm" variant="outline">View</Button> */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No documents submitted</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-4">
                  {affiliate.status === 'approved' ? (
                    <>
                      <Card className="border-0 shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                            <Input
                              id="search"
                              placeholder="Search by name or email..."
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

                      <Card className="border-0 shadow-lg">
                        <div className="p-6">
                          <h2 className="text-2xl font-bold mb-4">Customers</h2>
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
                                {filteredCustomers.map((customer) => (
                                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{customer.fullName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.createdDate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {filteredCustomers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>{allCustomers.length === 0 ? 'No customers assigned to this affiliate.' : 'No customers found matching your filters.'}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-6">
                      <div className="text-center py-8 text-gray-500">
                        <p>Customers are only available for approved affiliates</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Cards Tab */}
                <TabsContent value="cards" className="space-y-4">
                  {affiliate.status === 'approved' ? (
                    <>
                      <Card className="border-0 shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                            <Input
                              id="search"
                              placeholder="Search by holder or card number..."
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
                              <option value="blocked">Blocked</option>
                              <option value="expired">Expired</option>
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
                                    <td className="px-4 py-3 text-sm">
                                      <Badge className={
                                        card.status === 'active' ? 'bg-green-100 text-green-800' :
                                        card.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }>
                                        {card.status === 'active' ? 'Active' : card.status === 'blocked' ? 'Blocked' : 'Expired'}
                                      </Badge>
                                    </td>
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
                    </>
                  ) : (
                    <Card className="p-6">
                      <div className="text-center py-8 text-gray-500">
                        <p>Cards are only available for approved affiliates</p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Management Tab */}
                <TabsContent value="management" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Compliance Review
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-sm font-medium mb-3">Compliance Status</p>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(affiliate.status)}
                          <span className="text-sm text-muted-foreground">
                            {affiliate.status === 'pending'
                              ? 'Awaiting review'
                              : affiliate.status === 'approved'
                              ? 'Approved for operations'
                              : 'Rejected'}
                          </span>
                        </div>
                      </div>

                      {affiliate.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleReject}
                            disabled={isUpdating}
                          >
                            Reject
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={isUpdating}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Affiliate Operation Status
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-sm font-medium mb-3">Current Status</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${affiliate.enabled ? 'bg-green-600' : 'bg-gray-400'}`}
                          />
                          <span className="text-sm font-medium">
                            {affiliate.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                    
                    </div>
                  </Card>

                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
