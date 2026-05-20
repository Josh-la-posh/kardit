import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CARD_PRODUCTS } from '@/stores/mockStore'

const CARD_TYPES = [
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'PHYSICAL', label: 'Physical' },
]

type CardForm = { bankId: string; productId: string; cardType: string; currency: string }
type Bank = { bankId: string; bankDetails: { name: string; code: string } }

type Props = {
  bankSearch: string
  setBankSearch: (v: string) => void
  banksLoading: boolean
  banks: Bank[]
  cardForm: CardForm
  errors: Record<string, string>
  cardValid: boolean
  setCard: (key: keyof CardForm, value: string) => void
  onBack: () => void
  onContinue: () => void
}

export default function CardSelectionStep({ bankSearch, setBankSearch, banksLoading, banks, cardForm, errors, cardValid, setCard, onBack, onContinue }: Props) {
  return (
    <section className="rounded-2xl border bg-card p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Choose a card</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Search issuing bank</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} placeholder="Search banks..." className="h-11 w-full rounded-md border bg-background pl-9 pr-3 text-sm" />
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border p-2">
        {banksLoading ? (
          <div className="space-y-2 p-2">{Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="h-12 animate-pulse rounded-md bg-muted" />)}</div>
        ) : (
          banks.map((bank) => {
            const active = cardForm.bankId === bank.bankId
            return (
              <button type="button" key={bank.bankId} onClick={() => setCard('bankId', bank.bankId)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${active ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div>
                  <p className="font-medium">{bank.bankDetails.name}</p>
                  <p className="text-xs text-muted-foreground">CBN: {bank.bankDetails.code}</p>
                </div>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            )
          })
        )}
      </div>
      {errors.bankId && <p className="text-xs text-destructive">{errors.bankId}</p>}

      {cardForm.bankId && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Select product</label>
          {CARD_PRODUCTS.map((product) => {
            const active = cardForm.productId === product.id
            return (
              <button type="button" key={product.id} onClick={() => setCard('productId', product.id)} className={`w-full rounded-lg border px-4 py-3 text-left ${active ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.code}</p>
              </button>
            )
          })}
          {errors.productId && <p className="text-xs text-destructive">{errors.productId}</p>}
        </div>
      )}

      {cardForm.productId && (
        <div className="grid gap-3 md:grid-cols-2">
          {CARD_TYPES.map((type) => {
            const active = cardForm.cardType === type.value
            return (
              <button type="button" key={type.value} onClick={() => setCard('cardType', type.value)} className={`rounded-lg border p-4 text-left ${active ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="font-semibold">{type.label}</p>
              </button>
            )
          })}
        </div>
      )}
      {errors.cardType && <p className="text-xs text-destructive">{errors.cardType}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={onContinue} disabled={!cardValid}>Continue <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </section>
  )
}


