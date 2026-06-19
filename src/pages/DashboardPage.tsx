import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserPlus,
  UploadCloud,
  Search,
  CreditCard,
  Wallet,
  BarChart3,
  Building2,
  ArrowRight,
  RefreshCw,
  Loader2,
  Snowflake,
  CheckCheck,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { getAffiliateProfileByTenant, getRouteForAffiliateType } from '@/services/affiliateApi'
import { saveAuthProfile } from '@/services/authSession'
import './DashboardPage.css'

type Range = 'today' | 'week' | 'month' | 'custom'

const KPI_DATA: Record<
  Range,
  {
    issued: string
    added: string
    active: string
    frozen: string
    terminated: string
    funding: string
    trend: string
    unload: string
    txnvol: string
    txncount: string
    pending: string
    failed: string
  }
> = {
  today: {
    issued: '1,247',
    added: '+18',
    active: '1,089',
    frozen: '38',
    terminated: '120',
    funding: 'NGN 18.4M',
    trend: 'up 12%',
    unload: 'NGN 2.1M',
    txnvol: 'NGN 47.8M',
    txncount: '2,341',
    pending: '12',
    failed: '7',
  },
  week: {
    issued: '1,247',
    added: '+92',
    active: '1,089',
    frozen: '38',
    terminated: '120',
    funding: 'NGN 94.2M',
    trend: 'up 8%',
    unload: 'NGN 12.4M',
    txnvol: 'NGN 284.6M',
    txncount: '14,820',
    pending: '29',
    failed: '31',
  },
  month: {
    issued: '1,247',
    added: '+341',
    active: '1,089',
    frozen: '38',
    terminated: '120',
    funding: 'NGN 382.7M',
    trend: 'up 21%',
    unload: 'NGN 44.1M',
    txnvol: 'NGN 1.2B',
    txncount: '58,991',
    pending: '47',
    failed: '104',
  },
  custom: {
    issued: '1,247',
    added: '+128',
    active: '1,089',
    frozen: '38',
    terminated: '120',
    funding: 'NGN 142.0M',
    trend: 'up 15%',
    unload: 'NGN 18.8M',
    txnvol: 'NGN 465.2M',
    txncount: '22,408',
    pending: '33',
    failed: '49',
  },
}

