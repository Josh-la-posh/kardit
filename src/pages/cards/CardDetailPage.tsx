import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useCard } from '@/hooks/useCards';
import { store } from '@/stores/mockStore';
import { Loader2, CreditCard, DollarSign, Calendar, User, Snowflake, Ban, Inbox } from 'lucide-react';
import { format } from 'date-fns';

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { card, isLoading } = useCard(cardId);

  if (isLoading) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout></ProtectedRoute>
    );
  }

  if (!card) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="text-center py-20 text-muted-foreground">Card not found.</div>
      </AppLayout></ProtectedRoute>
    );
  }

  const customer = store.getCustomer(card.customerId);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={card.maskedPan}
            subtitle={`${card.productName} • ${card.issuingBankName}`}
            actions={<StatusChip status={card.status as StatusType} />}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Summary */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm">{card.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold text-primary">
                      {card.currentBalance.toLocaleString('en-US', { style: 'currency', currency: card.currency })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{format(new Date(card.createdAt), 'PPP')}</p>
                  </div>
                </div>
                {customer && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <Link to={`/customers/${customer.id}`} className="text-sm text-secondary hover:underline">
                        {customer.firstName} {customer.lastName} ({customer.customerId})
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Actions</h3>
              <p className="text-sm text-muted-foreground">Status actions will be available in a future update.</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Snowflake className="h-4 w-4" /> Freeze / Unfreeze Card
                  <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Ban className="h-4 w-4" /> Block Card
                  <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Transactions Placeholder */}
          <div className="kardit-card mt-4 p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Transactions</h3>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Transaction history will be available in a future update.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
