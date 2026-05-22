import { ArrowLeft } from 'lucide-react'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'

type Props = {
  fullName: string
  phone: string
  email: string
  line1: string
  city: string
  state: string
  bankName?: string
  productName?: string
  cardType: string
  currency: string
  busy: boolean
  onBack: () => void
  onIssue: () => void
}

export default function ReviewStep({ fullName, phone, email, line1, city, state, bankName, productName, cardType, currency, busy, onBack, onIssue }: Props) {
  return (
    <section className="scr-main">
      <div className="container container--narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">Review and confirm</h1>
            <p className="page-sub">Confirm customer and card selections before issuing.</p>
          </div>
        </header>

        <AppCard padded="lg">
          <AppCardHeader style={{ marginBottom: 12 }}>
            <div>
              <AppCardTitle>Issuance summary</AppCardTitle>
              <AppCardSub>Please verify all details before submitting to card issuance.</AppCardSub>
            </div>
          </AppCardHeader>

          <div className="card-pad-lg">
            <div className="grid gap-6 md:grid-cols-2">
              <section className="form-section" style={{ marginTop: 0 }}>
                <div className="form-section-head">
                  <h2 className="form-section-title">Customer</h2>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-sm">{fullName || '-'}</p>
                  <p className="text-sm">{phone || '-'}</p>
                  <p className="text-sm">{email || '-'}</p>
                  <p className="text-sm">{line1}, {city}, {state}</p>
                </div>
              </section>
              <section className="form-section" style={{ marginTop: 0 }}>
                <div className="form-section-head">
                  <h2 className="form-section-title">Card</h2>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-sm">Bank: {bankName || '-'}</p>
                  <p className="text-sm">Product: {productName || '-'}</p>
                  <p className="text-sm">Card type: {cardType || '-'}</p>
                  <p className="text-sm">Currency: {currency}</p>
                </div>
              </section>
            </div>

            <div className="form-foot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="button" className="btn btn-primary" onClick={onIssue} disabled={busy}>
                {busy ? 'Issuing...' : 'Issue card'}
              </button>
            </div>
          </div>
        </AppCard>
      </div>
    </section>
  )
}
