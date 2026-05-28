import { ArrowLeft, ArrowRight, CircleDollarSign } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CARD_PRODUCTS } from '@/stores/mockStore'

const CARD_TYPES = [
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'PHYSICAL', label: 'Physical' },
] as const

type CardForm = { bankId: string; productId: string; cardType: string; currency: string }
type Bank = { bankId: string; bankDetails: { name: string; code: string } }

type Props = {
  bankSearch: string
  setBankSearch: (v: string) => void
  searchBanksFromBackend: (query: string) => Promise<void>
  banksLoading: boolean
  banks: Bank[]
  cardForm: CardForm
  errors: Record<string, string>
  cardValid: boolean
  setCard: (key: keyof CardForm, value: string) => void
  onBack: () => void
  onContinue: () => void
}

type TypeTileProps = {
  type: (typeof CARD_TYPES)[number]['value']
  current: string | null
  onSelect: (type: string) => void
  name: string
  meta: string
  icon: ReactNode
}

const BANK_LOGO_COLORS = ['#B82926', '#DC6B23', '#0027B6', '#DC0017', '#5C1E5C', '#0E7A46', '#0D4B8E'] as const

function TypeTile({ type, current, onSelect, name, meta, icon }: TypeTileProps) {
  const isSelected = current === type
  return (
    <label className={isSelected ? 'type-tile is-selected' : 'type-tile'} onClick={() => onSelect(type)}>
      <input type="radio" name="cardType" value={type} checked={isSelected} readOnly />
      <div className="type-tile-icon">{icon}</div>
      <div className="type-tile-name">{name}</div>
      <div className="type-tile-meta">{meta}</div>
    </label>
  )
}

