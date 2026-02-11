import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check, Clock, X, AlertTriangle, Ban, Loader2 } from "lucide-react";

/**
 * StatusChip - Displays status with appropriate color and icon
 * 
 * Usage:
 * <StatusChip status="ACTIVE" />
 * <StatusChip status="PENDING" />
 * <StatusChip status="REJECTED" />
 */

const statusChipVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        ACTIVE: "bg-success/15 text-success border border-success/20",
        PENDING: "bg-warning/15 text-warning border border-warning/20",
        REJECTED: "bg-destructive/15 text-destructive border border-destructive/20",
        FROZEN: "bg-info/15 text-info border border-info/20",
        BLOCKED: "bg-destructive/15 text-destructive border border-destructive/20",
        FAILED: "bg-destructive/15 text-destructive border border-destructive/20",
        INACTIVE: "bg-muted text-muted-foreground border border-border",
        PROCESSING: "bg-primary/15 text-primary border border-primary/20",
        SUCCESS: "bg-success/15 text-success border border-success/20",
        WARNING: "bg-warning/15 text-warning border border-warning/20",
        ERROR: "bg-destructive/15 text-destructive border border-destructive/20",
        INFO: "bg-info/15 text-info border border-info/20",
        INVITED: "bg-info/15 text-info border border-info/20",
        DISABLED: "bg-muted text-muted-foreground border border-border",
        UPLOADED: "bg-primary/15 text-primary border border-primary/20",
        VERIFIED: "bg-success/15 text-success border border-success/20",
        LOCKED: "bg-warning/15 text-warning border border-warning/20",
        COMPLETED: "bg-success/15 text-success border border-success/20",
        VALIDATING: "bg-primary/15 text-primary border border-primary/20",
        VALIDATED: "bg-success/15 text-success border border-success/20",
        POSTED: "bg-success/15 text-success border border-success/20",
        DECLINED: "bg-destructive/15 text-destructive border border-destructive/20",
        QUEUED: "bg-warning/15 text-warning border border-warning/20",
        RUNNING: "bg-primary/15 text-primary border border-primary/20",
        IDLE: "bg-muted text-muted-foreground border border-border",
        VALID: "bg-success/15 text-success border border-success/20",
        INVALID: "bg-destructive/15 text-destructive border border-destructive/20",
        PROCESSED: "bg-success/15 text-success border border-success/20",
      },
    },
    defaultVariants: {
      status: "ACTIVE",
    },
  }
);

const statusIcons = {
  ACTIVE: Check,
  PENDING: Clock,
  REJECTED: X,
  FROZEN: AlertTriangle,
  BLOCKED: Ban,
  FAILED: X,
  INACTIVE: Clock,
  PROCESSING: Loader2,
  SUCCESS: Check,
  WARNING: AlertTriangle,
  ERROR: X,
  INFO: AlertTriangle,
  INVITED: Clock,
  DISABLED: Ban,
  UPLOADED: Clock,
  VERIFIED: Check,
  LOCKED: Ban,
  COMPLETED: Check,
  VALIDATING: Loader2,
  VALIDATED: Check,
  POSTED: Check,
  DECLINED: X,
  QUEUED: Clock,
  RUNNING: Loader2,
  IDLE: Clock,
  VALID: Check,
  INVALID: X,
  PROCESSED: Check,
} as const;

export type StatusType = keyof typeof statusIcons;

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusChipVariants> {
  status: StatusType;
  showIcon?: boolean;
  label?: string;
}

const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  ({ className, status, showIcon = true, label, ...props }, ref) => {
    const Icon = statusIcons[status];
    const displayLabel = label || status.charAt(0) + status.slice(1).toLowerCase();
    
    return (
      <span
        ref={ref}
        className={cn(statusChipVariants({ status }), className)}
        {...props}
      >
        {showIcon && (
          <Icon 
            className={cn(
              "h-3 w-3",
              status === "PROCESSING" && "animate-spin"
            )} 
          />
        )}
        <span>{displayLabel}</span>
      </span>
    );
  }
);
StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };
