import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * SessionExpiredDialog - Modal shown when user session expires
 * 
 * Usage:
 * <SessionExpiredDialog />
 * 
 * Triggered by calling forceSessionExpired() from useAuth()
 */

export function SessionExpiredDialog() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  const handleGoToSignIn = () => {
    dismissSessionExpired();
    navigate('/login');
  };

  return (
    <Dialog open={sessionExpired} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-xl">Session Expired</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your session has expired due to inactivity. Please sign in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:justify-center">
          <Button onClick={handleGoToSignIn} className="w-full sm:w-auto">
            Go to Sign-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
