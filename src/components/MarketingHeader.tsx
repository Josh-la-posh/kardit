import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { Switch } from '@/components/ui/switch'

interface MarketingHeaderProps {
  authUrl?: string
  enrollmentUrl?: string
  showStartEnrollment?: boolean
  rightSlot?: ReactNode
  pathLabel?: string
  showAffiliatePortal?: boolean
  showThemeToggle?: boolean
}

export default function MarketingHeader({
  authUrl = '/login',
  enrollmentUrl = '/onboarding/start',
  showStartEnrollment = true,
  rightSlot,
  pathLabel,
  showAffiliatePortal = false,
  showThemeToggle = true,
}: MarketingHeaderProps) {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const isEnrollmentRoute = pathname.startsWith('/onboarding')
  const shouldShowEnrollment = showStartEnrollment && !isEnrollmentRoute
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

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
          {(showAffiliatePortal || pathLabel) && (
            <div className="hidden items-center gap-2 text-[13px] text-[var(--cs-ink-200)] md:flex">
              <span>Affiliate Portal</span>
              {pathLabel && (
                <>
                  <span>/</span>
                  <strong className="font-semibold text-[var(--cs-ink-700)]">{pathLabel}</strong>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-5">
          {rightSlot ?? (
            showThemeToggle ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel)/0.72)] px-3 py-2 shadow-[0_10px_24px_hsl(var(--landing-fg)/0.1)] backdrop-blur">
                <Sun className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label="Toggle dark mode"
                />
                <Moon className="h-3.5 w-3.5 text-[hsl(var(--landing-subtle))]" />
              </div>
            ) : null
          )}
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
