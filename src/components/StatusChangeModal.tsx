import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import type { UserStatus } from '@/stores/mockStore';

const STATUS_OPTIONS: { value: UserStatus; label: string; impact: string }[] = [
  { value: 'ACTIVE', label: 'Active', impact: 'User can sign in and use the system normally.' },
  { value: 'INVITED', label: 'Invited', impact: 'User has been invited but has not yet signed in.' },
  { value: 'LOCKED', label: 'Locked', impact: 'User cannot sign in. Useful for temporary suspension.' },
  { value: 'DISABLED', label: 'Disabled', impact: 'User is permanently deactivated.' },
];

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  currentStatus: UserStatus;
  onConfirm: (newStatus: string) => void;
}

export function StatusChangeModal({ open, onClose, currentStatus, onConfirm }: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<string>(currentStatus);
  const selected = STATUS_OPTIONS.find((s) => s.value === newStatus);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Status</DialogTitle>
          <DialogDescription>
            Current status: <StatusChip status={currentStatus as StatusType} className="ml-1" />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="bg-muted border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected && (
            <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              {selected.impact}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(newStatus)} disabled={newStatus === currentStatus}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
