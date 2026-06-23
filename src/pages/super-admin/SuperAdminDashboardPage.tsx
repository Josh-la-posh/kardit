import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Banknote,
  Building2,
  ClipboardCheck,
  Receipt,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { AppCard, AppCardSub, AppCardTitle } from '@/components/ui/app-card'

const modules: Array<{ label: string; icon: LucideIcon; path: string; description: string }> = [
  {
    label: 'Banks',
    icon: Building2,
    path: '/super-admin/banks',
    description: 'Manage platform banks and their configurations.',
  },
  {
    label: 'Onboarding Cases',
    icon: ClipboardCheck,
    path: '/super-admin/onboarding/cases',
    description: 'Review affiliate onboarding submissions and outcomes.',
  },
  {
    label: 'Transactions',
    icon: Receipt,
    path: '/transactions',
    description: 'Search, inspect, and trace card transaction activity.',
  },
  {
    label: 'Audit logs',
    icon: Banknote,
    path: '/audit-logs',
    description: 'Track platform events for operational and security audit.',
  },
]

export default function SuperAdminDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}</h1>
                <p className="page-sub">{user?.tenantName || 'Service Provider Dashboard'}</p>
              </div>
            </header>

            <div className="action-grid">
              {modules.map((module) => (
                <button
                  key={module.path}
                  type="button"
                  onClick={() => navigate(module.path)}
                  className="action-card"
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <module.icon />
                  </div>
                  <div className="action-title">{module.label}</div>
                  <div className="action-meta">{module.description}</div>
                  <div className="action-cta">
                    Open <ArrowRight />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
