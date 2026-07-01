import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { BatchDownloadDialog } from '@/components/BatchDownloadDialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PaginatedTable, type PaginatedColumn } from '@/components/ui/paginated-table'
import { downloadBatchResults, getBatches } from '@/services/batchApi'
import { CARD_PRODUCTS } from '@/stores/mockStore'
import type { BatchResultsFormat, BatchSummary, GetBatchResultsResponse } from '@/types/batchContracts'
import { Download, Eye, Filter, Loader2, RefreshCw, Search, Upload } from 'lucide-react'

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
  const [batches, setBatches] = useState<BatchSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UiStatus>('ALL')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadDetails, setDownloadDetails] = useState<GetBatchResultsResponse | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getBatches({
        page: 1,
        pageSize: 100,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      setBatches(response.data || [])
    } catch (err) {
      setBatches([])
      setError(err instanceof Error ? err.message : 'Could not load batches')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return batches.filter((b) => {
      const st = normalizeStatus(b.status)
      if (statusFilter !== 'ALL' && st !== statusFilter) return false
      if (!q) return true
      const product = CARD_PRODUCTS.find((p) => p.id === b.productId)?.name ?? b.productId ?? ''
      const hay = [b.id, b.batchType, b.submittedByRef, product].join(' ').toLowerCase()
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

  const handleDownload = async (batchId: string, downloadFormat: BatchResultsFormat) => {
    const downloadKey = `${batchId}:${downloadFormat}`
    setDownloading(downloadKey)
    try {
      const response = await downloadBatchResults(batchId, downloadFormat)
      setDownloadDetails(response)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download batch results')
    } finally {
      setDownloading(null)
    }
  }

  const columns: PaginatedColumn<BatchSummary>[] = [
    {
      key: 'id',
      header: 'Batch ID',
      render: (batch) => <span className="font-mono text-xs font-medium">{batch.id}</span>,
    },
    {
      key: 'batchType',
      header: 'Batch type',
      render: (batch) => <span className="text-muted-foreground">{batch.batchType}</span>,
    },
    {
      key: 'productId',
      header: 'Product',
      render: (batch) => (
        <span className="text-muted-foreground">
          {CARD_PRODUCTS.find((product) => product.id === batch.productId)?.name || batch.productId || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (batch) => (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'totalRows',
      header: 'Rows',
      className: 'text-right tabular-nums',
      render: (batch) => batch.totalRows.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (batch) => {
        const status = normalizeStatus(batch.status)
        return (
          <span className={`badge ${STATUS_CLASS[status]}`}>
            {status === 'PROCESSING' && <Loader2 className="spin" style={{ width: 11, height: 11 }} />}
            {status}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (batch) => (
        <div className="flex items-center justify-end gap-1">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            title="Download CSV results"
            onClick={() => handleDownload(batch.id, 'csv')}
            disabled={downloading !== null}
          >
            {downloading === `${batch.id}:csv` ? <Loader2 className="spin" /> : <Download />} CSV
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            title="Download Excel results"
            onClick={() => handleDownload(batch.id, 'excel')}
            disabled={downloading !== null}
          >
            {downloading === `${batch.id}:excel` ? <Loader2 className="spin" /> : <Download />} Excel
          </button>
          <Link
            to={`/batch-operations/${encodeURIComponent(batch.id)}`}
            className="icon-button"
            title="View batch details"
          >
            <Eye />
          </Link>
        </div>
      ),
    },
  ]

  const paginatedBatches = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK']}>
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
                  <div className="bch-search-wrap">
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

              <PaginatedTable
                columns={columns}
                rows={paginatedBatches}
                isLoading={isLoading}
                error={error}
                emptyMessage="No batches found. Try another filter, or upload a new batch."
                rowKey={(batch) => batch.id}
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                className="rounded-none border-x-0 border-b-0 shadow-none"
              />
            </section>
            <BatchDownloadDialog download={downloadDetails} onClose={() => setDownloadDetails(null)} />
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
