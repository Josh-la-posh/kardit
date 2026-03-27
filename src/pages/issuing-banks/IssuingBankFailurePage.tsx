import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useIssuingBankSession } from '@/hooks/useIssuingBank';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function IssuingBankFailurePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading } = useIssuingBankSession(sessionId);

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading details...</p>
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
            <AlertTriangle className="h-10 w-10 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-6">Session not found</p>
            <Button variant="outline" onClick={() => navigate('/super-admin/banks')}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const handleTryAgain = async () => {
    try {
      toast.loading('Starting provisioning...');
      navigate(`/issuing-banks/${sessionId}/provisioning`);
    } catch (err) {
      toast.error('Failed to start provisioning');
    }
  };

  const handleEditDetails = () => {
    navigate(-1); // Go back to review page, which allows editing
  };

  const handleReturnToDashboard = () => {
    navigate('/super-admin/banks');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-xl space-y-6 text-center">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-100 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Provisioning Failed</h1>
                <p className="text-muted-foreground">
                  We encountered an error while provisioning your bank. Please try again.
                </p>
              </div>

              {/* Error Details Card */}
              {session.errorMessage && (
                <div className="kardit-card p-6 bg-red-50/50 border border-red-200 text-left">
                  <p className="text-xs text-red-600 font-semibold mb-2">ERROR DETAILS</p>
                  <p className="text-sm text-red-900 font-medium">{session.errorMessage}</p>
                  <p className="text-xs text-red-700 mt-3">
                    This is a temporary error. You can retry the provisioning process with the same bank details,
                    or edit the details if you believe there was incorrect information.
                  </p>
                </div>
              )}

              {/* Bank Information Card */}
              <div className="kardit-card p-6 text-left">
                <p className="text-xs text-muted-foreground font-semibold mb-4">BANK DETAILS</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                    <p className="font-semibold text-foreground">{session.bankDetails.name}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">
                      <span className="font-medium text-foreground">{session.bankDetails.code}</span>
                      {' • '}
                      <span>{session.bankDetails.country}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="kardit-card p-6 bg-blue-50/50 border border-blue-200 text-left">
                <p className="font-semibold text-blue-900 mb-3">Troubleshooting Tips</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Verify all bank details are correct and complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Ensure contact email and phone number are valid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Check your internet connection and try again</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>If the problem persists, contact support</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 flex flex-col">
                <Button
                  onClick={handleTryAgain}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleEditDetails}
                  variant="outline"
                  className="w-full"
                >
                  Edit Details
                </Button>
                <Button
                  onClick={handleReturnToDashboard}
                  variant="ghost"
                  className="w-full"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Return to Dashboard
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-muted-foreground mt-6">
                Need additional help? Contact our support team at support@kardit.app
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
