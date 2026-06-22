import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, RefreshCw, Search, UserPlus, X } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'
import { PaginatedTable } from '@/components/ui/paginated-table'
import { useCustomers } from '@/hooks/useCustomers'
import type { CustomerListItem } from '@/hooks/useCustomers'

type KycFilter = 'all' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
type StatusFilter = 'all' | 'DRAFT' | 'ACTIVE' | 'FROZEN' | 'PENDING'

export default function CustomersListPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [kyc, setKyc] = useState<KycFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { customers, isLoading, error, refetch, total } = useCustomers(query, { page, pageSize })

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (kyc !== 'all' && c.kycLevel !== kyc) return false
      if (status !== 'all' && c.status !== status) return false
      return true
    })
  }, [customers, kyc, status])

  function clearFilters() {
    setQuery('')
    setKyc('all')
    setStatus('all')
    setPage(1)
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Customers</h1>
                <p className="page-sub">
                  Search and view captured customers in your tenant. Click any row to open the
                  profile.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
                </button>
                <Link to="/customers/create" className="btn btn-primary">
                  <UserPlus /> New customer
                </Link>
              </div>
            </header>

            <AppCard padded="md" style={{ marginTop: 14 }}>
              <div className="search-input-wrap">
                <Search className="search-icn" />
                <input 
                  type="text"
                  autoComplete="off"
                  placeholder="Search by name, phone, customer ref, BVN, or NIN"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="list-toolbar">
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14, justifyContent: 'end' }}>
                {/* <div>
                  <FilterLabel>Status</FilterLabel>
                  <div className="filter-chips">
                    <Chip active={status === 'all'} onClick={() => { setStatus('all'); setPage(1) }}>All</Chip>
                    <Chip active={status === 'DRAFT'} onClick={() => { setStatus('DRAFT'); setPage(1) }}>Draft</Chip>
                    <Chip active={status === 'ACTIVE'} onClick={() => { setStatus('ACTIVE'); setPage(1) }}>Active</Chip>
                    <Chip active={status === 'FROZEN'} onClick={() => { setStatus('FROZEN'); setPage(1) }}>Frozen</Chip>
                    <Chip active={status === 'PENDING'} onClick={() => { setStatus('PENDING'); setPage(1) }}>Pending</Chip>
                  </div>
                </div> */}
                <div className="mt-3 flex gap-3">
                  <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                    <X /> Clear filters
                  </button>
                </div>
              </div>
            </AppCard>

            <div className="result-meta">
              Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> customers
            </div>

            <AppCard style={{ marginTop: 6, overflow: 'hidden' }}>
              <PaginatedTable
                columns={customerColumns}
                rows={filtered}
                isLoading={isLoading}
                error={error}
                emptyMessage="No customers match those filters."
                onRowClick={(row) => navigate(`/customers/${encodeURIComponent(row.customerRefId)}`)}
                rowKey={(row) => row.customerRefId}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>

            <div className="notice info" style={{ marginTop: 10 }}>
              <InfoIcon />
              <div>
                <span className="strong">Scope.</span>{' '}
                This list is segregated to your tenant. Issuing-bank users see only customers
                under their bank's cards; service-provider users see globally.
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

const customerColumns = [
  // {
  //   key: 'customerRefId',
  //   header: 'Reference',
  //   className: 'id',
  //   render: (c: CustomerListItem) => c.customerRefId,
  // },
  {
    key: 'fullName',
    header: 'Name',
    render: (c: CustomerListItem) => (
      <div className="customer-name">
        <div className="avatar-sm">{getInitials(c.fullName)}</div>
        <div>
          <div className="customer-name__title">{c.fullName}</div>
          <div className="customer-name__sub">{c.email || c.phone}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Phone',
    className: 'mono customer-phone',
    render: (c: CustomerListItem) => c.phone || '-',
  },
  {
    key: 'kycLevel',
    header: 'KYC',
    render: (c: CustomerListItem) => <KycBadge level={c.kycLevel} />,
  },
  // {
  //   key: 'status',
  //   header: 'Status',
  //   render: (c: CustomerListItem) => <StatusBadge status={c.status} />,
  // },
  {
    key: 'createdAt',
    header: 'Created',
    className: 'meta',
    render: (c: CustomerListItem) => formatShortDate(c.createdAt),
  },
  {
    key: 'actions',
    header: '',
    className: 'right',
    render: (c: CustomerListItem) => (
      <Link
        to={`/customers/${encodeURIComponent(c.customerRefId)}`}
        className="icon-button"
        aria-label="View profile"
        onClick={(e) => e.stopPropagation()}
      >
        <ChevronRight />
      </Link>
    ),
  },
]

function Chip({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button className={active ? 'filter-chip is-active' : 'filter-chip'} onClick={onClick}>
      {children}
    </button>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <div className="filter-label">{children}</div>
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const css = `status-${status.toLowerCase()}`
  return <span className={`badge ${css}`}>{status}</span>
}

function KycBadge({ level }: { level: string }) {
  const n = level.replace('LEVEL_', '')
  return <span className={`kyc-pill lvl-${n}`}>Tier {n}</span>
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
