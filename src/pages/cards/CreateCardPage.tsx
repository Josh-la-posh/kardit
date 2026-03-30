import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateCard } from '@/hooks/useCards';
import { CARD_PRODUCTS, ISSUING_BANKS, CURRENCIES, DELIVERY_METHODS } from '@/stores/mockStore';

export default function CreateCardPage() {
  const navigate = useNavigate();
  const { createCard, isLoading } = useCreateCard();
  const [refreshKey, setRefreshKey] = useState(0);
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
  const { customers, isLoading: customersLoading } = useCustomers(customerDropdownOpen ? customerSearch : '');

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find((customer) => customer.id === form.customerId);

  const set = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));

    if (key === 'customerId') {
      const customer = customers.find((item) => item.id === val);
      if (customer) {
        setForm((prev) => ({
          ...prev,
          customerId: val,
          embossName: customer.fullName.toUpperCase(),
        }));
      }
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.customerId) nextErrors.customerId = 'Required';
    if (!form.embossName.trim()) nextErrors.embossName = 'Required';
    if (!form.cardProduct) nextErrors.cardProduct = 'Required';
    if (!form.currency) nextErrors.currency = 'Required';
    if (!form.deliveryMethod) nextErrors.deliveryMethod = 'Required';
    if (!form.issuingBank) nextErrors.issuingBank = 'Required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const selectedProduct = CARD_PRODUCTS.find((product) => product.id === form.cardProduct);
  const selectedBank = ISSUING_BANKS.find((bank) => bank.id === form.issuingBank);
  const selectedDelivery = DELIVERY_METHODS.find((method) => method.id === form.deliveryMethod);

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
    <span>
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </span>
  );

  const handleSelectCustomer = (customerId: string) => {
    set('customerId', customerId);
    setCustomerDropdownOpen(false);
    setCustomerSearch('');
  };

  const handleCreateNewCustomer = () => {
    setRefreshKey((prev) => prev + 1);
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
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <form onSubmit={handleSubmit} className="space-y-6 xl:col-span-2">
              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Customer</h2>
                <div className="space-y-1.5" ref={dropdownRef} key={refreshKey}>
                  <label className="text-sm font-medium text-foreground">{fieldLabel('Customer', true)}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80"
                    >
                      <span className={selectedCustomer ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                        {selectedCustomer ? selectedCustomer.fullName : 'Select a customer'}
                      </span>
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {customerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border border-border bg-white shadow-lg">
                        <div className="border-b border-border p-3">
                          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1.5 focus-within:ring-1 focus-within:ring-primary">
                            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search customer..."
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              autoFocus
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                            {customerSearch && (
                              <button
                                type="button"
                                onClick={() => setCustomerSearch('')}
                                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2">
                          {customersLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : filteredCustomers.length === 0 ? (
                            <div className="space-y-2 p-2">
                              <p className="py-2 text-center text-sm text-muted-foreground">
                                {customerSearch ? 'No customers found' : 'No customers available'}
                              </p>
                            </div>
                          ) : (
                            <>
                              {filteredCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(customer.id)}
                                  className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                                >
                                  <p className="font-medium">{customer.fullName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {customer.customerId} • {customer.email}
                                  </p>
                                </button>
                              ))}
                              {customerSearch && (
                                <div className="mt-2 border-t border-border pt-2">
                                  <Button type="button" variant="outline" className="w-full" onClick={handleCreateNewCustomer}>
                                    <Plus className="mr-1 h-4 w-4" /> Add New Customer
                                  </Button>
                                </div>
                              )}
                            </>
                          )}

                          <div className="mt-2 border-t border-border pt-2">
                            <Button type="button" variant="outline" className="w-full" onClick={handleCreateNewCustomer}>
                              <Plus className="mr-1 h-4 w-4" /> Add New Customer
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
                    <p className="text-sm font-medium">{selectedCustomer.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                )}
              </div>

              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Card Details</h2>
                <TextField
                  label={fieldLabel('Emboss Name', true)}
                  value={form.embossName}
                  onChange={(e) => set('embossName', e.target.value.toUpperCase())}
                  error={errors.embossName}
                  placeholder="Name on card"
                  disabled={!form.customerId}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Issuing Bank', true)}</label>
                    <Select value={form.issuingBank} onValueChange={(value) => set('issuingBank', value)} disabled={!form.customerId}>
                      <SelectTrigger className="border-border bg-muted">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {ISSUING_BANKS.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.issuingBank && <p className="text-xs text-destructive">{errors.issuingBank}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Card Product', true)}</label>
                    <Select value={form.cardProduct} onValueChange={(value) => set('cardProduct', value)} disabled={!form.customerId}>
                      <SelectTrigger className="border-border bg-muted">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_PRODUCTS.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cardProduct && <p className="text-xs text-destructive">{errors.cardProduct}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Currency', true)}</label>
                    <Select value={form.currency} onValueChange={(value) => set('currency', value)} disabled={!form.customerId}>
                      <SelectTrigger className="border-border bg-muted">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Delivery Method', true)}</label>
                    <Select value={form.deliveryMethod} onValueChange={(value) => set('deliveryMethod', value)} disabled={!form.customerId}>
                      <SelectTrigger className="border-border bg-muted">
                        <SelectValue placeholder="Select delivery" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_METHODS.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.deliveryMethod && <p className="text-xs text-destructive">{errors.deliveryMethod}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/cards')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !form.customerId}>
                  {isLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CreditCard className="mr-1 h-4 w-4" />}
                  Create Card
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="kardit-card p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Customer</dt>
                    <dd>{selectedCustomer ? selectedCustomer.fullName : '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd>{selectedBank?.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Product</dt>
                    <dd>{selectedProduct?.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd>{form.currency || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Emboss Name</dt>
                    <dd className="font-mono text-xs">{form.embossName || '-'}</dd>
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
