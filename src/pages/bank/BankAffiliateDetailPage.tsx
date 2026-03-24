import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useOnboardingCase, useReviewerOnboardingCases } from '@/hooks/useOnboarding';
import { Loader2, ArrowLeft, Building2, User, FileText, CheckCircle, XCircle, HelpCircle, Power, PowerOff, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusToChip: Record<string, StatusType> = {
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'PROCESSING',
  CLARIFICATION_REQUESTED: 'WARNING',
  REJECTED: 'FAILED',
  APPROVED: 'SUCCESS',
  PROVISIONED: 'SUCCESS',
};

/**
 * BankAffiliateDetailPage - Bank portal view to review individual affiliate application
 * Banks can view documents, approve, reject, or request clarification
 */
export default function BankAffiliateDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseItem, isLoading, error, refresh } = useOnboardingCase(caseId);
  const { decide } = useReviewerOnboardingCases();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [affiliateStatus, setAffiliateStatus] = useState<'active' | 'inactive' | 'suspended' | 'terminated'>('inactive');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | 'suspend' | 'terminate' | null>(null);
  const [notifyAffiliate, setNotifyAffiliate] = useState(true);

  // Set affiliate status based on case status when loaded
  useEffect(() => {
    if (caseItem?.status === 'APPROVED' || caseItem?.status === 'PROVISIONED') {
      setAffiliateStatus('active');
    }
  }, [caseItem?.status]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION') => {
    if (!caseId) return;
    setWorking(true);
    try {
      await decide(caseId, { decision, reason: reason || undefined, reviewerNote: note || undefined });
      
      let successMessage = '';
      if (decision === 'APPROVE') {
        successMessage = 'Affiliate approved and activated';
        setAffiliateStatus('active');
        setIsActive(true);
      } else if (decision === 'REJECT') {
        successMessage = 'Affiliate rejected';
      } else {
        successMessage = 'Clarification requested';
      }
      
      toast.success(successMessage);
      await refresh();
      setReason('');
      setNote('');
    } catch (err) {
      toast.error('Failed to process decision');
    } finally {
      setWorking(false);
    }
  };

  const openConfirmDialog = (action: 'activate' | 'deactivate' | 'suspend' | 'terminate') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setWorking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      let successMessage = '';
      let affiliateName = caseItem?.organization?.legalName || 'Affiliate';

      if (notifyAffiliate) {
        // Send notification to affiliate
        console.log(`Notifying ${affiliateName} about ${confirmAction} action`);
      }

      switch (confirmAction) {
        case 'activate':
          setIsActive(true);
          setAffiliateStatus('active');
          successMessage = `${affiliateName} has been activated`;
          toast.success(successMessage);
          break;
        case 'deactivate':
          setIsActive(false);
          setAffiliateStatus('inactive');
          successMessage = `${affiliateName} has been deactivated`;
          toast.error(successMessage);
          break;
        case 'suspend':
          setAffiliateStatus('suspended');
          successMessage = `${affiliateName} has been suspended`;
          toast.warning(successMessage);
          break;
        case 'terminate':
          setAffiliateStatus('terminated');
          successMessage = `${affiliateName} has been terminated`;
          toast.error(successMessage);
          break;
      }
    } catch (err) {
      toast.error('Failed to process action');
    } finally {
      setWorking(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setNotifyAffiliate(true);
    }
  };

  const getActionMessage = () => {
    const affiliateName = caseItem?.organization?.legalName || 'this affiliate';
    switch (confirmAction) {
      case 'activate':
        return `Activate ${affiliateName}? This affiliate will be able to perform transactions.`;
      case 'deactivate':
        return `Deactivate ${affiliateName}? This affiliate will not be able to perform transactions.`;
      case 'suspend':
        return `Suspend ${affiliateName}? This is a temporary restriction and can be reversed.`;
      case 'terminate':
        return `Terminate ${affiliateName}? This action is permanent and cannot be reversed.`;
      default:
        return '';
    }
  };

  const getActionColor = () => {
    switch (confirmAction) {
      case 'activate':
        return 'bg-green-600';
      case 'deactivate':
        return 'bg-amber-600';
      case 'suspend':
        return 'bg-orange-600';
      case 'terminate':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusInfo = () => {
    switch (affiliateStatus) {
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-600',
          icon: <Power className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'inactive':
        return {
          label: 'Inactive',
          color: 'bg-gray-400',
          icon: <PowerOff className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'suspended':
        return {
          label: 'Suspended',
          color: 'bg-orange-600',
          icon: <AlertTriangle className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'terminated':
        return {
          label: 'Terminated',
          color: 'bg-red-600',
          icon: <Trash2 className="h-4 w-4" />,
          textColor: 'text-white'
        };
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !caseItem) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['BANK']}>
        <AppLayout navVariant="bank">
          <div className="text-center py-20 text-muted-foreground">
            {error || 'Affiliate application not found'}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const canTakeAction = ['SUBMITTED', 'UNDER_REVIEW'].includes(caseItem.status);

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in">
          <PageHeader
            title={caseItem.organization?.legalName || 'Affiliate Application'}
            subtitle={`Case: ${caseItem.caseId}`}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={statusToChip[caseItem.status] || 'INACTIVE'} label={caseItem.status} />
                <Button variant="outline" size="sm" onClick={() => navigate('/bank/affiliates')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Organization Details */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Organization</h2>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Legal Name</dt>
                    <dd className="font-medium">{caseItem.organization?.legalName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Registration Number</dt>
                    <dd className="font-medium">{caseItem.organization?.registrationNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Country</dt>
                    <dd className="font-medium">{caseItem.organization?.country || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">
                      {caseItem.organization?.addressLine1 || '—'}
                      {caseItem.organization?.city && `, ${caseItem.organization.city}`}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Contact Details */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Primary Contact</h2>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{caseItem.contact?.contactName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{caseItem.contact?.contactEmail || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{caseItem.contact?.contactPhone || '—'}</dd>
                  </div>
                </dl>
              </div>

              {/* KYB Documents */}
              <div className="kardit-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KYB Documents</h2>
                </div>
                {caseItem.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {caseItem.documents.map((doc) => (
                      <div key={doc.documentId} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Actions */}
            <div className="space-y-4">
              {/* Timeline */}
              <div className="kardit-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(new Date(caseItem.submittedAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{format(new Date(caseItem.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Decision Actions */}
              {canTakeAction && (
                <div className="kardit-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Review Action</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Reason (optional)</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm mt-1"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={working}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Internal Note (optional)</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm mt-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={working}
                        placeholder="Internal note"
                      />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Button
                        className="w-full"
                        onClick={() => handleDecision('APPROVE')}
                        disabled={working}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDecision('REQUEST_CLARIFICATION')}
                        disabled={working}
                      >
                        <HelpCircle className="h-4 w-4 mr-1" /> Request Clarification
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDecision('REJECT')}
                        disabled={working}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Affiliate Activation/Deactivation */}
              {(caseItem.status === 'APPROVED' || caseItem.status === 'PROVISIONED') && (
                <div className="kardit-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Affiliate Operations</h3>
                  <div className="space-y-3">
                    <div className="rounded-md border border-border p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                      <p className="text-sm font-medium mb-3 text-muted-foreground">Current Status</p>
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${getStatusInfo().color} mb-4 w-full`}>
                        <div className={getStatusInfo().textColor}>
                          {getStatusInfo().icon}
                        </div>
                        <span className={`text-sm font-semibold ${getStatusInfo().textColor}`}>
                          {getStatusInfo().label}
                        </span>
                      </div>
                      
                      {affiliateStatus !== 'terminated' && (
                        <div className="space-y-2 mt-4">
                          <p className="text-sm font-medium mb-3">Actions</p>

                          <div className="space-y-2">
                            {/* Inactive: Show Activate, Suspend, Terminate */}
                            {affiliateStatus === 'inactive' && (
                              <>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={() => openConfirmDialog('activate')}
                                  disabled={working}
                                >
                                  <Power className="h-4 w-4 mr-1" /> Activate Affiliate
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                  onClick={() => openConfirmDialog('suspend')}
                                  disabled={working}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" /> Suspend Affiliate
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openConfirmDialog('terminate')}
                                  disabled={working}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Terminate Affiliate
                                </Button>
                              </>
                            )}

                            {/* Active: Show Suspend, Terminate */}
                            {affiliateStatus === 'active' && (
                              <>
                                <Button
                                  variant="outline"
                                  className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                  onClick={() => openConfirmDialog('suspend')}
                                  disabled={working}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" /> Suspend Affiliate
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openConfirmDialog('terminate')}
                                  disabled={working}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Terminate Affiliate
                                </Button>
                              </>
                            )}

                            {/* Suspended: Show Activate, Terminate */}
                            {affiliateStatus === 'suspended' && (
                              <>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={() => openConfirmDialog('activate')}
                                  disabled={working}
                                >
                                  <Power className="h-4 w-4 mr-1" /> Activate Affiliate
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openConfirmDialog('terminate')}
                                  disabled={working}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Terminate Affiliate
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Decision Info */}
              {caseItem.decisionReason && (
                <div className="kardit-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Decision Info</h3>
                  <p className="text-sm">{caseItem.decisionReason}</p>
                  {caseItem.reviewerNote && (
                    <p className="text-sm text-muted-foreground mt-2">Note: {caseItem.reviewerNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${getActionColor()} flex items-center justify-center`}>
                    {confirmAction === 'activate' && <Power className="h-6 w-6 text-white" />}
                    {confirmAction === 'deactivate' && <PowerOff className="h-6 w-6 text-white" />}
                    {confirmAction === 'suspend' && <AlertTriangle className="h-6 w-6 text-white" />}
                    {confirmAction === 'terminate' && <Trash2 className="h-6 w-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {confirmAction} Affiliate
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">{getActionMessage()}</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyAffiliate}
                      onChange={(e) => setNotifyAffiliate(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Notify affiliate about this action</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setConfirmAction(null);
                      setNotifyAffiliate(true);
                    }}
                    disabled={working}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 ${getActionColor()} hover:opacity-90`}
                    onClick={handleConfirmAction}
                    disabled={working}
                  >
                    {working ? 'Processing...' : 'Continue'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}