import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { StatusChip, type StatusType } from '@/components/ui/status-chip';
import { useCustomer } from '@/hooks/useCustomers';

const customerStatusToChip: Record<string, StatusType> = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
};

const cardTypeToneMap: Record<string, string> = {
  VIRTUAL: 'border-info/30 bg-info/10 text-info',
  PHYSICAL: 'border-success/30 bg-success/10 text-success',
};

const kycToneMap: Record<string, string> = {
  LEVEL_1: 'border-warning/30 bg-warning/10 text-warning',
  LEVEL_2: 'border-info/30 bg-info/10 text-info',
  LEVEL_3: 'border-success/30 bg-success/10 text-success',
};

function formatKycLevel(kycLevel?: string) {
  return kycLevel ? kycLevel.replace('LEVEL_', 'Tier ') : '-';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function DetailGrid({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)]">
      <div className="border-b border-border/80 px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border/80">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2 px-6 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
            <p className="text-sm text-muted-foreground">{row.label}</p>
            <div className="text-sm font-medium text-foreground sm:text-right">{row.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customer, cards, isLoading, error } = useCustomer(customerId);

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
        <AppLayout>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !customer) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
        <AppLayout>
          <div className="py-20 text-center text-muted-foreground">{error || 'Customer not found.'}</div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const identityRows = [
    { label: 'Full name', value: customer.fullName },
    {
      label: 'Date of birth',
      value: customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'dd MMM yyyy') : '-',
    },
    {
      label: 'Mobile',
      value: customer.phone ? (
        <span className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {customer.phone}
        </span>
      ) : (
        '-'
      ),
    },
    {
      label: 'Email',
      value: customer.email ? (
        <span className="inline-flex items-center gap-2 break-all">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {customer.email}
        </span>
      ) : (
        '-'
      ),
    },
    {
      label: 'Address',
      value: customer.address ? (
        <span className="inline-flex items-start justify-end gap-2 text-right">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span>
            {[customer.address.line1, customer.address.city, customer.address.state, customer.address.country]
              .filter(Boolean)
              .join(', ')}
          </span>
        </span>
      ) : (
        '-'
      ),
    },
  ];

  const kycRows = [
    {
      label: 'KYC level',
      value: (
        <span
          className={[
            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
            kycToneMap[customer.kycLevel || ''] || 'border-border bg-muted/50 text-muted-foreground',
          ].join(' ')}
        >
          {formatKycLevel(customer.kycLevel)}
        </span>
      ),
    },
    { label: 'ID type', value: customer.idType || '-' },
    { label: 'ID number', value: customer.idNumber || '-' },
    {
      label: 'Verified at',
      value: customer.verifiedAt ? format(new Date(customer.verifiedAt), 'dd MMM yyyy') : '-',
    },
    // {
    //   label: 'Created',
    //   value: customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy') : '-',
    // },
  ];

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/customers')} className="gap-2 px-0">
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Button>

          <section className="rounded-[28px] border border-border/80 bg-card px-6 py-6 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)] sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(customer.fullName)}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{customer.fullName}</h1>
                    <span className="text-sm font-mono font-medium text-muted-foreground">
                      {customer.customerRefId}
                    </span>
                    <StatusChip
                      status={customerStatusToChip[customer.status] || 'INACTIVE'}
                      label={customer.status}
                      showIcon={false}
                    />
                    <span
                      className={[
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        kycToneMap[customer.kycLevel || ''] || 'border-border bg-muted/50 text-muted-foreground',
                      ].join(' ')}
                    >
                      {formatKycLevel(customer.kycLevel)}
                    </span>
                  </div>

                  {/* <p className="text-sm text-muted-foreground">
                    Captured {format(new Date(customer.createdAt), 'dd MMM yyyy')}
                  </p> */}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(`/customers/${customer.customerRefId}/cards/new`)}>
                  <CreditCard className="h-4 w-4" />
                  Issue new card
                </Button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailGrid title="Identity" rows={identityRows} />
            <DetailGrid title="KYC details" rows={kycRows} />
          </div>

          <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)]">
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">Cards</h2>
                <span className="text-sm text-muted-foreground">
                  {cards.length} linked
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.customerRefId}/cards/new`)}>
                <CreditCard className="h-4 w-4" />
                Issue card
              </Button>
            </div>

            {cards.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                No cards have been issued for this customer yet.
              </div>
            ) : (
              <div className="divide-y divide-border/80">
                {cards.map((card) => {
                  const cardType = card.productCode === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL';

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => navigate(`/cards/${card.id}`)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-background/40"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <CreditCard className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-mono font-semibold text-foreground">{card.maskedPan}</p>
                            <StatusChip status={card.status as StatusType} showIcon={false} />
                            <span
                              className={[
                                'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                                cardTypeToneMap[cardType] || 'border-border bg-muted/50 text-muted-foreground',
                              ].join(' ')}
                            >
                              {cardType}
                            </span>
                          </div>

                          <p className="text-sm text-foreground">
                            {card.productName} <span className="text-muted-foreground">. {card.issuingBankName}</span>
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(card.createdAt), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
