import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, FileText, Loader2, RefreshCw, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { getAffiliateKybSnapshot } from '@/services/affiliateApi';
import { queryAffiliates } from '@/services/superAdminApi';
import type { GetAffiliateKybSnapshotResponse } from '@/types/affiliateContracts';
import type { AffiliateQueryItem } from '@/types/superAdminContracts';

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

interface LocationState {
  affiliate?: AffiliateQueryItem;
}

const emptyCustomers: AffiliateCustomer[] = [];
const emptyCards: AffiliateCard[] = [];

const formatDate = (value: string | undefined) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isApprovedAffiliate = (affiliate: AffiliateQueryItem) => {
  const status = affiliate.status.toUpperCase();
  return status === 'APPROVED' || status === 'ACTIVE';
};

const findAffiliateById = (affiliates: AffiliateQueryItem[], affiliateId: string) => {
  return affiliates.find((item) => item.affiliateId === affiliateId) || null;
};

export default function SuperAdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateAffiliate = (location.state as LocationState | null)?.affiliate;

  const [affiliate, setAffiliate] = useState<AffiliateQueryItem | null>(
    stateAffiliate?.affiliateId === affiliateId ? stateAffiliate : null
  );
  const [kybSnapshot, setKybSnapshot] = useState<GetAffiliateKybSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!affiliate);
  const [isKybLoading, setIsKybLoading] = useState(Boolean(affiliateId));
  const [error, setError] = useState<string | null>(null);
  const [kybError, setKybError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadAffiliate = useCallback(async () => {
    if (!affiliateId) {
      setAffiliate(null);
      setError('Affiliate not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const searchResponse = await queryAffiliates({
        filters: {
          status: null,
          bankId: null,
          country: null,
          fromDate: null,
          toDate: null,
          search: affiliateId,
        },
        page: 1,
        pageSize: 25,
      });

      let matchingAffiliate = findAffiliateById(searchResponse.data, affiliateId);

      if (!matchingAffiliate) {
        const fallbackResponse = await queryAffiliates({
          filters: {
            status: null,
            bankId: null,
            country: null,
            fromDate: null,
            toDate: null,
            search: null,
          },
          page: 1,
          pageSize: 100,
        });
        matchingAffiliate = findAffiliateById(fallbackResponse.data, affiliateId);
      }

      if (!matchingAffiliate) {
        setAffiliate(null);
        setError('Affiliate not found');
        return;
      }

      setAffiliate(matchingAffiliate);
    } catch (e) {
      setAffiliate(null);
      setError(e instanceof Error ? e.message : 'Failed to load affiliate');
    } finally {
      setIsLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    loadAffiliate();
  }, [loadAffiliate]);

  const loadKybSnapshot = useCallback(async () => {
    if (!affiliateId) {
      setKybSnapshot(null);
      setKybError('Affiliate not found');
      setIsKybLoading(false);
      return;
    }

    setIsKybLoading(true);
    setKybError(null);
    try {
      const response = await getAffiliateKybSnapshot(affiliateId);
      setKybSnapshot(response);
    } catch (e) {
      setKybSnapshot(null);
      setKybError(e instanceof Error ? e.message : 'Failed to load KYB snapshot');
    } finally {
      setIsKybLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    loadKybSnapshot();
  }, [loadKybSnapshot]);

  const approved = affiliate ? isApprovedAffiliate(affiliate) : false;
  const allCustomers = emptyCustomers;
  const allCards = emptyCards;

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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const handleUnavailableAction = (action: string) => {
    setIsUpdating(true);
    setTimeout(() => {
      toast.error(`${action} endpoint is not available yet`);
      setIsUpdating(false);
    }, 300);
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/super-admin/affiliates')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={loadAffiliate} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          ) : error || !affiliate ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <p>{error || 'Affiliate not found'}</p>
              </div>
            </Card>
          ) : (
            <>
              <PageHeader
                title={affiliate.legalName}
                subtitle={`Affiliate ID: ${affiliate.affiliateId}`}
                actions={
                  <div className="flex items-center gap-2">
                    {getStatusBadge(affiliate.status)}
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

                <TabsContent value="details" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Legal Name</p>
                        <p className="text-sm font-medium">{affiliate.legalName}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Trading Name</p>
                        <p className="text-sm font-medium">{affiliate.tradingName || 'N/A'}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Registration Number</p>
                        <p className="text-sm font-medium">{affiliate.registrationNumber || 'N/A'}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Country</p>
                        <p className="text-sm font-medium">{affiliate.country || 'N/A'}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Tenant ID</p>
                        <p className="text-sm font-medium">{affiliate.tenantId}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Created Date</p>
                        <p className="text-sm font-medium">{formatDate(affiliate.createdAt)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Submission Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Affiliate ID</p>
                        <p className="text-sm font-medium">{affiliate.affiliateId}</p>
                      </div>
                      <div className="rounded-md border border-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Compliance Status</p>
                        {getStatusBadge(affiliate.status)}
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Submitted Documents
                      </h3>
                      <Button variant="outline" size="sm" onClick={loadKybSnapshot} disabled={isKybLoading} className="gap-2">
                        {isKybLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Refresh
                      </Button>
                    </div>

                    {isKybLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : kybError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{kybError}</p>
                      </div>
                    ) : kybSnapshot?.onboardingSnapshot.documents.length ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-md border border-border p-4">
                            <p className="text-xs text-muted-foreground mb-1">Case ID</p>
                            <p className="text-sm font-medium">{kybSnapshot.onboardingSnapshot.caseId}</p>
                          </div>
                          <div className="rounded-md border border-border p-4">
                            <p className="text-xs text-muted-foreground mb-1">Onboarding Status</p>
                            {getStatusBadge(kybSnapshot.onboardingSnapshot.status)}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Document ID</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Document Type</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Verification Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {kybSnapshot.onboardingSnapshot.documents.map((document) => (
                                <tr key={document.documentId} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{document.documentId}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{document.documentType}</td>
                                  <td className="px-4 py-3 text-sm">{getStatusBadge(document.verificationStatus)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No documents returned for this affiliate.</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-4">
                  {approved ? (
                    <>
                      <Card className="border-0 shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customer-search" className="text-sm font-semibold mb-2 block">Search</Label>
                            <Input
                              id="customer-search"
                              placeholder="Search by name or email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="customer-status" className="text-sm font-semibold mb-2 block">Status</Label>
                            <select
                              id="customer-status"
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
                              <p>No customers returned for this affiliate.</p>
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

                <TabsContent value="cards" className="space-y-4">
                  {approved ? (
                    <>
                      <Card className="border-0 shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="card-search" className="text-sm font-semibold mb-2 block">Search</Label>
                            <Input
                              id="card-search"
                              placeholder="Search by holder or card number..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="card-status" className="text-sm font-semibold mb-2 block">Status</Label>
                            <select
                              id="card-status"
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
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">NGN {card.balance.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{card.issuedDate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {filteredCards.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No cards returned for this affiliate.</p>
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
                            {affiliate.status.toUpperCase() === 'PENDING'
                              ? 'Awaiting review'
                              : approved
                              ? 'Approved for operations'
                              : 'Rejected'}
                          </span>
                        </div>
                      </div>

                      {affiliate.status.toUpperCase() === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleUnavailableAction('Reject affiliate')}
                            disabled={isUpdating}
                          >
                            Reject
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUnavailableAction('Approve affiliate')}
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
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium mb-3">Current Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${approved ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">
                          {approved ? 'Active' : 'Inactive'}
                        </span>
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
