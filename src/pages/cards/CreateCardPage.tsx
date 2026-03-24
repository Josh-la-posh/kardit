import React, { useState, useRef } from 'react';
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
import { Plus, Upload, Loader2, ArrowLeft, CreditCard, Search, X } from 'lucide-react';
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
  const [refreshKey, setRefreshKey] = useState(0);
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
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = customers.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customerId.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

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

  const handleSelectCustomer = (customerId: string) => {
    set('customerId', customerId);
    setCustomerDropdownOpen(false);
    setCustomerSearch('');
  };

  const handleCreateNewCustomer = () => {
    setRefreshKey(prev => prev + 1);
    navigate('/customers/create', { state: { returnTo: '/cards/create' } });
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Create Card"
            subtitle="Issue a new card for a customer"
            actions={
              <div className="flex gap-2">
              <Button onClick={() => navigate('/customers/create')}>
                  <Plus className="h-4 w-4" /> Add New Customer
                </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/cards')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-6">
              {/* Customer Selection */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Customer</h2>
                <div className="space-y-1.5" ref={dropdownRef} key={refreshKey}>
                  <label className="text-sm font-medium text-foreground">{fieldLabel('Customer', true)}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <span className={selectedCustomer ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Select a customer'}
                      </span>
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {customerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-md shadow-lg z-50">
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-muted focus-within:ring-1 focus-within:ring-primary">
                            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="Search customer..."
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              autoFocus
                              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                            />
                            {customerSearch && (
                              <button
                                type="button"
                                onClick={() => setCustomerSearch('')}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2">
                          {filteredCustomers.length === 0 ? (
                            <div className="space-y-2 p-2">
                              <p className="text-sm text-muted-foreground text-center py-2">
                                {customerSearch ? 'No customers found' : 'No active customers'}
                              </p>
                            </div>
                          ) : (
                            <>
                              {filteredCustomers.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(c.id)}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                                >
                                  <p className="font-medium">{c.firstName} {c.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{c.customerId} • {c.email}</p>
                                </button>
                              ))}
                              {customerSearch && (
                                <div className="border-t border-border mt-2 pt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleCreateNewCustomer}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add New Customer
                                  </Button>
                                </div>
                              )}
                            </>
                          )}

                          <div className="border-t border-border mt-2 pt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleCreateNewCustomer}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add New Customer
                                  </Button>
                                </div>
                        </div>
                      </div>
                    )}
                  </div>
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
