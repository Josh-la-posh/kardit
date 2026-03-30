import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, CreditCard, FileText, Globe, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, type StatusType } from '@/components/ui/status-chip';
import { useCustomer } from '@/hooks/useCustomers';

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customer, kycDocuments, cards, isLoading, error } = useCustomer(customerId);

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

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={customer.fullName}
            subtitle={customer.customerRefId}
            actions={
              <Button onClick={() => navigate(`/customers/${customer.customerRefId}/cards/new`)}>
                <CreditCard className="h-4 w-4" /> Issue Additional Card
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="kardit-card space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overview</h3>
              <div className="space-y-3">
                {customer.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.email}</span></div>}
                {customer.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.phone}</span></div>}
                {customer.dateOfBirth && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{format(new Date(customer.dateOfBirth), 'PPP')}</span></div>}
                {customer.address?.country && <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.address.country}</span></div>}
                {customer.embossName && <div className="flex items-center gap-3"><CreditCard className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Emboss: <span className="font-mono">{customer.embossName}</span></span></div>}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{[customer.address.line1, customer.address.city, customer.address.state, customer.address.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="kardit-card space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">KYC</h3>
              <div className="space-y-2 rounded-md border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <span className="text-sm font-medium">{customer.kycLevel || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID Type</span>
                  <span className="text-sm font-medium">{customer.idType || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID Number</span>
                  <span className="text-sm font-medium">{customer.idNumber || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verified</span>
                  <span className="text-sm font-medium">
                    {customer.verifiedAt ? format(new Date(customer.verifiedAt), 'MMM d, yyyy HH:mm') : '-'}
                  </span>
                </div>
              </div>

              {kycDocuments.length > 0 && (
                <div className="space-y-2">
                  {kycDocuments.map((document) => (
                    <div key={document.id} className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{document.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{document.fileName}</p>
                      </div>
                      <StatusChip status={document.status as StatusType} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cards</h3>
            </div>
            {cards.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No cards issued.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issuing Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cards.map((card) => (
                      <tr key={card.id} onClick={() => navigate(`/cards/${card.id}`)} className="cursor-pointer transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 text-sm font-mono">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm">{card.productName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.issuingBankName}</td>
                        <td className="px-4 py-3"><StatusChip status={card.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(card.createdAt), 'MMM d, yyyy')}</td>
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
