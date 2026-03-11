import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, FileText, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/super-admin/affiliates')}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </div>
                }
              />

              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
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

                      <div className="flex gap-2 justify-end">
                        {affiliate.enabled ? (
                          <Button
                            variant="destructive"
                            onClick={handleDeactivate}
                            disabled={isUpdating}
                          >
                            Deactivate Affiliate
                          </Button>
                        ) : (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleActivate}
                            disabled={isUpdating}
                          >
                            Activate Affiliate
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200 p-6">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Note:</span> Compliance approval allows the affiliate to be onboarded. Activation/
                      Deactivation controls whether they can currently operate through your platform.
                    </p>
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
