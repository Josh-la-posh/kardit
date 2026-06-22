import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, ChevronsUpDown, Loader2, Send, X } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAffiliateBankPartnerships } from '@/hooks/useAffiliateBanks'
import { getBanks } from '@/services/bankApi'
import type { BankQueryItem } from '@/types/bankContracts'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const AFFILIATE_BANKS_CACHE_KEY = 'kardit.affiliate.bank-catalog.v1'

function normalizeBank(candidate: any): BankQueryItem | null {
  const bankId = String(candidate?.bankId || '').trim()
  const bankName = String(candidate?.bankName || candidate?.bankDetails?.name || '').trim()
  const bankCode = String(candidate?.bankCode || candidate?.bankDetails?.code || '').trim()
  const status = String(candidate?.status || 'ACTIVE').trim()
  const createdAt = String(candidate?.createdAt || new Date(0).toISOString()).trim()
  const supportedCurrencies = Array.isArray(candidate?.supportedCurrencies)
    ? candidate.supportedCurrencies
    : undefined

  if (!bankId) return null
  if (!bankName && !bankCode) return null

  return {
    bankId,
    bankName,
    bankCode,
    status,
    createdAt,
    supportedCurrencies,
  }
}

export default function AffiliateBankRequestPage() {
  const navigate = useNavigate()
  const { banks, isSubmitting, requestPartnership } = useAffiliateBankPartnerships()
  const [selectedBankId, setSelectedBankId] = useState('')
  const [bankSearch, setBankSearch] = useState('')
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [bankCatalog, setBankCatalog] = useState<BankQueryItem[]>([])
  const [bankCatalogLoading, setBankCatalogLoading] = useState(true)
  const [bankCatalogError, setBankCatalogError] = useState<string | null>(null)
  const [bankPickerOpen, setBankPickerOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadCatalog = async () => {
      setBankCatalogLoading(true)
      setBankCatalogError(null)

      try {
        const raw = window.localStorage.getItem(AFFILIATE_BANKS_CACHE_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as unknown[]
            const normalized = Array.isArray(parsed)
              ? parsed.map(normalizeBank).filter((bank): bank is BankQueryItem => Boolean(bank))
              : []
            if (normalized.length > 0) {
              if (mounted) setBankCatalog(normalized)
              window.localStorage.setItem(AFFILIATE_BANKS_CACHE_KEY, JSON.stringify(normalized))
              return
            }
          } catch {
            window.localStorage.removeItem(AFFILIATE_BANKS_CACHE_KEY)
          }
        }

        const response = await getBanks()
        const activeBanks = (response || [])
          .map(normalizeBank)
          .filter((bank): bank is BankQueryItem => Boolean(bank))
          .filter((bank) => bank.status === 'ACTIVE')
        window.localStorage.setItem(AFFILIATE_BANKS_CACHE_KEY, JSON.stringify(activeBanks))
        if (mounted) setBankCatalog(activeBanks)
      } catch (e) {
        if (mounted) {
          setBankCatalog([])
          setBankCatalogError(e instanceof Error ? e.message : 'Failed to load banks')
        }
      } finally {
        if (mounted) setBankCatalogLoading(false)
      }
    }

    void loadCatalog()
    return () => {
      mounted = false
    }
  }, [])

  const filteredBankCatalog = useMemo(() => {
    const query = (bankSearch || '').trim().toLowerCase()
    if (!query) return bankCatalog
    return bankCatalog.filter((bank) => {
      const name = bank.bankName?.toLowerCase() || ''
      const code = bank.bankCode?.toLowerCase() || ''
      return name.includes(query) || code.includes(query)
    })
  }, [bankCatalog, bankSearch])

  const requestableBanks = useMemo(() => {
    const existing = new Set(banks.map((bank) => bank.bankId))
    return filteredBankCatalog.filter((bank) => !existing.has(bank.bankId))
  }, [filteredBankCatalog, banks])

  const selectedBank = useMemo(
    () => requestableBanks.find((bank) => bank.bankId === selectedBankId) || null,
    [requestableBanks, selectedBankId]
  )

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
                  <label className="bch-label">Bank</label>
                  <button
                    type="button"
                    className="bch-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    disabled={isSubmitting || bankCatalogLoading || !requestableBanks.length}
                    onClick={() => setBankPickerOpen(true)}
                  >
                    <span style={{ opacity: selectedBankId ? 1 : 0.65 }}>
                      {selectedBankId
                        ? selectedBank?.bankName || selectedBank?.bankCode
                        : bankCatalogLoading
                          ? 'Loading banks...'
                          : 'Search and select a bank'}
                    </span>
                    <ChevronsUpDown style={{ width: 16, height: 16, opacity: 0.7 }} />
                  </button>

                  <Dialog open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
                    <DialogContent
                      className="flex h-full md:h-[86vh] w-full md:w-[60vw] max-w-[1120px] grid-rows-none flex-col gap-0 overflow-hidden border bg-background/95 p-0 shadow-2xl backdrop-blur sm:rounded-lg"
                      overlayClassName="bg-background/10 backdrop-blur-sm"
                    >
                      <DialogHeader className="border-b px-6 py-5 text-left" >
                        <div>
                          <DialogTitle>Select a bank</DialogTitle>
                          <DialogDescription>
                            Search and choose the issuing bank you want to add to your affiliate portfolio.
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                      <Command shouldFilter className="flex min-h-0 flex-1 flex-col rounded-none">
                        <div className="border-b px-5 py-4">
                          <CommandInput
                            placeholder="Search banks by name or code..."
                            value={bankSearch}
                            onValueChange={(value) => setBankSearch(value || '')}
                            className="h-11"
                          />
                        </div>
                        <CommandList className="max-h-none flex-1 overflow-y-auto px-5 py-4">
                          <CommandEmpty>No banks found.</CommandEmpty>
                          <CommandGroup className="">
                            {requestableBanks.map((bank) => {
                              const label = bank.bankName !== '' ? bank.bankName : bank.bankCode
                              const isSelected = selectedBankId === bank.bankId
                              const initials = label
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join('')
                                .slice(0, 2)
                              return (
                                <CommandItem
                                  key={bank.bankId}
                                  value={`${label} ${bank.bankCode}`}
                                  onSelect={() => {
                                    setSelectedBankId(bank.bankId)
                                    setBankSearch(label)
                                    setBankPickerOpen(false)
                                  }}
                                  className="w-full cursor-pointer rounded-md p-1 data-[selected=true]:bg-transparent"
                                >
                                  <div
                                    className={cn(
                                      'flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors',
                                      'border-transparent hover:border-[var(--cs-green-300)] hover:bg-[var(--cs-green-100)]',
                                      isSelected && 'border-[var(--cs-green-700)] bg-[var(--cs-green-100)] shadow-sm'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                        isSelected
                                          ? 'bg-[var(--cs-green-700)] text-white'
                                          : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {initials || 'BK'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium text-foreground">{label}</div>
                                      <div className="truncate text-xs text-muted-foreground">
                                        {bank.bankCode ? `Code: ${bank.bankCode}` : bank.bankId}
                                      </div>
                                    </div>
                                    {isSelected && <input
                                      type="radio"
                                      name="selected-bank"
                                      checked={isSelected}
                                      readOnly
                                      className="h-4 w-4 accent-[var(--cs-green-700)]"
                                      aria-label={`${label} selected`}
                                    />}
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </DialogContent>
                  </Dialog>
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
