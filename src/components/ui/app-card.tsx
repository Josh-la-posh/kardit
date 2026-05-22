import * as React from 'react'
import { cn } from '@/lib/utils'

type AppCardProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article'
  padded?: 'none' | 'md' | 'lg'
}

export function AppCard({
  as = 'section',
  padded = 'none',
  className,
  ...props
}: AppCardProps) {
  const Comp = as
  const padCls = padded === 'lg' ? 'app-card--pad-lg' : padded === 'md' ? 'app-card--pad-md' : ''
  return <Comp className={cn('app-card', padCls, className)} {...props} />
}

export function AppCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('app-card__head', className)} {...props} />
}

export function AppCardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('app-card__title', className)} {...props} />
}

export function AppCardSub({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('app-card__sub', className)} {...props} />
}

export function AppCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('app-card__content', className)} {...props} />
}
