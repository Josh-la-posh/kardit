import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

/**
 * ForgotPasswordPage - SCR-AUTH-003
 * 
 * Routes: /forgot-password
 * Sends a generic success message regardless of whether the account exists
 */

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsLoading(true);

    try {
      await requestPasswordReset({
        username: email,
        channel: 'EMAIL',
      });
    } catch {
      // Intentionally swallow errors: UI should not disclose account existence.
    }

    setIsLoading(false);
    setIsSubmitted(true);
  };

  // Success view
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-center mb-8">
            <KarditLogo size="lg" />
          </div>

          <div className="kardit-card p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground mb-6">
              If an account exists for <span className="text-foreground">{email}</span>, 
              we've sent a password reset link.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <KarditLogo size="lg" />
        </div>

        {/* Form Card */}
        <div className="kardit-card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Forgot password?
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Email / Username"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-secondary hover:text-secondary/80 hover:underline transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
