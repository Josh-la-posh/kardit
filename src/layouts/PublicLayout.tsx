import { Outlet, useLocation } from 'react-router-dom'
import MarketingHeader from '@/components/MarketingHeader'
import Footer from '@/pages/LandingPage/components/Footer'
import { useSiteEffects } from '../lib/useSiteEffects';

type HeaderConfig = {
  pathLabel?: string
  showAffiliatePortal?: boolean
  showStartEnrollment?: boolean
}

const ONBOARDING_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: '/onboarding/start', label: 'Start Enrollment' },
  { prefix: '/onboarding/organization', label: 'Organization' },
  { prefix: '/onboarding/documents', label: 'Documents' },
  { prefix: '/onboarding/issuing-banks', label: 'Issuing Banks' },
  { prefix: '/onboarding/review', label: 'Review' },
  { prefix: '/onboarding/success', label: 'Success' },
  { prefix: '/onboarding/status', label: 'Application Status' },
  { prefix: '/onboarding/notifications', label: 'Notifications' },
]

function resolveOnboardingLabel(pathname: string): string | undefined {
  const direct = ONBOARDING_LABELS.find((item) => pathname.startsWith(item.prefix))
  if (direct) return direct.label

  if (/^\/onboarding\/[^/]+\/organization/.test(pathname)) return 'Organization'
  if (/^\/onboarding\/[^/]+\/documents/.test(pathname)) return 'Documents'
  if (/^\/onboarding\/[^/]+\/issuing-banks/.test(pathname)) return 'Issuing Banks'
  if (/^\/onboarding\/[^/]+\/review/.test(pathname)) return 'Review'

  return undefined
}

function resolveHeaderConfig(pathname: string): HeaderConfig {
  if (pathname === '/login') {
    return { pathLabel: 'Sign In', showStartEnrollment: true }
  }

  if (pathname === '/forgot-password') {
    return { pathLabel: 'Forgot Password', showStartEnrollment: false }
  }

  if (pathname === '/reset-password') {
    return { pathLabel: 'Reset Password', showStartEnrollment: false }
  }

  if (pathname === '/change-password') {
    return { pathLabel: 'Change Password', showStartEnrollment: false }
  }

  if (pathname.startsWith('/onboarding')) {
    return {
      showAffiliatePortal: true,
      pathLabel: resolveOnboardingLabel(pathname) || 'Enrollment',
      showStartEnrollment: false,
    }
  }

  return {
    showAffiliatePortal: false,
    pathLabel: undefined,
    showStartEnrollment: true,
  }
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  const headerConfig = resolveHeaderConfig(pathname)

  const rawAppBaseUrl = ((import.meta as any).env?.VITE_APP_BASE_URL as string | undefined)?.trim() || ''
  const appBaseUrl = rawAppBaseUrl
    ? (/^https?:\/\//i.test(rawAppBaseUrl) ? rawAppBaseUrl : `http://${rawAppBaseUrl}`).replace(/\/$/, '')
    : ''
  const authUrl = appBaseUrl ? `${appBaseUrl}/login` : '/login'
  const enrollmentUrl = appBaseUrl ? `${appBaseUrl}/onboarding/start` : '/onboarding/start'

  useSiteEffects()

  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-fg)]">
      <MarketingHeader
        authUrl={authUrl}
        enrollmentUrl={enrollmentUrl}
        showAffiliatePortal={headerConfig.showAffiliatePortal}
        showStartEnrollment={headerConfig.showStartEnrollment}
        pathLabel={headerConfig.pathLabel}
      />

      <Outlet />

      <Footer />
    </div>
  )
}
