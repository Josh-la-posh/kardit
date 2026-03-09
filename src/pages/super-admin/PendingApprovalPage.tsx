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
import { ChevronLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  submittedDate: string;
  issuingBank: string;
}

// Mock data - Replace with API call
const mockPendingAffiliates: PendingAffiliate[] = [
  {
    id: '1',
    affiliateName: 'TechFlow Solutions',
    email: 'info@techflow.ng',
    contactPerson: 'Chioma Okafor',
    submittedDate: '2024-02-28',
    issuingBank: 'providus',
  },
  {
    id: '5',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    submittedDate: '2024-02-10',
    issuingBank: 'firstbank',
  },
];

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState(mockPendingAffiliates);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const banks = ['providus', 'wema', 'stanbic', 'sterling', 'firstbank'];

  const filteredAffiliates = useMemo(() => {
    return affiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBank = filterBank === 'all' || affiliate.issuingBank === filterBank;
      const matchesDate = !filterDate || affiliate.submittedDate === filterDate;

      return matchesSearch && matchesBank && matchesDate;
    });
  }, [searchTerm, filterBank, filterDate, affiliates]);

  const handleApprove = (id: string) => {
    setReviewingId(id);
    setActionType('approve');
    setShowDialog(true);
  };

  const handleReject = (id: string) => {
    setReviewingId(id);
    setActionType('reject');
    setShowDialog(true);
  };

  const confirmAction = () => {
    if (reviewingId && actionType) {
      const newAffiliates = affiliates.filter(a => a.id !== reviewingId);
      setAffiliates(newAffiliates);
      toast.success(actionType === 'approve' ? 'Affiliate approved!' : 'Affiliate rejected!');
      setShowDialog(false);
      setReviewingId(null);
      setActionType(null);
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
            <div>
              <PageHeader
                title="Pending Approvals"
                subtitle={`${filteredAffiliates.length} submission${filteredAffiliates.length !== 1 ? 's' : ''} awaiting review`}
                showBack={false}
              />
            </div>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  setFilterBank('all');
                  setFilterDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Pending Submissions Table */}
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.length > 0 ? (
                      filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{affiliate.affiliateName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.contactPerson}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getBankLabel(affiliate.issuingBank)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.submittedDate}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="gap-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(affiliate.id)}
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-2"
                                onClick={() => handleReject(affiliate.id)}
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <p>{affiliates.length === 0 ? 'All submissions approved or rejected!' : 'No pending submissions found matching your filters.'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Action Confirmation Dialog */}
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {actionType === 'approve' ? 'Approve Affiliate?' : 'Reject Affiliate?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {actionType === 'approve' 
                    ? 'This affiliate will be marked as approved and can proceed with activation.'
                    : 'This affiliate will be rejected. They can resubmit their application.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2 justify-end pt-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmAction}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
