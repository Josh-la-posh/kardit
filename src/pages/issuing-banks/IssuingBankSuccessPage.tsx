import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useIssuingBankSession } from '@/hooks/useIssuingBank';
import { AlertCircle, Building2, Check } from 'lucide-react';

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
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
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
          <div className="py-20 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <p className="mb-6 text-red-600">Bank details not found</p>
            <Button variant="outline" onClick={() => navigate('/super-admin/banks')}>
              Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-xl space-y-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-green-100 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-12 w-12 text-green-600" />
                  </div>
                </div>
              </div>

              <div>
                <h1 className="mb-2 text-3xl font-bold text-foreground">Bank Successfully Provisioned</h1>
                <p className="text-muted-foreground">Your issuing bank has been set up and is now active</p>
              </div>

              <div className="kardit-card space-y-4 p-6">
                <div className="flex items-start gap-4 border-b border-border pb-4">
                  <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-lg font-semibold text-foreground">{session.bankDetails.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {session.bankDetails.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                  {session.bankId && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Bank ID</p>
                      <p className="font-semibold text-foreground">{session.bankId}</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Country</p>
                    <p className="font-semibold text-foreground">{session.bankDetails.country}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Status</p>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Contact Email</p>
                    <p className="text-sm text-foreground">{session.bankDetails.contactEmail}</p>
                  </div>
                </div>
              </div>

              {session.internalAffiliate && (
                <div className="kardit-card p-6 text-left">
                  <p className="mb-3 font-semibold text-foreground">Internal Affiliate Created</p>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Affiliate ID</p>
                      <p className="font-semibold text-foreground">{session.internalAffiliate.affiliateId}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Affiliate Type</p>
                      <p className="font-semibold text-foreground">{session.internalAffiliate.affiliateType}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Owner Bank ID</p>
                      <p className="font-semibold text-foreground">{session.internalAffiliate.ownerBankId}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">System Managed</p>
                      <p className="font-semibold text-foreground">{session.internalAffiliate.isSystemManaged ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Affiliate Status</p>
                      <p className="font-semibold text-foreground">{session.internalAffiliate.status}</p>
                    </div>
                    {session.internalPartnership && (
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Partnership Request</p>
                        <p className="font-semibold text-foreground">{session.internalPartnership.partnershipRequestId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="kardit-card border border-blue-200 bg-blue-50/50 p-6 text-left">
                <p className="mb-3 font-semibold text-blue-900">What's next?</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>Your bank is now ready to onboard external affiliates.</li>
                  <li>The internal bank-owned affiliate is created automatically during provisioning.</li>
                  <li>View your bank profile to see integration details and manage settings.</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-3">
                <Button onClick={() => navigate('/issuing-banks')} className="w-full bg-blue-600 hover:bg-blue-700">
                  View Bank Profile
                </Button>
                <Button onClick={() => navigate('/issuing-banks/new')} variant="outline" className="w-full">
                  Add Another Bank
                </Button>
                <Button onClick={() => navigate('/issuing-banks')} variant="ghost" className="w-full">
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
