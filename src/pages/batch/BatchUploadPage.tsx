import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, ChevronDown, ChevronRight, Download, FileText, Loader2, Upload as UploadIcon, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useBatches } from '@/hooks/useBatches'
import { getBankPartnershipsByAffiliate, resolveAffiliateId } from '@/services/affiliateBankApi'
import { CARD_PRODUCTS } from '@/stores/mockStore'

const AFFILIATE_BANKS_CACHE_KEY = 'kardit.affiliate.bank-catalog.v1'

type CachedBank = {
  bankId: string
  bankName: string
  bankCode: string
  status: string
}

function normalizeBank(candidate: any): CachedBank | null {
  const bankId = String(candidate?.bankId || '').trim()
  const bankName = String(candidate?.bankName || candidate?.bankDetails?.name || '').trim()
  const bankCode = String(candidate?.bankCode || candidate?.bankDetails?.code || '').trim()
  const status = String(candidate?.status || candidate?.partnershipStatus || 'ACTIVE').trim()

  if (!bankId) return null
  if (!bankName && !bankCode) return null

  return { bankId, bankName, bankCode, status }
}

export default function BatchUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [productId, setProductId] = useState(CARD_PRODUCTS[0]?.id ?? '')
  const [bankId, setBankId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [banksLoading, setBanksLoading] = useState(true)
  const [banksError, setBanksError] = useState<string | null>(null)
  const [allBanks, setAllBanks] = useState<CachedBank[]>([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const { upload } = useBatches('cards')

  useEffect(() => {
    let mounted = true

    const loadBanks = async () => {
      setBanksLoading(true)
      setBanksError(null)

      try {
        const affiliateId = resolveAffiliateId(user)
        const cacheKey = `${AFFILIATE_BANKS_CACHE_KEY}:${affiliateId}`
        const raw = window.localStorage.getItem(cacheKey)

        if (raw) {
          try {
            const parsed = JSON.parse(raw) as unknown[]
            const normalized = Array.isArray(parsed)
              ? parsed.map(normalizeBank).filter((bank): bank is CachedBank => Boolean(bank))
              : []

            if (normalized.length > 0) {
              if (mounted) setAllBanks(normalized)
              window.localStorage.setItem(cacheKey, JSON.stringify(normalized))
              return
            }
          } catch {
            window.localStorage.removeItem(cacheKey)
          }
        }

        const response = await getBankPartnershipsByAffiliate(affiliateId)
        const normalized = (response.banks || [])
          .map(normalizeBank)
          .filter((bank): bank is CachedBank => Boolean(bank))
          .filter((bank) => bank.status === 'ACTIVE')

        window.localStorage.setItem(cacheKey, JSON.stringify(normalized))
        if (mounted) setAllBanks(normalized)
      } catch (error) {
        if (mounted) {
          setAllBanks([])
          setBanksError(error instanceof Error ? error.message : 'Failed to load banks')
        }
      } finally {
        if (mounted) setBanksLoading(false)
      }
    }

    void loadBanks()
    return () => {
      mounted = false
    }
  }, [user])

  const availableBanks = useMemo(
    () => allBanks.filter((bank) => bank.status === 'ACTIVE'),
    [allBanks]
  )

  useEffect(() => {
    if (!availableBanks.length) {
      setBankId('')
      return
    }

    setBankId((current) => {
      if (current && availableBanks.some((bank) => bank.bankId === current)) return current
      return availableBanks[0]?.bankId || ''
    })
  }, [availableBanks])

  async function onUploadAndValidate() {
    if (!file || !productId || !bankId) return
    setUploading(true)
    try {
      const res = await upload({ category: 'cards', file, productId, bankId })
      toast.success(`Batch ${res.batchId} uploaded.`)
      navigate('/batch-operations')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container container--narrow">
            <header>
              <Link to="/batch-operations" className="back-link">
                <ArrowLeft /> Back to batch dashboard
              </Link>
              <h1 className="page-title">New batch upload</h1>
              <p className="page-sub">Upload a CSV or XLSX file containing customer details for bulk card issuance.</p>
            </header>

            <section
              className="bch-card card-pad-lg"
              style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 18 }}
            >
              <div>
                <label className="bch-label" htmlFor="product">Card product</label>
                <div className="select-wrap">
                  <select
                    id="product"
                    className="bch-select"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    {CARD_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - {p.id}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
                <p className="help-text">Determines BIN range, fees, and issuing bank for every card in this batch.</p>
              </div>

              <div>
                <label className="bch-label" htmlFor="bank">Issuing bank</label>
                <div className="select-wrap">
                  <select
                    id="bank"
                    className="bch-select"
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    disabled={banksLoading || uploading || !availableBanks.length}
                  >
                    {banksLoading ? (
                      <option value="">Loading banks...</option>
                    ) : !availableBanks.length ? (
                      <option value="">No active bank partnerships</option>
                    ) : (
                      availableBanks.map((bank) => (
                        <option key={bank.bankId} value={bank.bankId}>
                          {bank.bankName} {bank.bankCode ? `- ${bank.bankCode}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown />
                </div>
                <p className="help-text">The selected bankId will be included in the batch upload request.</p>
                {banksError && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{banksError}</p>}
              </div>

              <div>
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <label className="bch-label" style={{ marginBottom: 0 }}>Batch file</label>
                  <a
                    href="#template"
                    onClick={(e) => {
                      e.preventDefault()
                      const content = 'customerId,embossName,deliveryMethod,currency\nCUST-001,JANE DOE,COURIER,NGN\n'
                      const blob = new Blob([content], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const anchor = document.createElement('a')
                      anchor.href = url
                      anchor.download = 'card_batch_template.csv'
                      anchor.click()
                      URL.revokeObjectURL(url)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--cs-green-900)' }}
                  >
                    <Download style={{ width: 12, height: 12 }} /> Download CSV template
                  </a>
                </div>
                <label
                  className={file ? 'dropzone has-file' : 'dropzone'}
                  htmlFor="file-input"
                >
                  {file ? (
                    <div className="file-pill">
                      <div className="file-icon"><FileText /></div>
                      <div className="file-meta">
                        <div className="file-name">{file.name}</div>
                        <div className="file-detail">{(file.size / 1024).toFixed(1)} KB - ready to upload</div>
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Remove file"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <X />
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-prompt">
                      <UploadIcon />
                      <div className="dropzone-prompt-main">Drop CSV or XLSX here, or click to browse</div>
                      <div className="dropzone-prompt-sub">Up to 10,000 rows - 25 MB max - file structure must match the template</div>
                    </div>
                  )}
                </label>
                <input
                  id="file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  hidden
                  onChange={(e) => {
                    const nextFile = e.target.files?.[0]
                    if (nextFile) setFile(nextFile)
                  }}
                />
              </div>

              <div className="notice info">
                <AlertCircle />
                <div>
                  <span className="strong">File requirements: </span>
                  Header row required. Required columns:{' '}
                  <span className="mono" style={{ color: 'var(--cs-ink-400)' }}>
                    firstName, lastName, dateOfBirth, phone, bvn, address.lga, address.state
                  </span>. See template for full schema.
                </div>
              </div>

              <div className="row-end divider-top">
                <Link className="btn btn-ghost" to="/batch-operations">Cancel</Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!file || !bankId || uploading || banksLoading}
                  style={file && bankId ? undefined : { opacity: 0.4, pointerEvents: 'none' }}
                  onClick={onUploadAndValidate}
                >
                  {uploading ? <Loader2 className="spin" style={{ width: 14, height: 14 }} /> : null}
                  Upload &amp; validate <ChevronRight />
                </button>
              </div>
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
