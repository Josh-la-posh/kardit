import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCard } from '@/hooks/useCards';
import { CARD_PRODUCTS, ISSUING_BANKS, CURRENCIES, DELIVERY_METHODS, store } from '@/stores/mockStore';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CreateCardPage - Create a card for any customer, selecting customer and bank
 * Affiliates can create cards for different customers across different banks
 */
export default function CreateCardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCard, isLoading } = useCreateCard();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;
  const customers = store.getCustomers(tenantScope).filter(c => c.status === 'ACTIVE');

  const [form, setForm] = useState({
    tenantId: '',
    customerId: '',
    embossName: '',
    cardProduct: '',
    currency: '',
    deliveryMethod: '',
    issuingBank: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = customers.find(c => c.id === form.customerId);

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));

    // Auto-fill emboss name when customer is selected
    if (key === 'customerId') {
      const cust = customers.find(c => c.id === val);
      if (cust) {
        setForm(f => ({
          ...f,
          customerId: val,
          embossName: cust.embossName || `${cust.firstName} ${cust.lastName}`.toUpperCase(),
        }));
      }
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = 'Required';
    if (!form.embossName.trim()) e.embossName = 'Required';
    if (!form.cardProduct) e.cardProduct = 'Required';
    if (!form.currency) e.currency = 'Required';
    if (!form.deliveryMethod) e.deliveryMethod = 'Required';
    if (!form.issuingBank) e.issuingBank = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedProduct = CARD_PRODUCTS.find(p => p.id === form.cardProduct);
  const selectedBank = ISSUING_BANKS.find(b => b.id === form.issuingBank);
  const selectedDelivery = DELIVERY_METHODS.find(d => d.id === form.deliveryMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await createCard({
      customerId: form.customerId,
      tenantId: user?.tenantId || 'tenant_alpha_affiliate',
      productName: selectedProduct!.name,
      productCode: selectedProduct!.code,
      issuingBankName: selectedBank!.name,
      currency: form.currency,
      embossName: form.embossName.trim(),
      deliveryMethod: selectedDelivery?.code,
    });

    toast.success('Card created successfully');
    navigate('/cards');
  };

  const fieldLabel = (label: string, required = false) => (
    <span>{label}{required && <span className="text-destructive ml-0.5">*</span>}</span>
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Create Card"
            subtitle="Issue a new card for a customer"
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate('/cards')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            }
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-6">
              {/* Customer Selection */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Customer</h2>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{fieldLabel('Customer', true)}</label>
                  <Select value={form.customerId} onValueChange={(v) => set('customerId', v)}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="_none" disabled>No active customers</SelectItem>
                      ) : (
                        customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} ({c.customerId})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.customerId && <p className="text-xs text-destructive">{errors.customerId}</p>}
                </div>

                {selectedCustomer && (
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Details</h2>
                <TextField
                  label={fieldLabel('Emboss Name', true)}
                  value={form.embossName}
                  onChange={(e) => set('embossName', e.target.value.toUpperCase())}
                  error={errors.embossName}
                  placeholder="Name on card"
                  disabled={!form.customerId}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Issuing Bank', true)}</label>
                    <Select value={form.issuingBank} onValueChange={(v) => set('issuingBank', v)} disabled={!form.customerId}>
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Card Product', true)}</label>
                    <Select value={form.cardProduct} onValueChange={(v) => set('cardProduct', v)} disabled={!form.customerId}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_PRODUCTS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cardProduct && <p className="text-xs text-destructive">{errors.cardProduct}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Currency', true)}</label>
                    <Select value={form.currency} onValueChange={(v) => set('currency', v)} disabled={!form.customerId}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Delivery Method', true)}</label>
                    <Select value={form.deliveryMethod} onValueChange={(v) => set('deliveryMethod', v)} disabled={!form.customerId}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Select delivery" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_METHODS.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.deliveryMethod && <p className="text-xs text-destructive">{errors.deliveryMethod}</p>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/cards')}>Cancel</Button>
                <Button type="submit" disabled={isLoading || !form.customerId}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
                  Create Card
                </Button>
              </div>
            </form>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <div className="kardit-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Customer</dt>
                    <dd>{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd>{selectedBank?.name || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Product</dt>
                    <dd>{selectedProduct?.name || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd>{form.currency || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Emboss Name</dt>
                    <dd className="font-mono text-xs">{form.embossName || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
