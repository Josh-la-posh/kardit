import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useCustomer } from '@/hooks/useCustomers'
import unionPayLogo from '@/assets/UnionPay_logo.png'

type WarmCustomer = {
  fullName: string
  customerRefId: string
}

const RESUME_KEY = 'kardit_issue_card_resume_customer'

export default function CardIssueStartPage() {
  const [params] = useSearchParams()
  const customerId = params.get('customerId')
  const { customer } = useCustomer(customerId || undefined)
  const [resumeCustomer, setResumeCustomer] = useState<WarmCustomer | null>(null)

  const warm = useMemo(() => {
    if (!customerId || !customer) return null
    return {
      fullName: customer.fullName,
      customerRefId: customer.customerRefId,
    }
  }, [customerId, customer])

  useEffect(() => {
    if (warm) {
      window.sessionStorage.setItem(RESUME_KEY, JSON.stringify(warm))
      setResumeCustomer(warm)
      return
    }
    const raw = window.sessionStorage.getItem(RESUME_KEY)
    if (!raw) {
      setResumeCustomer(null)
      return
    }
    try {
      const parsed = JSON.parse(raw) as WarmCustomer
      if (parsed?.customerRefId && parsed?.fullName) {
        setResumeCustomer(parsed)
      }
    } catch {
      setResumeCustomer(null)
    }
  }, [warm])

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <section className="iss-hero">
              <div className="iss-hero-body">
                <div className="iss-hero-eyebrow">Unified issuance</div>
                <h1 className="iss-hero-title">Issue a card</h1>
                <p className="iss-hero-sub">
                  Capture customer details and issue their first card in one continuous flow.
                  Customer record and card are persisted as one issuance outcome, and a virtual
                  account is auto-provisioned for funding.
                </p>

                {warm ? (
                  <div className="iss-warm-banner">
                    <div className="av">{initials(warm.fullName)}</div>
                    <div className="body">
                      <div className="ttl">Issuing card for <span>{warm.fullName}</span></div>
                      <div className="mta">
                        Customer reference <span>{warm.customerRefId}</span> - skipping capture
                      </div>
                    </div>
                    <Link to={`/customers/${encodeURIComponent(warm.customerRefId)}/cards/new`} className="btn btn-primary">
                      Continue to card selection <ArrowRight />
                    </Link>
                  </div>
                ) : (
                  <div className="iss-hero-cta">
                    <Link to="/customers/create" className="btn btn-primary btn-lg">
                      <UserPlus /> Create Customer &amp; Issue Card
                    </Link>
                    <Link to="/customers" className="btn btn-ghost">
                      Existing customer
                    </Link>
                  </div>
                )}
              </div>
              <div> <img src={unionPayLogo} alt="UnionPay" /> </div>
            </section>

            <div className="notice info" style={{ marginTop: 24 }}>
              <InfoIcon />
              <div>
                <span className="strong">How it works.</span>{' '}
                Six screens: capture customer, pick bank &amp; product, choose virtual or physical,
                confirm delivery (physical only), review, and issue. An idempotency key prevents
                duplicate issuance on retry.
              </div>
            </div>

            {resumeCustomer && !warm && (
              <div className="notice info" style={{ marginTop: 12 }}>
                <InfoIcon />
                <div>
                  Resuming session for <strong>{resumeCustomer.fullName}</strong> ({resumeCustomer.customerRefId}).{' '}
                  <Link to={`/customers/${encodeURIComponent(resumeCustomer.customerRefId)}/cards/new`}>Continue -&gt;</Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
