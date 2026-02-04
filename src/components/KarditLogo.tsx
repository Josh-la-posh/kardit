import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Kardit Logo Component
 * Displays the Kardit brand logo with optional text
 */

interface KarditLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 'h-6 w-6', text: 'text-lg' },
  md: { icon: 'h-8 w-8', text: 'text-xl' },
  lg: { icon: 'h-10 w-10', text: 'text-2xl' },
};

export function KarditLogo({ className, showText = true, size = 'md' }: KarditLogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Stylized K with card motif */}
      <div className={cn('relative', icon)}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Card background */}
          <rect
            x="2"
            y="6"
            width="36"
            height="28"
            rx="4"
            className="fill-primary"
          />
          {/* K letter stylized */}
          <path
            d="M12 12V28M12 20L24 12M12 20L24 28"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
          {/* Chip element */}
          <rect
            x="26"
            y="14"
            width="6"
            height="4"
            rx="1"
            className="fill-primary-foreground/80"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={cn('font-semibold tracking-tight text-foreground', text)}>
          Kardit
        </span>
      )}
    </div>
  );
}
