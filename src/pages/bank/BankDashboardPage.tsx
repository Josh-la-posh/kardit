import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Receipt,
  History,
  FileText,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getServiceByTenantId } from '@/services/affiliateApi'
import { getAuthProfile } from '@/services/authSession'

const modules: Array<{ label: string; icon: LucideIcon; path: string; description: string }> = [
  {
    label: 'Affiliates',
    icon: Building2,
    path: '/bank/affiliates',
    description: 'View active affiliate partners and open each relationship in detail.',
  },
  {
    label: 'Partnership Requests',
    icon: ClipboardList,
    path: '/bank/affiliate-partnership-requests',
    description: 'Review pending affiliate partnership requests and respond quickly.',
  },
  {
    label: 'Customers',
    icon: Users,
    path: '/bank/customers',
    description: 'Browse customers visible within your bank scope and inspect their records.',
  },
  {
    label: 'Transactions',
    icon: Receipt,
    path: '/transactions',
    description: 'Search transaction activity and trace payment events end to end.',
  },
  {
    label: 'Audit Logs',
    icon: History,
    path: '/bank/audit-logs',
    description: 'Track operational events and user actions across the bank portal.',
  },
  {
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    description: 'Open reporting tools for exports, summaries, and operational analysis.',
  },
]

export default function BankDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFetchingTenantService, setIsFetchingTenantService] = useState(false)

  useEffect(() => {
    const tenantProfileResponse = getAuthProfile()
  }, [])

  const handleFetchTenantService = async () => {
    if (!user?.tenantId) {
      toast.error('Tenant ID is unavailable.')
      return
    }

    setIsFetchingTenantService(true)
    try {
      await getServiceByTenantId(user.tenantId)
      toast.success('Tenant service response logged to the console.')
    } catch (error) {
      console.error('getServiceByTenantId failed:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to fetch tenant service')
    } finally {
      setIsFetchingTenantService(false)
    }
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Bank User'}</h1>
                <p className="page-sub">{user?.tenantName || 'Bank Portal'}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchTenantService}
                disabled={isFetchingTenantService || !user?.tenantId}
              >
                {isFetchingTenantService
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {isFetchingTenantService ? 'Fetching...' : 'Fetch tenant service'}
              </Button>
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
