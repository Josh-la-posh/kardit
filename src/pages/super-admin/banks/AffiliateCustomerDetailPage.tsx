import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, ArrowLeft, Calendar, CreditCard, Globe, Loader2, Mail, MapPin, Phone, User } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { store } from '@/stores/mockStore';
import { getCustomerTransactions } from '@/services/transactionApi';
import type { CustomerTransactionsResponse } from '@/types/transactionContracts';

const customerStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
  REJECTED: 'FAILED',
  BLOCKED: 'WARNING',
};

function formatMoney(value: number | undefined, currency = 'NGN') {
  if (value === undefined) return '-';
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

export default function AffiliateCustomerDetailPage() {
  const { bankId, affiliateId, customerId } = useParams<{
    bankId: string;
    affiliateId: string;
    customerId: string;
  }>();
  const navigate = useNavigate();

  const bank = bankId ? store.getPlatformBank(bankId) : null;
  const affiliate = affiliateId ? store.getPlatformAffiliate(affiliateId) : null;
  const customers = useMemo(() => (affiliateId ? store.getAffiliateCustomers(affiliateId) : []), [affiliateId]);
  const customer = useMemo(
    () => customers.find((item) => item.customerId === customerId || item.id === customerId) || null,
    [customerId, customers]
  );

  const [transactions, setTransactions] = useState<CustomerTransactionsResponse['data']>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer?.customerId) {
      setTransactions([]);
      setTransactionsTotal(0);
      setTransactionsLoading(false);
      return;
    }

    let active = true;
    setTransactionsLoading(true);
    setTransactionsError(null);

    getCustomerTransactions(customer.customerId)
      .then((response) => {
        if (!active) return;
        setTransactions(response.data);
        setTransactionsTotal(response.total);
      })
      .catch((error) => {
        if (!active) return;
        setTransactions([]);
        setTransactionsTotal(0);
        setTransactionsError(error instanceof Error ? error.message : 'Unable to load customer transactions');
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customer?.customerId]);

  const storeCards = useMemo(() => {
    if (!customer) return [];
    return store.getCardsByCustomer(customer.id, customer.tenantId);
  }, [customer]);

  const transactionCardIds = useMemo(
    () => [...new Set(transactions.map((transaction) => transaction.cardId).filter(Boolean))],
    [transactions]
  );

  if (!bank || !affiliate || !customer) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20 text-muted-foreground">
            {!bank ? 'Bank not found' : !affiliate ? 'Affiliate not found' : 'Customer not found'}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <PageHeader
            title={`${customer.firstName} ${customer.lastName}`}
            subtitle={customer.customerId}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={customerStatusToChip[customer.status] || 'INACTIVE'} label={customer.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
                </Button>
              </div>
            }
          />

          <div className="mb-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate('/super-admin/banks')}>
              Banks
            </span>
            <span className="mx-2">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate(`/super-admin/banks/${bankId}`)}>
              {bank.name}
            </span>
            <span className="mx-2">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}`)}>
              {affiliate.name}
            </span>
            <span className="mx-2">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate(`/super-admin/banks/${bankId}/affiliates/${affiliateId}/customers`)}>
              Customers
            </span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{customer.customerId}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="kardit-card space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer Detail</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.firstName} {customer.lastName}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(customer.dateOfBirth), 'PPP')}</span>
                  </div>
                )}
                {customer.nationality && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.nationality}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[customer.address.line1, customer.address.city, customer.address.state, customer.address.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="kardit-card space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Identity</h3>
              <div className="space-y-2 rounded-md border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Emboss Name</span>
                  <span className="text-sm font-medium text-right">{customer.embossName || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">ID Type</span>
                  <span className="text-sm font-medium">{customer.idType || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">ID Number</span>
                  <span className="text-sm font-medium">{customer.idNumber || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">{format(new Date(customer.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="kardit-card mt-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Card Details</h3>
            </div>
            {storeCards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issuing Bank</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {storeCards.map((card, index) => (
                      <tr key={card.id} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm font-mono">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm">{card.productName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.issuingBankName}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">{formatMoney(card.currentBalance, card.currency)}</td>
                        <td className="px-4 py-3"><StatusChip status={card.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(card.createdAt), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : transactionCardIds.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {/* <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactionCardIds.map((cardId, index) => (
                      <tr key={cardId} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        {/* <td className="px-4 py-3 text-sm font-mono">{cardId}</td> */}
                        <td className="px-4 py-3 text-sm text-muted-foreground">Linked transaction history</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No card details found for this customer.</div>
            )}
          </div>

          <div className="kardit-card mt-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Transactions</h3>
              </div>
              <span className="text-sm text-muted-foreground">{transactionsTotal} total</span>
            </div>
            {transactionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactionsError ? (
              <div className="p-6 text-center text-sm text-muted-foreground">{transactionsError}</div>
            ) : transactions.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No transactions found for this customer.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction, index) => (
                      <tr key={transaction.transactionId} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-3 text-sm font-mono text-primary">{transaction.transactionId}</td>
                        {/* <td className="px-4 py-3 text-sm font-mono">{transaction.cardId}</td> */}
                        <td className="px-4 py-3 text-sm">{transaction.transactionType}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">{formatMoney(transaction.amount, transaction.currency)}</td>
                        <td className="px-4 py-3">
                          <StatusChip status={toTransactionStatus(transaction.status)} label={transaction.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.merchantName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(transaction.transactionDate), 'MMM d, yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
