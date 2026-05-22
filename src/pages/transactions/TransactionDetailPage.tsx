import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { getTransaction } from '@/services/transactionApi'
import type { TransactionDetail } from '@/types/transactionContracts'

function formatMoney(amount: number, currency: string) {
  const safeCurrency = (currency || '').trim() || 'NGN'
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('en-NG')} ${safeCurrency}`
  }
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  try {
    return format(new Date(value), 'MMM d, yyyy h:mm a')
  } catch {
    return value
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'SUCCESS' || status === 'AUTHORIZED' || status === 'COMPLETED') return 'default'
  if (status === 'FAILED' || status === 'REFUSED' || status === 'CANCELLED') return 'destructive'
  if (status === 'PENDING') return 'secondary'
  return 'outline'
}

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!transactionId) {
        setError('No transaction ID provided')
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const response = await getTransaction(transactionId)
        if (active) setTransaction(response)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load transaction detail')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [transactionId])

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK', 'SERVICE_PROVIDER']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container container--narrow">
            <Link to="/transactions" className="back-link">
              <ArrowLeft /> Back to transactions
            </Link>

            <header className="page-head">
              <div>
                <h1 className="page-title">Transaction detail</h1>
                <p className="page-sub">Inspect metadata, references, and status lifecycle for this transaction.</p>
              </div>
            </header>

            <AppCard padded="md" style={{ marginTop: 14 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Detail</AppCardTitle>
                  <AppCardSub>{transactionId || '-'}</AppCardSub>
                </div>
              </AppCardHeader>

              {isLoading ? (
                <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
                  <Loader2 className="spin" style={{ width: 20, height: 20 }} />
                </div>
              ) : error ? (
                <div className="notice info">{error}</div>
              ) : !transaction ? (
                <div className="notice info">Transaction not found.</div>
              ) : (
                <div className="space-y-4">
                  <Detail label="Transaction ID" mono value={transaction.transactionId} />
                  <Detail label="Status" value={<Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>} />
                  <Detail label="Type" value={transaction.transactionType} />
                  <Detail label="Amount" value={formatMoney(transaction.amount, transaction.currency)} />
                  <Detail label="Merchant" value={transaction.merchantName || '-'} />
                  <Detail label="Customer ID" mono value={transaction.customerId} />
                  <Detail label="Card ID" mono value={transaction.cardId} />
                  <Detail label="Authorization Code" value={transaction.authorizationCode || '-'} />
                  <Detail label="Merchant MCC" value={transaction.merchantCategoryCode || '-'} />
                  <Detail label="Source Reference" mono value={transaction.sourceRef || '-'} />
                  <Detail label="Transaction Date" value={formatDateTime(transaction.transactionDate)} />
                  <Detail label="Created At" value={formatDateTime(transaction.createdAt)} />
                </div>
              )}
            </AppCard>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--cs-ink-100)]">{label}</div>
      <div className={mono ? 'mt-1 text-sm font-mono text-[var(--cs-ink-700)]' : 'mt-1 text-sm text-[var(--cs-ink-400)]'}>{value}</div>
    </div>
  )
}
