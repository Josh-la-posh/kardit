import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, CreditCard, Edit2, Eye, Plus, UserX } from 'lucide-react'
import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppCard } from '@/components/ui/app-card'
import { useCards } from '@/hooks/useCards'
import { useCustomer } from '@/hooks/useCustomers'

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customer, isLoading, error } = useCustomer(customerId)
  const {
    cards,
    isLoading: cardsLoading,
    error: cardsError,
  } = useCards({
    customerId: customer?.customerRefId,
    pageSize: 100,
    enabled: Boolean(customer?.customerRefId),
  })

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <Link to="/customers" className="back-link">
              <ArrowLeft /> Back to customers
            </Link>
            {isLoading ? (
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Loading customer profile...</div>
              </div>
            ) : error || !customer ? (
              <NotFound refValue={customerId} message={error} />
            ) : (
              <Profile customer={customer} cards={cards} cardsLoading={cardsLoading} cardsError={cardsError} />
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function Profile({
  customer,
  cards,
  cardsLoading,
  cardsError,
}: {
  customer: NonNullable<ReturnType<typeof useCustomer>['customer']>;
  cards: ReturnType<typeof useCards>['cards'];
  cardsLoading: boolean;
  cardsError: string | null;
}) {
  const cardCount = cards.length
  const fullName = customer.fullName
  const issueLink = `/customers/${encodeURIComponent(customer.customerRefId)}/cards/new`

  return (
    <>
      <section className="profile-hero">
        <div className="profile-avatar">{getInitials(fullName)}</div>
        <div className="">
          <div className="profile-name">{fullName}</div>
          <div className="profile-meta-row">
            <span className="profile-ref">{customer.email}</span>
            <StatusBadge status={customer.status} />
            <KycBadge level={customer.kycLevel || 'LEVEL_2'} />
            {/* <span>Captured {formatDate(customer.dateOfBirth)}</span> */}
          </div>
        </div>
        <div className="profile-actions">
          {/* <a
            href="#edit"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.preventDefault()
              window.alert('Editing happens in the capture flow - not from this view.')
            }}
          >
            <Edit2 /> Edit
          </a> */}
          <Link to={issueLink} className="btn btn-primary">
            <CreditCard /> Issue new card
          </Link>
        </div>
      </section>

      <div className="profile-two-col">
        <AppCard className="panel-card">
          <div className="panel-head"><div className="panel-title">Identity</div></div>
          <div className="panel-body">
            <dl className="profile-specs">
              {/* <div><dt>Title</dt><dd>-</dd></div> */}
              <div><dt>Full name</dt><dd>{fullName}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(customer.dateOfBirth)}</dd></div>
              {/* <div><dt>Gender</dt><dd>-</dd></div> */}
              {/* <div><dt>Nationality</dt><dd>-</dd></div> */}
              <div><dt>Mobile</dt><dd className="mono">{customer.phone || '-'}</dd></div>
              <div><dt>Email</dt><dd>{customer.email || <span className="muted">not provided</span>}</dd></div>
              <div>
                <dt>Address</dt>
                <dd>
                  {customer.address
                    ? [customer.address.line1, customer.address.city, customer.address.state, customer.address.country].filter(Boolean).join(', ')
                    : <span className="muted">not provided</span>}
                </dd>
              </div>
            </dl>
          </div>
        </AppCard>

        <AppCard className="panel-card">
          <div className="panel-head"><div className="panel-title">KYC details</div></div>
          <div className="panel-body">
            <dl className="profile-specs">
              <div><dt>KYC level</dt><dd><KycBadge level={customer.kycLevel || 'LEVEL_2'} /></dd></div>
              {/* <div><dt>BVN</dt><dd className="mono">{customer.idNumber || '-'}</dd></div> */}
              <div><dt>ID type</dt><dd>{customer.idType || <span className="muted">-</span>}</dd></div>
              <div><dt>ID number</dt><dd className="mono"><span className="muted">{customer.idNumber || <span className="muted">-</span>}</span></dd></div>
              <div><dt>Verified at</dt><dd>{customer.verifiedAt ? formatDate(customer.verifiedAt) : <span className="muted">pending</span>}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(customer.dateOfBirth)}</dd></div>
            </dl>
          </div>
        </AppCard>
      </div>

      <AppCard className="cards-list-card">
        <div className="cards-list-head">
          <div>
            <span className="cards-list-title">Cards</span>
            <span className="cards-list-count">{cardCount} linked</span>
          </div>
          {cardCount > 0 && (
            <Link to={issueLink} className="btn btn-secondary btn-sm">
              <Plus /> Issue card
            </Link>
          )}
        </div>
        <div className="cards-list-body">
          {cardsLoading ? (
            <div className="cards-empty">Loading cards...</div>
          ) : cardsError ? (
            <div className="cards-empty">{cardsError}</div>
          ) : cardCount === 0 ? (
            <div className="cards-empty">
              No cards linked to this customer yet.{' '}
              <Link to={issueLink} className="cta-link">Issue the first card -&gt;</Link>
            </div>
          ) : (
            cards.map((card) => <CardRow key={card.id} card={card} />)
          )}
        </div>
      </AppCard>
    </>
  )
}

function CardRow({ card }: { card: ReturnType<typeof useCards>['cards'][number] }) {
  const [copied, setCopied] = useState(false)
  const cardType = card.productCode === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL'
  const status = card.status as 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING'
  const thumbCls = status === 'FROZEN' ? 'frozen' : cardType === 'PHYSICAL' ? 'physical' : ''

  async function handleCopyCardId() {
    try {
      await navigator.clipboard.writeText(card.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy card ID', card.id)
    }
  }

  return (
    <div>
      <div className="card-row">
        <div className={`card-thumb ${thumbCls}`}>UnionPay</div>
        <div className="card-body">
          <div className="card-head-row">
            <span className="card-id">{card.issuingBankName}</span>
            <CardStatusBadge status={status} />
            <span className={`kyc-pill lvl-${cardType === 'VIRTUAL' ? '2' : '3'}`}>{cardType}</span>
          </div>
          <div className="card-meta">
            <span className="card-pan">{card.id}</span>
          </div>
          <div className="card-product">{card.productName}</div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="card-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopyCardId}>
              <Copy /> {copied ? 'Copied' : 'Copy'}
            </button>
            <Link to={`/cards/${encodeURIComponent(card.id)}`} className="btn btn-ghost btn-sm">
              <Eye /> Details
            </Link>
          </div>          
          <div className="card-meta">
            created {formatDate(card.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardStatusBadge({ status }: { status: 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING' }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
}

function KycBadge({ level }: { level: string }) {
  const n = level.replace('LEVEL_', '')
  return <span className={`kyc-pill lvl-${n}`}>Tier {n}</span>
}

function NotFound({ refValue, message }: { refValue: string | undefined; message?: string | null }) {
  return (
    <div className="empty-list profile-empty-card">
      <UserX />
      <div className="empty-list-title">Customer not found</div>
      <div className="empty-list-sub">
        {message ? (
          message
        ) : refValue ? (
          <>No customer in your tenant scope with reference <span className="mono profile-ref-inline">{refValue}</span>.</>
        ) : (
          'No customer reference was provided.'
        )}
        <br />
        It may belong to a different tenant or have been removed - you only see customers in your scope.
      </div>
      <Link to="/customers" className="btn btn-primary">
        <ArrowLeft /> Back to customers
      </Link>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
