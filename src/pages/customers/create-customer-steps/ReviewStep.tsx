import { ArrowLeft, Edit2, Loader2, ShieldCheck, Zap } from 'lucide-react'

type Props = {
  fullName: string
  phone: string
  email: string
  state: string
  bvn: string
  customerId?: string
  bankName?: string
  bankCode?: string
  productName?: string
  productCode?: string
  cardType: string
  currency: string
  busy: boolean
  onBack: () => void
  onEditCustomer: () => void
  onEditCard: () => void
  onIssue: () => void
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export default function ReviewStep({
  fullName,
  phone,
  email,
  state,
  bvn,
  customerId,
  bankName,
  bankCode,
  productName,
  productCode,
  cardType,
  currency,
  busy,
  onBack,
  onEditCustomer,
  onEditCard,
  onIssue,
}: Props) {
  const requestId = customerId || 'REQ-PENDING'
  const idempotencyKey = customerId ? `idem-${customerId.slice(-12).toLowerCase()}` : 'idem-pending'
  return (
    <section className="scr-main">
      <div className="container">
        <header className="page-head">
          <div>
            <h1 className="page-title">Review & confirm</h1>
            <p className="page-sub">
              Check the customer payload and card selection. On <strong>Issue card</strong> we post a single request to persist customer + card.
            </p>
          </div>
        </header>

        <div className="idempotency-strip">
          <ShieldCheck />
          <div>
            Request <span className="key">{requestId}</span> · Idempotency key <span className="key">{idempotencyKey}</span> - same key replayed returns the same outcome.
          </div>
        </div>

        <div className="review-grid">
          <div className="review-panel">
            <div className="review-head">
              <span className="review-title">Customer</span>
              {/* <button type="button" className="review-edit" onClick={onEditCustomer}>
                <Edit2 /> Edit
              </button> */}
            </div>
            <div className="review-body">
              <dl className="profile-specs">
                <div><dt>Full name</dt><dd>{fullName || '-'}</dd></div>
                <div><dt>Customer ID</dt><dd className="mono">{customerId || '-'}</dd></div>
                <div><dt>Mobile</dt><dd className="mono">{phone || '-'}</dd></div>
                <div><dt>Email</dt><dd>{email || <span className="muted">not provided</span>}</dd></div>
                <div><dt>BVN</dt><dd className="mono">{bvn || '-'}</dd></div>
                <div><dt>State</dt><dd>{state || '-'}</dd></div>
              </dl>
            </div>
          </div>

          <div className="review-panel">
            <div className="review-head">
              <span className="review-title">Card</span>
              <button type="button" className="review-edit" onClick={onEditCard}>
                <Edit2 /> Edit
              </button>
            </div>
            <div className="review-body">
              <dl className="profile-specs">
                <div>
                  <dt>Issuing bank</dt>
                  <dd>
                    {bankName || '-'}
                    <br />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--cs-ink-100)' }}>{bankCode || '-'}</span>
                  </dd>
                </div>
                <div>
                  <dt>Product</dt>
                  <dd>
                    {productName || '-'}
                    <br />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--cs-ink-100)' }}>{productCode || '-'}</span>
                  </dd>
                </div>
                <div><dt>Card type</dt><dd>{cardType ? cardType.charAt(0) + cardType.slice(1).toLowerCase() : '-'}</dd></div>
                <div><dt>Currency</dt><dd>{currency || 'NGN'}</dd></div>
              </dl>
            </div>
          </div>
        </div>

        <div className="notice info" style={{ marginTop: 18 }}>
          <InfoIcon />
          <div>
            <span className="strong">What happens on submit.</span>{' '}
            Platform persists the customer/card outcome and provisions a linked virtual account for funding.
          </div>
        </div>

        <div className="form-foot" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
            <ArrowLeft /> Back
          </button>
          <button type="button" onClick={onIssue} disabled={busy} className="btn btn-primary btn-lg">
            {busy ? (<><Loader2 className="spin" /> Issuing card...</>) : (<><Zap /> Issue card</>)}
          </button>
        </div>
      </div>
    </section>
  )
}
