import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { getBatch } from '@/services/batchApi'
import type { GetBatchResponse } from '@/types/batchContracts'

export default function BatchOperationDetailPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const [batch, setBatch] = useState<GetBatchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <Link to="/batch-operations" className="back-link">
                  <ArrowLeft /> Back to batch operations
                </Link>
                <h1 className="page-title">Submit batch for approval</h1>
                <p className="page-sub">A checker in your tenant will review and approve before processing begins.</p>
              </div>
              <button className="btn btn-ghost" type="button" onClick={fetch}>
                <RefreshCw /> Refresh
              </button>
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
                  <h3 className="card-head-title" style={{ marginBottom: 18 }}>Batch summary</h3>

                  <div className="batch-summary-grid">
                    <dl className="batch-summary-list">
                      <div><dt>Batch ID</dt><dd className="mono">{batch.batchId}</dd></div>
                      <div><dt>Card product</dt><dd>-</dd></div>
                      <div><dt>Total rows</dt><dd>{batch.totalRows}</dd></div>
                      <div><dt>Invalid (skipped)</dt><dd className="danger">{batch.invalidRows}</dd></div>
                    </dl>
                    <dl className="batch-summary-list">
                      <div><dt>Source file</dt><dd>-</dd></div>
                      <div><dt>Issuing bank</dt><dd>-</dd></div>
                      <div><dt>Valid rows to process</dt><dd className="success">{batch.validRows}</dd></div>
                      <div><dt>Maker</dt><dd>-</dd></div>
                    </dl>
                  </div>

                  <div className="batch-warning-note">
                    <AlertCircle />
                    <p>
                      <strong>Once submitted, this batch enters the approval queue.</strong> A different user with checker rights must approve before
                      processing begins. You won&apos;t be able to edit the file after this point.
                    </p>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <label className="bch-label">Note for checker (optional)</label>
                    <textarea
                      className="bch-input"
                      rows={4}
                      placeholder="e.g. Lagos branch onboarding for week 18.8 invalid rows are duplicates from last week's batch."
                    />
                  </div>

                  <div className="help-text" style={{ marginTop: 14 }}>
                    Status: <strong>{batch.status}</strong> · Created {format(new Date(batch.createdAt), 'MMM d, yyyy HH:mm')} · Updated {format(new Date(batch.updatedAt), 'MMM d, yyyy HH:mm')}
                  </div>

                  <div className="form-foot" style={{ marginTop: 24 }}>
                    <Link to="/portal/issue-card/customer" className="btn btn-ghost btn-sm">
                      <ArrowLeft /> Back
                    </Link>
                    <button className="btn btn-primary" disabled={false} onClick={() => {}}>
                      Continue <ArrowRight />
                    </button>
                  </div>
                </div>

                
              )}
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
