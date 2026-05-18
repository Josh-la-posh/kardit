import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface MarketingHeaderProps {
  authUrl?: string
  enrollmentUrl?: string
  showStartEnrollment?: boolean
  rightSlot?: ReactNode
  pathLabel?: string
}

export default function MarketingHeader({
  authUrl = '/login',
  enrollmentUrl = '/onboarding/start',
  showStartEnrollment = true,
  rightSlot,
  pathLabel,
}: MarketingHeaderProps) {
  const { pathname } = useLocation()
  const isEnrollmentRoute = pathname.startsWith('/onboarding')
  const shouldShowEnrollment = showStartEnrollment && !isEnrollmentRoute

  return (
    <header
      className="sticky top-0 z-20 border-b border-[var(--cs-border)] bg-[color-mix(in_srgb,var(--cs-bg-elevated)_92%,transparent)] backdrop-blur"
      role="banner"
    >
      <div className="mx-auto flex h-[76px] w-[min(1440px,calc(100%-48px))] items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            className="text-[28px] font-extrabold leading-none text-[var(--cs-green-900)] no-underline"
            href="/"
            aria-label="Kardit home"
          >
            <span>
              Kard<span className="text-[var(--cs-green-700)]">i</span>t
            </span>
          </a>
          {pathLabel && (
            <div className="hidden items-center gap-2 text-[13px] text-[var(--cs-ink-200)] md:flex">
              <span>Affiliate Portal</span>
              <span>/</span>
              <strong className="font-semibold text-[var(--cs-ink-700)]">{pathLabel}</strong>
            </div>
          )}
        </div>
        <div className="flex items-center gap-5">
          {rightSlot}
          <a className="font-semibold text-[var(--cs-ink-900)] hover:text-primary no-underline" href={authUrl}>
            Sign in
          </a>
          {shouldShowEnrollment && (
            <a
              className="rounded-xl border border-transparent bg-[var(--cs-red-700)] px-5 py-3 text-sm font-bold text-[var(--cs-white)] no-underline transition-all hover:bg-[var(--cs-red-900)]"
              href={enrollmentUrl}
            >
              Start enrollment
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
