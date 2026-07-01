import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { BatchDownloadDialog } from '@/components/BatchDownloadDialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { downloadBatchResults, getBatch } from '@/services/batchApi'
import type { BatchResultsFormat, GetBatchResponse, GetBatchResultsResponse } from '@/types/batchContracts'

export default function BatchOperationDetailPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const [batch, setBatch] = useState<GetBatchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<BatchResultsFormat | null>(null)
  const [downloadDetails, setDownloadDetails] = useState<GetBatchResultsResponse | null>(null)

  const fetch = useCallback(async () => {
    if (!batchId) {
      setBatch(null)
      setError('Missing batch id')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await getBatch(batchId)
      setBatch(response)
    } catch (err) {
      setBatch(null)
      setError(err instanceof Error ? err.message : 'Could not load batch detail')
    } finally {
      setIsLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleDownload = async (downloadFormat: BatchResultsFormat) => {
    if (!batchId) return
    setDownloading(downloadFormat)
    try {
      const response = await downloadBatchResults(batchId, downloadFormat)
      setDownloadDetails(response)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download batch results')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <Link to="/batch-operations" className="back-link">
                  <ArrowLeft /> Back to batch operations
                </Link>
                <h1 className="page-title">Batch details</h1>
                <p className="page-sub">Review processing totals and download the batch results.</p>
              </div>
              <div className="row-end" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {batch && (
                  <>
                    <button className="btn btn-ghost" type="button" onClick={() => handleDownload('csv')} disabled={downloading !== null}>
                      {downloading === 'csv' ? <Loader2 className="spin" /> : <Download />} CSV
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => handleDownload('excel')} disabled={downloading !== null}>
                      {downloading === 'excel' ? <Loader2 className="spin" /> : <Download />} Excel
                    </button>
                  </>
                )}
                <button className="btn btn-ghost" type="button" onClick={fetch} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'spin' : undefined} /> Refresh
                </button>
              </div>
            </header>

            <section className="bch-card" style={{ marginTop: 20 }}>
              {isLoading ? (
                <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}>
                  <Loader2 className="spin" style={{ width: 22, height: 22 }} />
                </div>
              ) : error ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <div className="empty-list-title">Could not load batch detail</div>
                  <div className="empty-list-sub">{error}</div>
                </div>
              ) : !batch ? (
                <div className="empty-list" style={{ padding: 24 }}>
                  <div className="empty-list-title">Batch not found</div>
                </div>
              ) : (
                <div className="card-pad-lg">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                    <h3 className="card-head-title">Batch summary</h3>
                    <span className={`badge ${batch.status.toLowerCase()}`}>{batch.status}</span>
                  </div>

                  <div className="batch-summary-grid">
                    <dl className="batch-summary-list">
                      <div><dt>Batch ID</dt><dd className="mono">{batch.batchId}</dd></div>
                      <div><dt>Total rows</dt><dd>{batch.totalRows}</dd></div>
                      <div><dt>Valid rows</dt><dd className="success">{batch.validRows}</dd></div>
                      <div><dt>Invalid rows</dt><dd className={batch.invalidRows > 0 ? 'danger' : undefined}>{batch.invalidRows}</dd></div>
                    </dl>
                    <dl className="batch-summary-list">
                      <div><dt>Processed rows</dt><dd className="success">{batch.processedRows}</dd></div>
                      <div><dt>Failed rows</dt><dd className={batch.failedRows > 0 ? 'danger' : undefined}>{batch.failedRows}</dd></div>
                      <div><dt>Created</dt><dd>{format(new Date(batch.createdAt), 'MMM d, yyyy HH:mm')}</dd></div>
                      <div><dt>Last updated</dt><dd>{format(new Date(batch.updatedAt), 'MMM d, yyyy HH:mm')}</dd></div>
                    </dl>
                  </div>

                  <div className="form-foot" style={{ marginTop: 24 }}>
                    <Link to="/batch-operations" className="btn btn-ghost btn-sm">
                      <ArrowLeft /> Back to batches
                    </Link>
                  </div>
                </div>

                
              )}
            </section>
            <BatchDownloadDialog download={downloadDetails} onClose={() => setDownloadDetails(null)} />
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
