import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useIssuingBankSession, useProvisioningProgress } from '@/hooks/useIssuingBank';
import { Loader2 } from 'lucide-react';

export default function IssuingBankProvisioningPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session } = useIssuingBankSession(sessionId);
  const { progress, status, isComplete, isFailed, errorMessage } = useProvisioningProgress(sessionId);

  // Navigate to appropriate outcome page when processing completes
  useEffect(() => {
    if (isComplete && sessionId) {
      const timer = setTimeout(() => {
        navigate(`/issuing-banks/${sessionId}/success`);
      }, 1500); // Brief pause to show completion before redirect
      return () => clearTimeout(timer);
    }
  }, [isComplete, sessionId, navigate]);

  useEffect(() => {
    if (isFailed && sessionId) {
      const timer = setTimeout(() => {
        navigate(`/issuing-banks/${sessionId}/failure`);
      }, 2000); // Give user time to see error before redirect
      return () => clearTimeout(timer);
    }
  }, [isFailed, sessionId, navigate]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md">
              {/* Loading/Processing Container */}
              {!isComplete && !isFailed && (
                <div className="text-center space-y-8">
                  {/* Spinner */}
                  <div className="flex justify-center">
                    <div className="relative w-20 h-20">
                      <Loader2 className="w-full h-full animate-spin text-blue-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Provisioning Bank</h1>
                    <p className="text-muted-foreground">
                      {session?.bankDetails.name || 'Your bank'} is being set up
                    </p>
                  </div>

                  {/* Current Status */}
                  <div className="kardit-card p-6 bg-blue-50/50 border border-blue-200">
                    <p className="font-semibold text-blue-900">{status}</p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps Indicator */}
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress >= 25 ? 'bg-green-500' : 'bg-muted'}`} />
                      <span>Validating Bank Information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress >= 50 ? 'bg-green-500' : 'bg-muted'}`} />
                      <span>Setting Up Bank Account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress >= 75 ? 'bg-green-500' : 'bg-muted'}`} />
                      <span>Configuring Integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-muted'}`} />
                      <span>Finalizing Setup</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State (brief transition) */}
              {isComplete && !isFailed && (
                <div className="text-center space-y-6 animate-fade-in">
                  <div className="text-green-600 text-5xl">✓</div>
                  <h1 className="text-2xl font-bold text-foreground">Setup Complete!</h1>
                  <p className="text-muted-foreground">Redirecting to confirmation...</p>
                </div>
              )}

              {/* Error State (brief transition) */}
              {isFailed && (
                <div className="text-center space-y-6 animate-fade-in">
                  <div className="text-red-600 text-5xl">⚠</div>
                  <h1 className="text-2xl font-bold text-foreground">Provisioning Failed</h1>
                  <div className="kardit-card p-4 bg-red-50/50 border border-red-200">
                    <p className="text-sm text-red-900">{errorMessage || 'An error occurred during provisioning'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Redirecting to error details...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
