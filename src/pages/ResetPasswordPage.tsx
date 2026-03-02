import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * ResetPasswordPage - SCR-AUTH-004
 * 
 * Routes: /reset-password?token=xxx
 * Validates token and allows password reset
 */

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invalid/expired token
  const isTokenInvalid = !token || token === 'expired';

  const validatePassword = () => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        resetRequestId: token || '',
        otp: '123456',
        newPassword: password,
      });
      setIsSuccess(true);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token view
  if (isTokenInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-center mb-8">
            <KarditLogo size="lg" />
          </div>

          <div className="kardit-card p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Invalid or Expired Link
            </h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. 
              Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">
                Request New Link
              </Button>
            </Link>
            <div className="mt-4">
              <Link 
                to="/login" 
                className="text-sm text-secondary hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (isSuccess) {
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
              Password Reset Successful
            </h1>
            <p className="text-muted-foreground mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link to="/login">
              <Button className="w-full">
                Go to Sign In
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
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Must be at least 8 characters"
              disabled={isLoading}
            />

            <TextField
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
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
