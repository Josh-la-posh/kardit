import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <section className="rounded-2xl border bg-card p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Review &amp; confirm</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <p className="font-semibold">Customer</p>
          <p className="text-sm">{fullName || '-'}</p>
          <p className="text-sm">{phone || '-'}</p>
          <p className="text-sm">{email || '-'}</p>
          <p className="text-sm">{line1}, {city}, {state}</p>
        </div>
        <div className="rounded-xl border p-4 space-y-2">
          <p className="font-semibold">Card</p>
          <p className="text-sm">Bank: {bankName || '-'}</p>
          <p className="text-sm">Product: {productName || '-'}</p>
          <p className="text-sm">Card type: {cardType || '-'}</p>
          <p className="text-sm">Currency: {currency}</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={onIssue} disabled={busy}>{busy ? 'Issuing...' : 'Issue card'}</Button>
      </div>
    </section>
  )
}
