import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  customerId?: string
  cardId?: string
  onGoCustomers: () => void
  onGoCards: () => void
}

export default function ResultStep({ customerId, cardId, onGoCustomers, onGoCards }: Props) {
  return (
    <section className="rounded-2xl border bg-card p-10 text-center space-y-4">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-primary/30 text-primary">
        <Check className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-semibold">All set</h1>
      <p className="text-muted-foreground">Customer and card were created successfully.</p>
      <div className="mx-auto w-full max-w-lg rounded-xl border p-4 text-left">
        <p className="text-sm">Customer ID: <span className="font-medium">{customerId}</span></p>
        <p className="text-sm">Card ID: <span className="font-medium">{cardId}</span></p>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onGoCustomers}>Go to customers</Button>
        <Button onClick={onGoCards}>Go to cards</Button>
      </div>
    </section>
  )
}
