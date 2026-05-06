import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useCreateOnboardingSession } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function OnboardingStartPage() {
  const navigate = useNavigate();
  const { create, isLoading, error } = useCreateOnboardingSession();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !phone) {
      setLocalError('Email and phone are required');
      return;
    }
    if (!consentAccepted) {
      setLocalError('You must accept consent to continue');
      return;
    }
    try {
      const res = await create({ channel: 'web', email, phone, consentAccepted });
      navigate(`/onboarding/${res.draftId}/organization`);
    } catch (err: any) {
      setLocalError((err as Error)?.message || 'Failed to start onboarding');
    }
  };

  return (
    <PublicOnboardingLayout
      currentStep="start"
      title="Affiliate onboarding"
      description="Start your KYB onboarding by sharing your work contact details and confirming you're authorized to submit this information."
    >
      <div className="mx-auto w-full max-w-lg animate-fade-in">
        

        <div className=" p-8">

          {(localError || error) && (
            <div className="mb-5 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={onStart}>
            <TextField
              label="Work Email"
              type="email"
              placeholder="ops@acmefinance.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              label="Phone"
              type="tel"
              placeholder="+2348012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                disabled={isLoading}
              />
              <span>I confirm I&apos;m authorized to submit onboarding information.</span>
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start onboarding'
              )}
            </Button>
          </form>
        </div>
      </div>
    </PublicOnboardingLayout>
  );
}