export default function DashboardPage() {
  const [range, setRange] = useState<Range>('today')
  const [refreshing, setRefreshing] = useState(false)
  const [tenantProfileResponse, setTenantProfileResponse] = useState<unknown>(null)
  const [tenantProfileError, setTenantProfileError] = useState<string | null>(null)
  const [tenantProfileLoading, setTenantProfileLoading] = useState(false)
  const d = useMemo(() => KPI_DATA[range], [range])
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const tenantId = user?.tenantId
    if (!tenantId) return

    let cancelled = false
    setTenantProfileLoading(true)
    setTenantProfileError(null)

    getAffiliateProfileByTenant(tenantId)
      .then((response) => {
        if (cancelled) return
        console.info('Affiliate profile by tenant response:', response)
        saveAuthProfile(response)
        setTenantProfileResponse(response)
        const route = getRouteForAffiliateType((response as { affiliateType?: unknown }).affiliateType)
        if (route !== '/dashboard') navigate(route, { replace: true })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Affiliate profile by tenant failed:', error)
        setTenantProfileError(error instanceof Error ? error.message : 'Unable to fetch tenant profile')
      })
      .finally(() => {
        if (!cancelled) setTenantProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate, user?.tenantId])

  useEffect(() => {
    const stakeholderType = user?.stakeholderType
    if (stakeholderType === 'BANK') {
      navigate('/bank/dashboard', { replace: true })
    }
    if (stakeholderType === 'SERVICE_PROVIDER') {
      navigate('/super-admin/dashboard', { replace: true })
    }
  }, [navigate, user?.stakeholderType])

  function onRangeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as Range
    if (v === 'custom') {
      const dr = window.prompt('Custom range (yyyy-mm-dd to yyyy-mm-dd):', '2026-04-01 to 2026-04-30')
      if (!dr) {
        setRange('today')
        return
      }
    }
    setRange(v)
  }

  function onRefresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="home-hello">Good afternoon, {user?.name?.split(' ')[0] || 'User'}</h1>
                <p className="home-org">
                  Signed in as {user?.role || 'Affiliate'} · <strong>{user?.tenantName || 'Tenant'}</strong>
                </p>
              </div>
            </header>

            <section>
              <div className="section-head">
                <div>
                  <div className="section-title">Tenant profile response</div>
                  <div className="section-sub">
                    GET /api/v1/affiliates/{user?.tenantId || 'tenantId'}/profilebytenant
                  </div>
                </div>
              </div>
              <pre
                style={{
                  maxHeight: 360,
                  overflow: 'auto',
                  border: '1px solid var(--cs-border)',
                  borderRadius: 8,
                  background: 'var(--cs-bg-elevated)',
                  padding: 16,
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {tenantProfileLoading
                  ? 'Loading tenant profile...'
                  : tenantProfileError
                    ? tenantProfileError
                    : JSON.stringify(tenantProfileResponse, null, 2)}
              </pre>
            </section>

            {/* <section>
              <div className="section-head">
                <div>
                  <div className="section-title">Today at a glance</div>
                  <div className="section-sub">Tenant scope · {user?.tenantName || 'Current tenant'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={range}
                    onChange={onRangeChange}
                    className="dashboard-control"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="custom">Custom range...</option>
                  </select>
                  <button
                    onClick={onRefresh}
                    aria-label="Refresh KPIs"
                    className="dashboard-control dashboard-control--button"
                  >
                    {refreshing ? (
                      <Loader2 style={{ width: 13, height: 13 }} className="spin" />
                    ) : (
                      <RefreshCw style={{ width: 13, height: 13 }} />
                    )}{' '}
                    {refreshing ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="kpi-stub">
                <Kpi
                  label="Cards issued"
                  value={d.issued}
                  sub={
                    <>
                      <span className="kpi-emphasis">{d.added}</span> in selected range
                    </>
                  }
                />
                <Kpi label="Active" value={d.active} sub="87.3% of issued" />
                <Kpi label="Frozen" value={d.frozen} valueStyle={{ color: 'var(--dash-info-text)' }} sub="3.0% of issued" />
                <Kpi label="Terminated" value={d.terminated} valueStyle={{ color: 'var(--cs-fg-muted)' }} sub="retired this year" />
              </div>

              <div className="kpi-stub" style={{ marginTop: 14 }}>
                <Kpi
                  label="Funding volume"
                  value={d.funding}
                  sub={
                    <>
                      <span className="kpi-emphasis">{d.trend}</span> vs prev range
                    </>
                  }
                />
                <Kpi label="Unload volume" value={d.unload} sub="14 unload txns" />
                <Kpi label="Txn volume" value={d.txnvol} sub="spend across all cards" />
                <Kpi label="Txn count" value={d.txncount} sub="authorisations" />
              </div>

              <div className="kpi-stub" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr' }}>
                <Kpi label="Pending maker-checker" value={d.pending} sub="4 batches · 8 single loads · awaiting checker" />
                <Kpi
                  label="Failed transactions"
                  value={d.failed}
                  valueStyle={{ color: 'var(--cs-red-700)' }}
                  sub="3 CMS timeouts · 4 insufficient funds"
                />
              </div>
            </section> */}

            <section>
              <div className="section-head">
                <div>
                  <div className="section-title">Get started</div>
                  <div className="section-sub">Available journeys in this build</div>
                </div>
              </div>

              <div className="action-grid">
                <ActionCard
                  to="/customers/create"
                  icon={<UserPlus />}
                  title="New customer"
                  meta="Capture a customer record (identity, contact, address, KYC) and save it as a draft. Issue a card now or come back later."
                />
                <ActionCard
                  to="/batch-operations"
                  icon={<UploadCloud />}
                  title="Batch issuance"
                  meta="Upload many customers in one CSV. Validate, submit, get approved by a checker, then process to CMS."
                />
                <ActionCard
                  to="/customers"
                  icon={<Search />}
                  title="Find a customer"
                  meta="Search captured customers by name, phone, customer ref, BVN, or NIN. View profile, KYC details, and linked cards."
                />
                <ActionCard
                  to="/cards/create"
                  icon={<CreditCard />}
                  title="Issue a card"
                  meta="Create customer and issue a virtual or physical card in one flow. Auto-provisions a linked virtual account for funding."
                />
                <ActionCard
                  to="/loads/single"
                  icon={<Wallet />}
                  title="Load funds"
                  meta="Top up a card's linked virtual account. Maker-checker workflow - you submit, a different user approves before CMS fires."
                />
                <ActionCard
                  to="/reports"
                  icon={<BarChart3 />}
                  title="Reports"
                  cta="Open"
                  meta="Generate operational reports (daily activity, card issuance, funding volume, audit log). Download as CSV or PDF."
                />
                <ActionCard
                  to="/bank/dashboard"
                  tag="Bank role"
                  icon={<Building2 />}
                  title="View as Issuing Bank"
                  cta="Switch role"
                  dashed
                  meta="Demo: switch persona to a Bank user (Chioma N. at Zenith Bank). See the portfolio view across affiliates under your bank."
                />
              </div>
            </section>

            <section>
              <div className="section-head">
                <div>
                  <div className="section-title">Recent activity</div>
                  <div className="section-sub">Latest actions on this tenant</div>
                </div>
              </div>
              <div className="recent">
                <RecentRow
                  icon={<CreditCard />}
                  tone="green"
                  to="/cards"
                  title="Card issued · CARD-2026-VRP01029 · Tunde Bakare"
                  meta="Zenith Bank · Verve Prepaid Standard · by Adaeze O."
                  time="12 min ago"
                />
                <RecentRow
                  icon={<UserPlus />}
                  tone="amber"
                  to="/customers"
                  title="Customer captured · Adaeze Okafor"
                  meta="DRAFT · CUST-2026-00345 · awaiting card issuance"
                  time="38 min ago"
                />
                <RecentRow
                  icon={<Wallet />}
                  tone="blue"
                  to="/loads"
                  title="Funds loaded · NGN 50,000.00 · Chiamaka Eze"
                  meta="Approved by Folake A. · CMS confirmed · CARD-2026-VRP01028"
                  time="2 hr ago"
                />
                <RecentRow
                  icon={<CheckCheck />}
                  tone="green"
                  to="/batch-operations"
                  title="Batch BATCH-2026-00018 completed · 47 customers · 47 cards"
                  meta="Approved by Folake A. · 0 errors · 4 min processing"
                  time="Yesterday"
                />
                <RecentRow
                  icon={<Snowflake />}
                  tone="blue"
                  to="/cards"
                  title="Card frozen · CARD-2026-VRP00984"
                  meta="Reason: Customer request · by Adaeze O."
                  time="Yesterday"
                />
              </div>
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function Kpi({
  label,
  value,
  sub,
  valueStyle,
}: {
  label: string
  value: string
  sub: React.ReactNode
  valueStyle?: React.CSSProperties
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={valueStyle}>
        {value}
      </div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

function ActionCard({
  to,
  tag,
  icon,
  title,
  meta,
  cta = 'Start',
  dashed = false,
}: {
  to: string
  tag?: string
  icon: React.ReactNode
  title: string
  meta: string
  cta?: string
  dashed?: boolean
}) {
  return (
    <Link to={to} className={`action-card${dashed ? ' action-card--dashed' : ''}`}>
      {tag && (
        <span className={`ujr-tag${dashed ? ' ujr-tag--warning' : ''}`}>
          {tag}
        </span>
      )}
      <div className={`action-icon${dashed ? ' action-icon--warning' : ''}`}>
        {icon}
      </div>
      <div className="action-title">{title}</div>
      <div className="action-meta">{meta}</div>
      <div className="action-cta">
        {cta} <ArrowRight />
      </div>
    </Link>
  )
}

const toneClassName: Record<'green' | 'amber' | 'blue', string> = {
  green: 'recent-row__icon--green',
  amber: 'recent-row__icon--amber',
  blue: 'recent-row__icon--blue',
}

function RecentRow({
  icon,
  tone,
  title,
  meta,
  time,
  to,
  pending,
}: {
  icon: React.ReactNode
  tone: keyof typeof toneClassName
  title: string
  meta: string
  time: string
  to?: string
  pending?: string
}) {
  const body = (
    <>
      <div className={`recent-row__icon ${toneClassName[tone]}`}>
        {icon}
      </div>
      <div className="recent-row__body">
        <div className="recent-row__title">{title}</div>
        <div className="recent-row__meta">{meta}</div>
      </div>
      <div className="recent-row__time">{time}</div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="recent-row">
        {body}
      </Link>
    )
  }

  return (
    <a
      href="#activity"
      className="recent-row"
      onClick={(e) => {
        e.preventDefault()
        if (pending) window.alert(pending)
      }}
    >
      {body}
    </a>
  )
}
