import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function OnboardingSuccessPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex justify-center mb-6">
          <KarditLogo size="lg" />
        </div>

        <div className="kardit-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Submission received</h1>
          <p className="text-sm text-muted-foreground mb-6">Your onboarding case has been submitted for review.</p>

          {caseId && (
            <div className="rounded-md border border-border bg-muted p-3 mb-6 text-left">
              <p className="text-xs text-muted-foreground">Case ID</p>
              <p className="text-sm font-medium break-all">{caseId}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button className="w-full" onClick={() => caseId && navigate(`/onboarding/status/${caseId}`)} disabled={!caseId}>
              Track status
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
