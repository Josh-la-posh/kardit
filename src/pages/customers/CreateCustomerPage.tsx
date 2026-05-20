import { Outlet, useLocation, Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CreateCustomerFlowProvider } from './create-customer-steps/CreateCustomerFlowContext'

type Step = { num: number; id: string; label: string; path: string }

const STEPS: Step[] = [
  { num: 1, id: 'customer', label: 'Customer', path: '/customers/create/customer' },
  { num: 2, id: 'card', label: 'Card', path: '/customers/create/card' },
  { num: 3, id: 'review', label: 'Review', path: '/customers/create/review' },
  { num: 4, id: 'result', label: 'Result', path: '/customers/create/result' },
]

function activeStepFromPath(pathname: string): number {
  const tail = pathname.replace(/^\/customers\/create\/?/, '')
  const i = STEPS.findIndex((s) => s.id === tail)
  return i >= 0 ? i + 1 : 0
}

export default function CreateCustomerPage() {
  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <CreateCustomerFlowProvider>
          <CreateCustomerFlowLayout />
        </CreateCustomerFlowProvider>
      </AppLayout>
    </ProtectedRoute>
  )
}

function HStepper({ activeStep }: { activeStep: number }) {
  if (activeStep === 0) return null

  return (
    <nav className="hstepper" aria-label="Create customer flow">
      {STEPS.map((s) => {
        const isActive = s.num === activeStep
        const isDone = s.num < activeStep
        const cls = ['hstep', isActive && 'is-active', isDone && 'is-done'].filter(Boolean).join(' ')
        const circle = isDone ? <Check /> : s.num
        return (
          <Link key={s.id} className={cls} to={s.path}>
            <span className="hstep__circle">{circle}</span>
            <span>{s.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function CreateCustomerFlowLayout() {
  const { pathname } = useLocation()
  const step = activeStepFromPath(pathname)

  return (
    <>
      <HStepper activeStep={step} />
      <Outlet />
    </>
  )
}
