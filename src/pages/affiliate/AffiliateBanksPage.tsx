import React from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
                <table className="data">
                  <thead>
                    <tr>
                      <th>Bank</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((bank) => (
                      <tr key={bank.bankId}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{bank.bankName}</div>
                          <div className="meta mono">{bank.bankId}</div>
                        </td>
                        <td>
                          <StatusChip status={statusToChip[bank.partnershipStatus] || 'INACTIVE'} label={bank.partnershipStatus} />
                        </td>
                        <td className="meta">{format(new Date(bank.lastUpdatedAt), 'MMM d, yyyy HH:mm')}</td>
                        <td className="meta">{bank.rejectionReason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
