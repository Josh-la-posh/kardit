import { Check } from 'lucide-react'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'

type Props = {
  customerId?: string
  cardId?: string
  onGoCustomers: () => void
  onGoCards: () => void
}

export default function ResultStep({ customerId, cardId, onGoCustomers, onGoCards }: Props) {
  return (
    <section className="scr-main">
      <div className="container container--narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">All set</h1>
            <p className="page-sub">Customer and card have been created successfully.</p>
          </div>
        </header>

        <AppCard padded="lg">
          <AppCardHeader style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', justifyItems: 'center', width: '100%' }}>
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-primary/30 text-primary">
                <Check className="h-8 w-8" />
              </div>
              <AppCardTitle>Issuance complete</AppCardTitle>
              <AppCardSub>You can continue to customer records or inspect cards.</AppCardSub>
            </div>
          </AppCardHeader>

          <div className="card-pad-lg">
            <div className="mx-auto w-full max-w-lg rounded-xl border p-4 text-left">
              <p className="text-sm">Customer ID: <span className="font-medium">{customerId}</span></p>
              <p className="text-sm">Card ID: <span className="font-medium">{cardId}</span></p>
            </div>
            <div className="form-foot" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onGoCustomers}>Go to customers</button>
              <button type="button" className="btn btn-primary" onClick={onGoCards}>Go to cards</button>
            </div>
          </div>
        </AppCard>
      </div>
    </section>
  )
}
