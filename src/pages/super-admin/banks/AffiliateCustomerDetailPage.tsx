import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, CreditCard, List, Loader2, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatusChip, type StatusType } from '@/components/ui/status-chip';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import { useCustomer, useCustomerTransactions } from '@/hooks/useCustomers';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function toTransactionStatus(status: string): StatusType {
  if (status === 'AUTHORIZED' || status === 'COMPLETED') return 'COMPLETED';
  if (status === 'REFUSED' || status === 'CANCELLED') return 'DECLINED';
  if (status === 'PENDING') return 'PENDING';
  return 'INFO';
}

interface LocationState {
  bank?: BankQueryItem;
  affiliate?: AffiliateQueryItem;
}

function findBankById(items: BankQueryItem[], bankId: string) {
  return items.find((item) => item.bankId === bankId) || null;
}

function findAffiliateById(items: AffiliateQueryItem[], affiliateId: string) {
  return items.find((item) => item.affiliateId === affiliateId) || null;
}

export default function AffiliateCustomerDetailPage() {
  const { bankId, affiliateId, customerId } = useParams<{
    bankId: string;
    affiliateId: string;
    customerId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as LocationState | null;

  const [bankSummary, setBankSummary] = useState<BankQueryItem | null>(
    routeState?.bank?.bankId === bankId ? routeState.bank : null
  );
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateQueryItem | null>(
    routeState?.affiliate?.affiliateId === affiliateId ? routeState.affiliate : null
  );
  const [summaryLoading, setSummaryLoading] = useState(Boolean(bankId && affiliateId));
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { customer, cards, isLoading: customerLoading, error: customerError } = useCustomer(customerId);
  const {
    transactions,
    total: transactionsTotal,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useCustomerTransactions(customerId);

  const loadSummaries = useCallback(async () => {
    if (!bankId || !affiliateId) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError('Affiliate not found');
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const [bankSearchResponse, affiliateSearchResponse] = await Promise.all([
        queryBanks({
          filters: {
            search: bankId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
        queryAffiliates({
          filters: {
            bankId,
            search: affiliateId,
          },
          page: 1,
          pageSize: 25,
        }).catch(() => null),
      ]);

      let nextBank = findBankById(bankSearchResponse?.data || [], bankId);
      let nextAffiliate = findAffiliateById(affiliateSearchResponse?.data || [], affiliateId);

      if (!nextBank) {
        const fallbackBankResponse = await queryBanks({
          filters: {},
          page: 1,
          pageSize: 100,
        });
        nextBank = findBankById(fallbackBankResponse.data, bankId);
      }

      if (!nextAffiliate) {
        const fallbackAffiliateResponse = await queryAffiliates({
          filters: {
            bankId,
          },
          page: 1,
          pageSize: 100,
        });
        nextAffiliate = findAffiliateById(fallbackAffiliateResponse.data, affiliateId);
      }

      setBankSummary(nextBank);
      setAffiliateSummary(nextAffiliate);

      if (!nextBank || !nextAffiliate) {
        setSummaryError(!nextBank ? 'Bank not found' : 'Affiliate not found');
      }
    } catch (e) {
      setBankSummary(null);
      setAffiliateSummary(null);
      setSummaryError(e instanceof Error ? e.message : 'Failed to load customer details');
    } finally {
      setSummaryLoading(false);
    }
  }, [affiliateId, bankId]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const customerStatus = customer?.status || 'ACTIVE';
  const cardCount = cards.length;

  if (summaryLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <main className="scr-main">
            <div className="container">
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Loading customer profile...</div>
              </div>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!bankSummary || !affiliateSummary) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <main className="scr-main">
            <div className="container">
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Customer not available</div>
                <div className="empty-list-sub">
                  {summaryError || (!bankSummary ? 'Bank not found' : 'Affiliate not found')}
                </div>
                <Link to={`/super-admin/banks/${bankId || ''}/affiliates/${affiliateId || ''}/customers`} className="btn btn-primary">
                  <ArrowLeft /> Back to customers
                </Link>
              </div>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <Link to={`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`} className="back-link">
              <ArrowLeft /> Back to customers
            </Link>

            {customerLoading ? (
              <div className="empty-list profile-empty-card">
                <div className="empty-list-title">Loading customer profile...</div>
              </div>
            ) : customerError || !customer ? (
              <NotFound
                refValue={customerId}
                message={customerError}
                backHref={`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`}
              />
            ) : (
              <>
                <section className="profile-hero">
                  <div className="profile-avatar">{getInitials(customer.fullName)}</div>
                  <div className="profile-meta">
                    <div className="profile-name">{customer.fullName}</div>
                    <div className="profile-meta-row">
                      <span className="profile-ref">{customer.customerRefId}</span>
                      <StatusBadge status={customerStatus} />
                      <KycBadge level={customer.kycLevel || 'LEVEL_2'} />
                      <span>{bankSummary.bankName}</span>
                      <span>{affiliateSummary.legalName}</span>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`)}
                    >
                      <ArrowLeft /> Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}`)}
                    >
                      <CreditCard /> View affiliate
                    </button>
                  </div>
                </section>

                <div className="profile-two-col">
                  <div className="panel-card">
                    <div className="panel-head"><div className="panel-title">Identity</div></div>
                    <div className="panel-body">
                      <dl className="profile-specs">
                        <div><dt>Full name</dt><dd>{customer.fullName}</dd></div>
                        <div><dt>Reference</dt><dd className="mono">{customer.customerRefId}</dd></div>
                        <div><dt>Date of birth</dt><dd>{formatDate(customer.dateOfBirth)}</dd></div>
                        <div><dt>Status</dt><dd><StatusBadge status={customerStatus} /></dd></div>
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
                        <div><dt>Affiliate</dt><dd>{affiliateSummary.legalName}</dd></div>
                      </dl>
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-head"><div className="panel-title">KYC details</div></div>
                    <div className="panel-body">
                      <dl className="profile-specs">
                        <div><dt>KYC level</dt><dd><KycBadge level={customer.kycLevel || 'LEVEL_2'} /></dd></div>
                        <div><dt>ID type</dt><dd>{customer.idType || <span className="muted">not provided</span>}</dd></div>
                        <div><dt>ID number</dt><dd className="mono">{customer.idNumber || <span className="muted">not provided</span>}</dd></div>
                        <div><dt>Verified at</dt><dd>{customer.verifiedAt ? formatDate(customer.verifiedAt) : <span className="muted">pending</span>}</dd></div>
                        <div><dt>Bank</dt><dd>{bankSummary.bankName}</dd></div>
                        <div><dt>Tenant</dt><dd className="mono">{affiliateSummary.tenantId}</dd></div>
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
                  </div>
                  <div className="cards-list-body">
                    {cardCount === 0 ? (
                      <div className="cards-empty">No cards linked to this customer yet.</div>
                    ) : (
                      cards.map((card) => <CardRow key={card.id} card={card} />)
                    )}
                  </div>
                </div>

                <div className="cards-list-card" style={{ marginTop: 18 }}>
                  <div className="cards-list-head">
                    <div>
                      <span className="cards-list-title">Transactions</span>
                      <span className="cards-list-count">{transactionsTotal} linked</span>
                    </div>
                  </div>
                  <div className="cards-list-body">
                    {transactionsLoading ? (
                      <div className="empty-list">
                        <Loader2 className="spin" />
                        <div className="empty-list-title">Loading transactions...</div>
                      </div>
                    ) : transactionsError ? (
                      <div className="empty-list">
                        <div className="empty-list-title">Unable to load transactions</div>
                        <div className="empty-list-sub">{transactionsError}</div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="cards-empty">No transactions found for this customer.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data customers">
                          <thead>
                            <tr>
                              <th style={{ width: 180 }}>Transaction ID</th>
                              <th>Type</th>
                              <th>Merchant</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((transaction) => (
                              <tr key={transaction.transactionId}>
                                <td className="id">{transaction.transactionId}</td>
                                <td>{transaction.transactionType}</td>
                                <td>{transaction.merchantName || '-'}</td>
                                <td className="mono">{formatMoney(transaction.amount, transaction.currency)}</td>
                                <td><InlineStatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} /></td>
                                <td className="meta">{format(new Date(transaction.transactionDate), 'dd MMM yyyy HH:mm')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CardRow({ card }: { card: ReturnType<typeof useCustomer>['cards'][number] }) {
  const cardType = card.productCode === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL';
  const status = card.status as 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING';
  const thumbCls = status === 'FROZEN' ? 'frozen' : cardType === 'PHYSICAL' ? 'physical' : '';

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
        <button type="button" className="btn btn-ghost btn-sm">
          <Wallet /> Balance
        </button>
        <button type="button" className="btn btn-ghost btn-sm">
          <List /> Txns
        </button>
      </div>
    </div>
  );
}

function CardStatusBadge({ status }: { status: 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING' }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{status}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{status}</span>;
}

function KycBadge({ level }: { level: string }) {
  const value = level.replace('LEVEL_', '');
  return <span className={`kyc-pill lvl-${value}`}>Tier {value}</span>;
}

function InlineStatusChip({ status, label }: { status: StatusType; label: string }) {
  return <StatusChip status={status} label={label} className="align-middle" />;
}

function NotFound({ refValue, message, backHref }: { refValue: string | undefined; message?: string | null; backHref: string }) {
  return (
    <div className="empty-list profile-empty-card">
      <div className="empty-list-title">Customer not found</div>
      <div className="empty-list-sub">
        {message ? (
          message
        ) : refValue ? (
          <>No customer in this affiliate scope with reference <span className="mono profile-ref-inline">{refValue}</span>.</>
        ) : (
          'No customer reference was provided.'
        )}
      </div>
      <Link to={backHref} className="btn btn-primary">
        <ArrowLeft /> Back to customers
      </Link>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
