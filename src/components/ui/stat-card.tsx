import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * StatCard - Dashboard summary widget card
 * 
 * Usage:
 * <StatCard
 *   title="Total Customers"
 *   value="1,234"
 *   caption="12 new today"
 *   icon={Users}
 *   trend={{ value: 12, isPositive: true }}
 * />
 */

interface StatCardProps {
  title: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  accentValue?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, caption, icon: Icon, trend, className, accentValue = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "kardit-card p-5 transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-semibold tracking-tight",
                accentValue ? "text-primary" : "text-foreground"
              )}
            >
              {value}
            </p>
          </div>
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        
        {(caption || trend) && (
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {caption && (
              <span className="text-xs text-muted-foreground">
                {caption}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