export default function CardSelectionStep({
  bankSearch,
  setBankSearch,
  searchBanksFromBackend,
  banksLoading,
  banks,
  cardForm,
  errors,
  cardValid,
  setCard,
  onBack,
  onContinue,
}: Props) {
  const selectedProduct = CARD_PRODUCTS.find((p) => p.id === cardForm.productId)
  const [productSearch, setProductSearch] = useState('')
  const [showAllBanks, setShowAllBanks] = useState(!cardForm.bankId)
  const [showAllProducts, setShowAllProducts] = useState(!cardForm.productId)

  const selectedBank = banks.find((bank) => bank.bankId === cardForm.bankId)

  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase()
    if (!query) return banks
    return banks.filter((bank) => {
      const name = bank.bankDetails.name.toLowerCase()
      const code = bank.bankDetails.code.toLowerCase()
      return name.includes(query) || code.includes(query)
    })
  }, [banks, bankSearch])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return CARD_PRODUCTS
    return CARD_PRODUCTS.filter((product) => {
      return product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query)
    })
  }, [productSearch])

  useEffect(() => {
    if (!showAllBanks) return
    const query = bankSearch.trim()
    if (!query || filteredBanks.length > 0) return
    const timer = window.setTimeout(() => {
      void searchBanksFromBackend(query)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [bankSearch, filteredBanks.length, showAllBanks, searchBanksFromBackend])

  return (
    <section className="scr-main">
      <div className="container">
        <header className="page-head">
          <div>
            <h1 className="page-title">Choose a card</h1>
            <p className="page-sub">Select bank, product, and card type for card issuance.</p>
          </div>
        </header>

        <section className="card card-pad-lg">
          <div className="form-section-head">
            <h2 className="form-section-title">Issuing bank</h2>
          </div>
          {!showAllBanks && selectedBank ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="option-card is-selected">
                <input type="radio" name="bank" value={selectedBank.bankId} checked readOnly />
                <span className="check" />
                <div className="option-head">
                  <div className="option-logo" style={{ background: BANK_LOGO_COLORS[0], color: 'var(--cs-white)' }}>
                    {selectedBank.bankDetails.name.split(' ')[0].slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <div className="option-name">{selectedBank.bankDetails.name}</div>
                    <div className="option-meta">CBN: {selectedBank.bankDetails.code}</div>
                  </div>
                </div>
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAllBanks(true)}>
                Change bank
              </button>
            </div>
          ) : (
            <>
              <div className="field" style={{ marginTop: 10, marginBottom: 10 }}>
                <input
                  className="bch-input"
                  placeholder="Search bank name or code"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>
              <div className="option-grid">
                {banksLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="option-card" style={{ minHeight: 88, opacity: 0.5 }} />)
                ) : (
                  filteredBanks.map((b, idx) => {
                    const isSelected = cardForm.bankId === b.bankId
                    const logoColor = BANK_LOGO_COLORS[idx % BANK_LOGO_COLORS.length]
                    return (
                      <label
                        key={b.bankId}
                        className={isSelected ? 'option-card is-selected' : 'option-card'}
                        onClick={() => {
                          setCard('bankId', b.bankId)
                          setShowAllBanks(false)
                        }}
                      >
                        <input type="radio" name="bank" value={b.bankId} checked={isSelected} readOnly />
                        <span className="check" />
                        <div className="option-head">
                          <div className="option-logo" style={{ background: logoColor, color: 'var(--cs-white)' }}>
                            {b.bankDetails.name.split(' ')[0].slice(0, 4).toUpperCase()}
                          </div>
                          <div>
                            <div className="option-name">{b.bankDetails.name}</div>
                            <div className="option-meta">CBN: {b.bankDetails.code}</div>
                          </div>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </>
          )}
          {errors.bankId && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.bankId}</p>}
        </section>

        {cardForm.bankId && (
          <section className="card card-pad-lg" style={{ marginTop: 18 }}>
            <div className="form-section-head">
              <h2 className="form-section-title">Product</h2>
              <span className="form-section-meta">Pick a product variant</span>
            </div>
            {!showAllProducts && selectedProduct ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className="product-card is-selected">
                  <input type="radio" name="product" value={selectedProduct.id} checked readOnly />
                  <div className={`product-chip ${selectedProduct.code.toLowerCase().includes('usd') ? 'usd' : 'standard'}`}>
                    {selectedProduct.code.toUpperCase().includes('USD') ? 'USD' : 'NGN'}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{selectedProduct.name}</div>
                    <div className="product-meta">Code: {selectedProduct.code}</div>
                    <div className="product-fee">Configured fee/profile applies</div>
                  </div>
                  <span className="check" />
                </label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAllProducts(true)}>
                  Change product
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  className="bch-input"
                  placeholder="Search product name or code"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {filteredProducts.map((p) => {
                const isSelected = cardForm.productId === p.id
                const style = p.code.toLowerCase().includes('usd')
                  ? 'usd'
                  : p.code.toLowerCase().includes('plat')
                    ? 'platinum'
                    : p.code.toLowerCase().includes('gold')
                      ? 'gold'
                      : 'standard'
                return (
                  <label
                    key={p.id}
                    className={isSelected ? 'product-card is-selected' : 'product-card'}
                    onClick={() => {
                      setCard('productId', p.id)
                      setShowAllProducts(false)
                    }}
                  >
                    <input type="radio" name="product" value={p.id} checked={isSelected} readOnly />
                    <div className={`product-chip ${style}`}>{p.code.toUpperCase().includes('USD') ? 'USD' : 'NGN'}</div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">Code: {p.code}</div>
                      <div className="product-fee">Configured fee/profile applies</div>
                    </div>
                    <span className="check" />
                  </label>
                )
                })}
              </div>
            )}
            {errors.productId && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.productId}</p>}
          </section>
        )}

        {cardForm.productId && selectedProduct && (
          <section className="card card-pad-lg" style={{ marginTop: 18 }}>
            <div className="form-section-head">
              <h2 className="form-section-title">Card type</h2>
              <span className="form-section-meta">
                Virtual issues immediately; physical goes to bureau
              </span>
            </div>
            <div className="type-toggle">
              <TypeTile
                type="VIRTUAL"
                current={cardForm.cardType || null}
                onSelect={(type) => setCard('cardType', type)}
                name="Virtual"
                meta="Issued immediately. PAN, expiry, and CVV return in API response."
                icon={(
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                )}
              />
              <TypeTile
                type="PHYSICAL"
                current={cardForm.cardType || null}
                onSelect={(type) => setCard('cardType', type)}
                name="Physical"
                meta="Sent to personalization bureau and fulfilled after processing."
                icon={(
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="6" y1="14" x2="10" y2="14" /><line x1="6" y1="17" x2="8" y2="17" />
                  </svg>
                )}
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <span className="currency-pill">
                <CircleDollarSign />
                Currency: <span className="strong">{selectedProduct.code.toUpperCase().includes('USD') ? 'USD' : cardForm.currency || 'NGN'}</span> · auto-derived from product
              </span>
            </div>
            {errors.cardType && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.cardType}</p>}
          </section>
        )}

        <div className="form-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
            <ArrowLeft /> Back
          </button>
          <button type="button" className="btn btn-primary" onClick={onContinue} disabled={!cardValid}>
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
