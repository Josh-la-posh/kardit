import React, { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBatches } from '@/hooks/useBatches'
import { CARD_PRODUCTS } from '@/stores/mockStore'
import { Eye, Filter, Loader2, RefreshCw, Search, Upload } from 'lucide-react'

type UiStatus = 'PROCESSING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'PENDING'

function normalizeStatus(status: string): UiStatus {
  const s = status.toUpperCase()
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'COMPLETED'
  if (s === 'FAILED') return 'FAILED'
  if (s === 'PROCESSING') return 'PROCESSING'
  if (s === 'UPLOADED' || s === 'VALIDATED' || s === 'SUBMITTED') return 'PENDING'
  return 'PARTIAL'
}

const STATUS_CLASS: Record<UiStatus, string> = {
  PROCESSING: 'processing',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
}

export default function BatchOperationsPage() {
  const { batches, isLoading, error, refetch } = useBatches('cards')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UiStatus>('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return batches.filter((b) => {
      const st = normalizeStatus(b.status)
      if (statusFilter !== 'ALL' && st !== statusFilter) return false
      if (!q) return true
      const product = CARD_PRODUCTS.find((p) => p.id === b.productId)?.name ?? b.productId ?? ''
      const hay = [b.batchId, b.fileName, product].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [batches, query, statusFilter])

  const stats = useMemo(() => {
    const all = batches.map((b) => normalizeStatus(b.status))
    return {
      active: all.filter((s) => s === 'PROCESSING' || s === 'PENDING').length,
      totalRows: batches.reduce((n, b) => n + (b.totalRows || 0), 0),
      completed: all.filter((s) => s === 'COMPLETED').length,
      failedRows: batches.reduce((n, b) => n + (b.failedRows || 0), 0),
    }
  }, [batches])

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Batch issuance</h1>
                <p className="page-sub">Upload customer files to onboard and issue cards in bulk.</p>
              </div>
              <div className="row-end" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost" type="button" onClick={refetch}>
                  <RefreshCw /> Refresh
                </button>
                <Link className="btn btn-primary" to="/batch-operations/new">
                  <Upload /> New batch
                </Link>
              </div>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Active jobs" value={String(stats.active)} sub="Processing and pending batches" />
              <Kpi label="Total rows" value={stats.totalRows.toLocaleString()} sub="Rows received from backend" />
              <Kpi label="Completed" value={String(stats.completed)} valueCls="success" sub="Successfully finalized batches" />
              <Kpi label="Failed rows" value={String(stats.failedRows)} valueCls="warning" sub="Rows with processing errors" />
            </section>

            <section className="bch-card" style={{ marginTop: 20 }}>
              <div className="card-head">
                <div className="card-head-title">Recent batch jobs</div>
                <div className="row-end" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="search-wrap">
                    <Search />
                    <input
                      className="bch-input bch-input-sm"
                      placeholder="Search batch ID or filename"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <label className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                    <Filter />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UiStatus)}
                      style={{ background: 'transparent', border: 'none', outline: 'none' }}
                    >
                      <option value="ALL">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </label>
                </div>
              </div>

              {isLoading ? (
                <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}>
                  <Loader2 className="spin" style={{ width: 22, height: 22 }} />
                </div>
              ) : error ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <div className="empty-list-title">Could not load batches</div>
                  <div className="empty-list-sub">{error}</div>
                  <button className="btn btn-secondary" onClick={refetch}><RefreshCw /> Try again</button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <div className="empty-list-title">No batches found</div>
                  <div className="empty-list-sub">Try another filter, or upload a new batch.</div>
                </div>
              ) : (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>File</th>
                      <th>Product</th>
                      <th>Submitted</th>
                      <th className="right">Rows</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const status = normalizeStatus(b.status)
                      const product = CARD_PRODUCTS.find((p) => p.id === b.productId)?.name || b.productId || '-'
                      return (
                        <tr key={b.batchId}>
                          <td className="id">{b.batchId}</td>
                          <td className="meta">{b.fileName}</td>
                          <td className="meta">{product}</td>
                          <td className="meta">{formatDistanceToNow(new Date(b.uploadedAt), { addSuffix: true })}</td>
                          <td className="right tabular">{b.totalRows || b.recordsReceived}</td>
                          <td>
                            <span className={`badge ${STATUS_CLASS[status]}`}>
                              {status === 'PROCESSING' && <Loader2 className="spin" style={{ width: 11, height: 11 }} />}
                              {status}
                            </span>
                          </td>
                          <td className="right">
                            <Link to={`/batch-operations?batchId=${encodeURIComponent(b.batchId)}`} className="icon-button" style={{ marginLeft: 'auto' }}>
                              <Eye />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
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

function Kpi({ label, value, sub, valueCls }: { label: string; value: string; sub: string; valueCls?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={valueCls ? `kpi-value ${valueCls}` : 'kpi-value'}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
