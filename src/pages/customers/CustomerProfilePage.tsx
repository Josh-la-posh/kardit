import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useCustomer } from '@/hooks/useCustomers';
import { CreditCard, Loader2, Mail, Phone, MapPin, Calendar, Globe, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customer, kycDocuments, cards, isLoading } = useCustomer(customerId);

  if (isLoading) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout></ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="text-center py-20 text-muted-foreground">Customer not found.</div>
      </AppLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={`${customer.firstName} ${customer.lastName}`}
            subtitle={customer.customerId}
            actions={
              <div className="flex items-center gap-3">
                <StatusChip status={customer.status as StatusType} />
                <Button onClick={() => navigate(`/customers/${customer.id}/cards/new`)}>
                  <CreditCard className="h-4 w-4" /> Issue Additional Card
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Overview */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h3>
              <div className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.email}</span></div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.phone}</span></div>
                )}
                {customer.dateOfBirth && (
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{format(new Date(customer.dateOfBirth), 'PPP')}</span></div>
                )}
                {customer.nationality && (
                  <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{customer.nationality}</span></div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">
                      {[customer.address.line1, customer.address.line2, customer.address.city, customer.address.state, customer.address.country, customer.address.postalCode].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {customer.idType && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.idType}: {customer.idNumber} (exp: {customer.idExpiryDate})</span>
                  </div>
                )}
              </div>
            </div>

            {/* KYC Documents */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KYC Documents</h3>
              {kycDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {kycDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{doc.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                      </div>
                      <StatusChip status={doc.status as StatusType} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="kardit-card mt-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cards</h3>
            </div>
            {cards.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No cards issued.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issuing Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currency</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cards.map((card, i) => (
                      <tr
                        key={card.id}
                        onClick={() => navigate(`/cards/${card.id}`)}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm">{card.productName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.issuingBankName}</td>
                        <td className="px-4 py-3"><StatusChip status={card.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm">{card.currency}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{card.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
