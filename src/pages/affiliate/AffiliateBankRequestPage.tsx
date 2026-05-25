import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, Check, ChevronsUpDown, Loader2, Send, X } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAffiliateBankPartnerships } from '@/hooks/useAffiliateBanks'
import { queryBanks } from '@/services/bankApi'
import type { BankQueryItem } from '@/types/bankContracts'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

const AFFILIATE_BANKS_CACHE_KEY = 'kardit.affiliate.bank-catalog.v1'

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
            const parsed = JSON.parse(raw) as BankQueryItem[]
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (mounted) setBankCatalog(parsed)
              return
            }
          } catch {
            window.localStorage.removeItem(AFFILIATE_BANKS_CACHE_KEY)
          }
        }

        const response = await queryBanks({
          filters: { status: ['ACTIVE'] },
          page: 1,
          pageSize: 1000,
        })

        const activeBanks = (response.data || []).filter((bank) => bank.status === 'ACTIVE')
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
    const query = bankSearch.trim().toLowerCase()
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
                  <Popover open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
                    <PopoverTrigger asChild>
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
                      >
                        <span style={{ opacity: selectedBankId ? 1 : 0.65 }}>
                          {selectedBankId
                            ? requestableBanks.find((bank) => bank.bankId === selectedBankId)?.bankName ||
                              requestableBanks.find((bank) => bank.bankId === selectedBankId)?.bankCode
                            : bankCatalogLoading
                              ? 'Loading banks...'
                              : 'Search and select a bank'}
                        </span>
                        <ChevronsUpDown style={{ width: 16, height: 16, opacity: 0.7 }} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start" sideOffset={8}>
                      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Select a bank</div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ height: 28, padding: '0 8px' }}
                            onClick={() => setBankPickerOpen(false)}
                          >
                            <X style={{ width: 14, height: 14 }} />
                            Close
                          </button>
                        </div>
                      </div>
                      <Command shouldFilter>
                        <CommandInput
                          placeholder="Search banks by name or code..."
                          value={bankSearch}
                          onValueChange={(value) => setBankSearch(value)}
                        />
                        <CommandList className="max-h-[280px]">
                          <CommandEmpty>No banks found.</CommandEmpty>
                          <CommandGroup>
                            {requestableBanks.map((bank) => {
                              const label = bank.bankName !== '' ? bank.bankName : bank.bankCode
                              return (
                                <CommandItem
                                  key={bank.bankId}
                                  value={`${label} ${bank.bankCode}`}
                                  onSelect={() => {
                                    setSelectedBankId(bank.bankId)
                                    setBankSearch(label)
                                    setBankPickerOpen(false)
                                  }}
                                  className='w-full'
                                >
                                  <div className={`w-full flex items-center justify-between ${selectedBankId === bank.bankId && 'px-3 pt-1 bg-muted/50  hover:bg-[var(--cs-green-300)]'}`}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span className='bch-label'>{label}</span>
                                    </div>
                                    <Check
                                      className={cn('h-4 w-4', selectedBankId === bank.bankId ? 'opacity-100' : 'opacity-0')}
                                    />
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
