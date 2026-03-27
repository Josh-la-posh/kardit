import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useIssuingBankSession } from '@/hooks/useIssuingBank';
import { ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IssuingBankReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, submit } = useIssuingBankSession(sessionId);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bank details...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!session) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20">
            <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-6">Bank details not found</p>
            <Button variant="outline" onClick={() => navigate('/super-admin/banks')}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm the details are accurate');
      return;
    }

    setIsSubmitting(true);
    try {
      await submit();
      toast.success('Bank details submitted for provisioning');
      navigate(`/issuing-banks/${sessionId}/provisioning`);
    } catch (err) {
      toast.error('Failed to submit bank details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title="Review Bank Details"
            subtitle="Please review the information before submitting for provisioning"
          />

          <div className="max-w-2xl space-y-6">
            {/* Bank Information Summary */}
            <div className="kardit-card p-6">
              <h2 className="text-lg font-semibold mb-6">Bank Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Short Name</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.shortName}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Code</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.code}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.country}</p>
                </div>

                {session.bankDetails.bankAddress && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-semibold text-foreground whitespace-pre-wrap">
                      {session.bankDetails.bankAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information Summary */}
            <div className="kardit-card p-6">
              <h2 className="text-lg font-semibold mb-6">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.contactEmail}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-semibold text-foreground">{session.bankDetails.contactPhone}</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {session.bankDetails.additionalInfo && (
              <div className="kardit-card p-6">
                <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {session.bankDetails.additionalInfo}
                </p>
              </div>
            )}

            {/* Confirmation */}
            <div className="kardit-card p-6 border-l-4 border-l-blue-500">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border border-border text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-semibold text-foreground">I confirm the details are accurate</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By confirming, you acknowledge that all information provided is correct and complete.
                    The bank will be provisioned once submitted.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Back to Edit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!confirmed || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Provisioning'}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
