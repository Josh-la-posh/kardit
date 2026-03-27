import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useIssuingBankSession } from '@/hooks/useIssuingBank';
import { Check, Building2, AlertCircle } from 'lucide-react';

export default function IssuingBankSuccessPage() {
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
            <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-6">Bank details not found</p>
            <Button variant="outline" onClick={() => navigate('/super-admin/banks')}>
              Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const handleViewProfile = () => {
    // Note: In a real implementation, we'd get the created bank's ID from the session
    // For now, we'll navigate to the dashboard where the new bank should appear
    navigate('/issuing-banks');
  };

  const handleReturnToDashboard = () => {
    navigate('/issuing-banks');
  };

  const handleAddAnother = () => {
    navigate('/issuing-banks/new');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-xl space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Bank Successfully Provisioned</h1>
                <p className="text-muted-foreground">
                  Your issuing bank has been set up and is now active
                </p>
              </div>

              {/* Bank Details Card */}
              <div className="kardit-card p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground text-lg">{session.bankDetails.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {session.bankDetails.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="font-semibold text-foreground">{session.bankDetails.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Active
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Contact Email</p>
                    <p className="text-sm text-foreground">{session.bankDetails.contactEmail}</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="kardit-card p-6 bg-blue-50/50 border border-blue-200 text-left">
                <p className="font-semibold text-blue-900 mb-3">What's next?</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Your bank is now ready to onboard affiliates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>You can start onboarding affiliates who want to issue cards with this bank</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>View your bank profile to see integration details and manage settings</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 flex flex-col">
                <Button
                  onClick={handleViewProfile}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  View Bank Profile
                </Button>
                <Button
                  onClick={handleAddAnother}
                  variant="outline"
                  className="w-full"
                >
                  Add Another Bank
                </Button>
                <Button
                  onClick={handleReturnToDashboard}
                  variant="ghost"
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
