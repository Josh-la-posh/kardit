import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip, type StatusType } from '@/components/ui/status-chip';
import { Activity, Calendar, ChevronLeft, CreditCard, Globe, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useBankAffiliates } from '@/hooks/useBankPortal';
import { useCustomer, useCustomerTransactions } from '@/hooks/useCustomers';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toTransactionStatus(status: string): StatusType {
  if (status === 'AUTHORIZED' || status === 'COMPLETED') return 'COMPLETED';
  if (status === 'REFUSED' || status === 'CANCELLED') return 'DECLINED';
  if (status === 'PENDING') return 'PENDING';
  return 'INFO';
}

export default function AffiliateCustomerDetailPage() {
  const { affiliateId, customerId } = useParams<{ affiliateId: string; customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { affiliates } = useBankAffiliates();
  const { customer, cards, isLoading: customerLoading, error: customerError } = useCustomer(customerId);
  const {
    transactions,
    total: transactionTotal,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useCustomerTransactions(customerId);

  const basePath = location.pathname.startsWith('/bank/active-affiliates')
    ? `/bank/active-affiliates/${affiliateId}`
    : `/bank/affiliates/${affiliateId}`;

  const affiliate = useMemo(
    () => affiliates.find((item) => item.affiliateId === affiliateId) || null,
    [affiliates, affiliateId]
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/customers`)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <PageHeader
              title={customer?.fullName || customerId || 'Customer'}
              subtitle={`${affiliate?.affiliateName || 'Affiliate'} customer`}
              showBack={false}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg p-6">
              <h3 className="mb-4 text-lg font-semibold">Customer Detail</h3>
              {customerLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : customerError || !customer ? (
                <div className="text-sm text-muted-foreground">{customerError || 'Customer detail unavailable.'}</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone || '-'}</span>
                  </div>
                  {customer.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(customer.dateOfBirth), 'PPP')}</span>
                    </div>
                  )}
                  {customer.address?.country && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.address.country}</span>
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
              )}
            </Card>

            <Card className="border-0 shadow-lg p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Cards</h3>
              </div>
              {customerLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : customerError && cards.length === 0 ? (
                <div className="text-sm text-muted-foreground">{customerError}</div>
              ) : cards.length === 0 ? (
                <div className="text-sm text-muted-foreground">No cards found for this customer.</div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="rounded-md border border-border bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{card.maskedPan}</p>
                          <p className="text-xs text-muted-foreground">{card.productName} - {card.id}</p>
                        </div>
                        <StatusChip status={card.status as StatusType} label={card.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created {format(new Date(card.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Transactions</h3>
              </div>
              <p className="text-sm text-muted-foreground">{transactionTotal} result(s)</p>
            </div>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactionsError ? (
              <div className="p-6 text-sm text-muted-foreground">{transactionsError}</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No transactions found for this customer.</div>
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
                        {/* <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{transaction.cardId}</td> */}
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
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
