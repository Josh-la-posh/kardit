import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Edit2, List, Plus, Snowflake, Sun, UserX, Wallet } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useCustomer } from '@/hooks/useCustomers'

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customer, cards, isLoading, error } = useCustomer(customerId)

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
              <Profile customer={customer} cards={cards} />
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function Profile({ customer, cards }: { customer: NonNullable<ReturnType<typeof useCustomer>['customer']>; cards: ReturnType<typeof useCustomer>['cards'] }) {
  const cardCount = cards.length
  const fullName = customer.fullName
  const issueLink = `/customers/${encodeURIComponent(customer.customerRefId)}/cards/new`

  return (
    <>
      <section className="profile-hero">
        <div className="profile-avatar">{getInitials(fullName)}</div>
        <div className="profile-meta">
          <div className="profile-name">{fullName}</div>
          <div className="profile-meta-row">
            <span className="profile-ref">{customer.customerRefId}</span>
            <StatusBadge status={customer.status} />
            <KycBadge level={customer.kycLevel || 'LEVEL_2'} />
            <span>Captured {formatDate(customer.dateOfBirth)}</span>
          </div>
        </div>
        <div className="profile-actions">
          <a
            href="#edit"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.preventDefault()
              window.alert('Editing happens in the capture flow - not from this view.')
            }}
          >
            <Edit2 /> Edit
          </a>
          <Link to={issueLink} className="btn btn-primary">
            <CreditCard /> Issue new card
          </Link>
        </div>
      </section>

      <div className="profile-two-col">
        <div className="panel-card">
          <div className="panel-head"><div className="panel-title">Identity</div></div>
          <div className="panel-body">
            <dl className="profile-specs">
              <div><dt>Title</dt><dd>-</dd></div>
              <div><dt>Full name</dt><dd>{fullName}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(customer.dateOfBirth)}</dd></div>
              <div><dt>Gender</dt><dd>-</dd></div>
              <div><dt>Nationality</dt><dd>-</dd></div>
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
        </div>

        <div className="panel-card">
          <div className="panel-head"><div className="panel-title">KYC details</div></div>
          <div className="panel-body">
            <dl className="profile-specs">
              <div><dt>KYC level</dt><dd><KycBadge level={customer.kycLevel || 'LEVEL_2'} /></dd></div>
              <div><dt>BVN</dt><dd className="mono">{customer.idNumber || '-'}</dd></div>
              <div><dt>NIN</dt><dd className="mono"><span className="muted">not provided</span></dd></div>
              <div><dt>Secondary ID</dt><dd>{customer.idType || <span className="muted">not provided</span>}</dd></div>
              <div><dt>Verified at</dt><dd>{customer.verifiedAt ? formatDate(customer.verifiedAt) : <span className="muted">pending</span>}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(customer.dateOfBirth)}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div className="cards-list-card">
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
          {cardCount === 0 ? (
            <div className="cards-empty">
              No cards linked to this customer yet.{' '}
              <Link to={issueLink} className="cta-link">Issue the first card -&gt;</Link>
            </div>
          ) : (
            cards.map((card) => <CardRow key={card.id} card={card} />)
          )}
        </div>
      </div>
    </>
  )
}

function CardRow({ card }: { card: ReturnType<typeof useCustomer>['cards'][number] }) {
  const cardType = card.productCode === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL'
  const status = card.status as 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING'
  const thumbCls = status === 'FROZEN' ? 'frozen' : cardType === 'PHYSICAL' ? 'physical' : ''

  return (
    <div className="card-row">
      <div className={`card-thumb ${thumbCls}`}>VERVE</div>
      <div className="card-body">
        <div className="card-head-row">
          <span className="card-id">{card.id}</span>
          <CardStatusBadge status={status} />
          <span className={`kyc-pill lvl-${cardType === 'VIRTUAL' ? '2' : '3'}`}>{cardType}</span>
        </div>
        <div className="card-product">{card.productName} · {card.issuingBankName}</div>
        <div className="card-meta">
          <span className="card-pan">{card.maskedPan}</span> · created {formatDate(card.createdAt)}
        </div>
      </div>
      <div className="card-actions">
        <Link to={`/cards/${encodeURIComponent(card.id)}`} className="btn btn-ghost btn-sm">
          <Wallet /> Balance
        </Link>
        <a
          href="#txns"
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.preventDefault()
            window.alert('Transactions - coming later.')
          }}
        >
          <List /> Txns
        </a>
        {status === 'ACTIVE' && (
          <a
            href="#freeze"
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.preventDefault()
              window.alert('Freeze flow - coming later.')
            }}
          >
            <Snowflake /> Freeze
          </a>
        )}
        {status === 'FROZEN' && (
          <a
            href="#unfreeze"
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.preventDefault()
              window.alert('Unfreeze flow - coming later.')
            }}
          >
            <Sun /> Unfreeze
          </a>
        )}
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
