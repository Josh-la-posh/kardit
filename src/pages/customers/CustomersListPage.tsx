import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, RefreshCw, Search, SearchX, UserPlus, X } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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

            <section className="card" style={{ padding: '18px 22px' }}>
              <div className="list-toolbar">
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
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
                <div>
                  <FilterLabel>KYC level</FilterLabel>
                  <div className="filter-chips">
                    <Chip active={kyc === 'all'} onClick={() => { setKyc('all'); setPage(1) }}>All</Chip>
                    <Chip active={kyc === 'LEVEL_3'} onClick={() => { setKyc('LEVEL_3'); setPage(1) }}>Tier 3</Chip>
                    <Chip active={kyc === 'LEVEL_2'} onClick={() => { setKyc('LEVEL_2'); setPage(1) }}>Tier 2</Chip>
                    <Chip active={kyc === 'LEVEL_1'} onClick={() => { setKyc('LEVEL_1'); setPage(1) }}>Tier 1</Chip>
                  </div>
                </div>
                <div>
                  <FilterLabel>Status</FilterLabel>
                  <div className="filter-chips">
                    <Chip active={status === 'all'} onClick={() => { setStatus('all'); setPage(1) }}>All</Chip>
                    <Chip active={status === 'DRAFT'} onClick={() => { setStatus('DRAFT'); setPage(1) }}>Draft</Chip>
                    <Chip active={status === 'ACTIVE'} onClick={() => { setStatus('ACTIVE'); setPage(1) }}>Active</Chip>
                    <Chip active={status === 'FROZEN'} onClick={() => { setStatus('FROZEN'); setPage(1) }}>Frozen</Chip>
                    <Chip active={status === 'PENDING'} onClick={() => { setStatus('PENDING'); setPage(1) }}>Pending</Chip>
                  </div>
                </div>
              </div>
            </section>

            <div className="result-meta">
              Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> customers
            </div>

            <section className="card" style={{ padding: 0 }}>
              <table className="data customers">
                <thead>
                  <tr>
                    <th style={{ width: 170 }}>Reference</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="right" style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <RefreshCw className="spin" />
                          <div className="empty-list-title">Loading customers...</div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <SearchX />
                          <div className="empty-list-title">Unable to load customers</div>
                          <div className="empty-list-sub">{error}</div>
                          <button className="btn btn-secondary" onClick={() => refetch()}>
                            <RefreshCw /> Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-list">
                          <SearchX />
                          <div className="empty-list-title">No customers match those filters</div>
                          <div className="empty-list-sub">
                            Try changing or clearing the filters above.
                            <br />
                            Search runs against name, phone, ref, BVN, and NIN.
                          </div>
                          <button className="btn btn-secondary" onClick={clearFilters}>
                            <X /> Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <CustomerRow
                        key={c.customerRefId}
                        c={c}
                        onOpen={() => navigate(`/customers/${encodeURIComponent(c.customerRefId)}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </section>
            <div className="table-pager">
              <div className="table-pager__meta">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
              <div className="table-pager__actions">
                <button
                  className="btn btn-secondary table-pager__btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary table-pager__btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                >
                  Next
                </button>
              </div>
            </div>

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

function CustomerRow({ c, onOpen }: { c: CustomerListItem; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} className="row-clickable">
      <td className="id">{c.customerRefId}</td>
      <td>
        <div className="customer-name">
          <div className="avatar-sm">{getInitials(c.fullName)}</div>
          <div>
            <div className="customer-name__title">{c.fullName}</div>
            <div className="customer-name__sub">{c.email || c.phone}</div>
          </div>
        </div>
      </td>
      <td className="mono customer-phone">{c.phone || '-'}</td>
      <td><KycBadge level={c.kycLevel} /></td>
      <td><StatusBadge status={c.status} /></td>
      <td className="meta">{formatShortDate(c.createdAt)}</td>
      <td className="right">
        <Link
          to={`/customers/${encodeURIComponent(c.customerRefId)}`}
          className="icon-button"
          aria-label="View profile"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronRight />
        </Link>
      </td>
    </tr>
  )
}

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
