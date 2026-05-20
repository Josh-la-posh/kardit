import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PaginatedTable } from '@/components/ui/paginated-table'
import { StatusChip } from '@/components/ui/status-chip'
import type { StatusType } from '@/components/ui/status-chip'
import { useAffiliateBankPartnerships } from '@/hooks/useAffiliateBanks'

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING_BANK_APPROVAL: 'PENDING',
  REJECTED: 'FAILED',
  INACTIVE: 'INACTIVE',
}

export default function AffiliateBanksPage() {
  const { banks, isLoading, error, refresh } = useAffiliateBankPartnerships()
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pagedBanks = useMemo(() => {
    const start = (page - 1) * pageSize
    return banks.slice(start, start + pageSize)
  }, [banks, page])

  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(banks.length / pageSize))
    if (page > totalPages) setPage(totalPages)
  }, [banks.length, page])

  const columns = [
    {
      key: 'bank',
      header: 'Bank',
      className: 'text-[13px]',
      render: (bank: (typeof banks)[number]) => (
        <>
          <div style={{ fontWeight: 600, color: 'var(--cs-ink-700)' }}>{bank.bankName}</div>
          <div className="meta mono">{bank.bankId}</div>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-[13px]',
      render: (bank: (typeof banks)[number]) => (
        <StatusChip status={statusToChip[bank.partnershipStatus] || 'INACTIVE'} label={bank.partnershipStatus} />
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      className: 'text-[13px] text-[var(--cs-ink-200)]',
      render: (bank: (typeof banks)[number]) => format(new Date(bank.lastUpdatedAt), 'MMM d, yyyy HH:mm'),
    },
    {
      key: 'notes',
      header: 'Notes',
      className: 'text-[13px] text-[var(--cs-ink-200)]',
      render: (bank: (typeof banks)[number]) => bank.rejectionReason || '-',
    },
  ]

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout navVariant="affiliate">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Bank Partnerships</h1>
                <p className="page-sub">Track current and pending issuing-bank partnerships for your affiliate.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'spin' : ''} /> Refresh
                </button>
                <Link className="btn btn-primary" to="/banks/request-partnership">
                  <Plus /> Request new partnership
                </Link>
              </div>
            </header>

            <section className="bch-card" style={{ overflow: 'hidden' }}>
              <div className="card-head">
                <div className="card-head-title">Partnered banks</div>
              </div>

              {isLoading ? (
                <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
                  <Loader2 className="spin" style={{ width: 24, height: 24 }} />
                </div>
              ) : error && !banks.length ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <div className="empty-list-title">Could not load partnerships</div>
                  <div className="empty-list-sub">{error}</div>
                </div>
              ) : banks.length === 0 ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <Building2 />
                  <div className="empty-list-title">No bank partnerships yet</div>
                  <div className="empty-list-sub">Start by requesting a partnership with an issuing bank.</div>
                  <Link className="btn btn-primary" to="/banks/request-partnership">
                    <Plus /> Request partnership
                  </Link>
                </div>
              ) : (
                <PaginatedTable
                  className="border-0 shadow-none rounded-none"
                  columns={columns}
                  rows={pagedBanks}
                  page={page}
                  pageSize={pageSize}
                  total={banks.length}
                  onPageChange={setPage}
                />
              )}
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
