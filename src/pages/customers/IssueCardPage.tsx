import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCustomer } from '@/hooks/useCustomers';
import { useCreateCard } from '@/hooks/useCards';
import { CARD_PRODUCTS, ISSUING_BANKS } from '@/stores/mockStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IssueCardPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customer, isLoading: custLoading } = useCustomer(customerId);
  const { createCard, isLoading } = useCreateCard();

  const [form, setForm] = useState({ cardProduct: '', issuingBank: '', label: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.cardProduct) e.cardProduct = 'Required';
    if (!form.issuingBank) e.issuingBank = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !customerId) return;

    const product = CARD_PRODUCTS.find((p) => p.id === form.cardProduct)!;
    const bank = ISSUING_BANKS.find((b) => b.id === form.issuingBank)!;

    await createCard({
      customerId,
      productName: product.name,
      issuingBankName: bank.name,
      currency: 'USD',
    });

    toast.success('Card issued (mock).');
    navigate(`/customers/${customerId}`);
  };

  if (custLoading) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-lg">
          {/* Customer Header */}
          {customer && (
            <div className="kardit-card p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                <p className="text-sm text-muted-foreground">{customer.customerId}</p>
              </div>
              <StatusChip status={customer.status as StatusType} />
            </div>
          )}

          <PageHeader title="Issue Additional Card" subtitle="Create a new card for this customer" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="kardit-card p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Card Product *</label>
                <Select value={form.cardProduct} onValueChange={(v) => { setForm((p) => ({ ...p, cardProduct: v })); setErrors((p) => ({ ...p, cardProduct: '' })); }}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_PRODUCTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cardProduct && <p className="text-xs text-destructive">{errors.cardProduct}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Issuing Bank *</label>
                <Select value={form.issuingBank} onValueChange={(v) => { setForm((p) => ({ ...p, issuingBank: v })); setErrors((p) => ({ ...p, issuingBank: '' })); }}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUING_BANKS.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.issuingBank && <p className="text-xs text-destructive">{errors.issuingBank}</p>}
              </div>

              <TextField
                label="Card Label (optional)"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Travel Card"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate(`/customers/${customerId}`)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Issue Card
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
