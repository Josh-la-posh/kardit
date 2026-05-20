import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, Loader2, Send } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAffiliateBankPartnerships } from '@/hooks/useAffiliateBanks'
import { useBankQuery } from '@/hooks/useBanks'

export default function AffiliateBankRequestPage() {
  const navigate = useNavigate()
  const { banks, isSubmitting, requestPartnership } = useAffiliateBankPartnerships()
  const [selectedBankId, setSelectedBankId] = useState('')
  const [bankSearch, setBankSearch] = useState('')
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const {
    banks: bankCatalog,
    isLoading: bankCatalogLoading,
    error: bankCatalogError,
  } = useBankQuery({
    status: ['ACTIVE'],
    search: bankSearch,
    page: 1,
    pageSize: 25,
  })

  const requestableBanks = useMemo(() => {
    const existing = new Set(banks.map((bank) => bank.bankId))
    return bankCatalog.filter((bank) => !existing.has(bank.bankId))
  }, [bankCatalog, banks])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (!selectedBankId) {
      setLocalError('Select a bank to continue.')
      return
    }
    if (!note.trim()) {
      setLocalError('Add a short partnership note before submitting.')
      return
    }

    try {
      await requestPartnership({ bankId: selectedBankId, note: note.trim() })
      toast.success('Partnership request submitted')
      navigate('/banks')
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to submit partnership request')
    }
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout navVariant="affiliate">
        <main className="scr-main">
          <div className="container container--narrow">
            <header>
              <Link to="/banks" className="back-link">
                <ArrowLeft /> Back to bank partnerships
              </Link>
              <h1 className="page-title">Request new partnership</h1>
              <p className="page-sub">Submit a request to add another issuing bank to your affiliate portfolio.</p>
            </header>

            <section className="bch-card card-pad-lg" style={{ marginTop: 18 }}>
              {(localError || bankCatalogError) && (
                <div className="notice info" style={{ marginBottom: 14 }}>
                  <AlertCircle />
                  <div>{localError || bankCatalogError}</div>
                </div>
              )}

              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="bch-label">Search banks</label>
                  <input
                    className="bch-input"
                    placeholder="Search by bank name or code"
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value)
                      setSelectedBankId('')
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="bch-label">Bank</label>
                  <select
                    className="bch-select"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    disabled={isSubmitting || bankCatalogLoading || !requestableBanks.length}
                  >
                    <option value="">{bankCatalogLoading ? 'Loading banks...' : requestableBanks.length ? 'Select a bank' : 'No banks available'}</option>
                    {requestableBanks.map((bank) => (
                      <option key={bank.bankId} value={bank.bankId}>
                        {bank.bankName} ({bank.bankCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="bch-label">Request note</label>
                  <textarea
                    className="bch-input"
                    style={{ minHeight: 128, resize: 'vertical' }}
                    placeholder="We would like to distribute NGN prepaid cards for our retail network."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="row-end divider-top">
                  <Link className="btn btn-ghost" to="/banks">Cancel</Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || bankCatalogLoading || !requestableBanks.length}
                  >
                    {isSubmitting ? <Loader2 className="spin" style={{ width: 14, height: 14 }} /> : <Send />}
                    Submit request
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
