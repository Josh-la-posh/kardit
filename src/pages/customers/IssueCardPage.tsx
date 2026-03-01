import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useCustomer } from '@/hooks/useCustomers';
import { useCreateCard } from '@/hooks/useCards';
import { CARD_PRODUCTS, ISSUING_BANKS, CURRENCIES, DELIVERY_METHODS, ID_TYPES, store } from '@/stores/mockStore';
import { Loader2, ArrowLeft, ChevronDown, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function IssueCardPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customer, isLoading: custLoading } = useCustomer(customerId);
  const { createCard, isLoading } = useCreateCard();

  const [form, setForm] = useState({
    embossName: '', cardProduct: '', currency: '', deliveryMethod: '', issuingBank: '',
    email: '', phone: '', idType: '', idNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kycOpen, setKycOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Pre-fill from customer
  useEffect(() => {
    if (customer) {
      setForm(f => ({
        ...f,
        embossName: f.embossName || customer.embossName || `${customer.firstName} ${customer.lastName}`.toUpperCase(),
        email: f.email || customer.email || '',
        phone: f.phone || customer.phone || '',
        idType: f.idType || customer.idType || '',
        idNumber: f.idNumber || customer.idNumber || '',
      }));
    }
  }, [customer]);

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.embossName.trim()) e.embossName = 'Required';
    if (!form.cardProduct) e.cardProduct = 'Required';
    if (!form.currency) e.currency = 'Required';
    if (!form.deliveryMethod) e.deliveryMethod = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.idType) e.idType = 'Required';
    if (!form.idNumber.trim()) e.idNumber = 'Required';
    if (!form.issuingBank) e.issuingBank = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedProduct = CARD_PRODUCTS.find(p => p.id === form.cardProduct);
  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency);
  const selectedDelivery = DELIVERY_METHODS.find(d => d.id === form.deliveryMethod);
  const selectedIdType = ID_TYPES.find(t => t.id === form.idType);

  const cmsPayload = useMemo(() => ({
    crt_emboss_name: form.embossName.trim(),
    crt_code_product: selectedProduct?.code || '',
    cpt_currency: selectedCurrency?.numeric || '',
    delivery_method: selectedDelivery?.code || '',
    enr_mail: form.email.trim(),
    mobile_num: form.phone.trim(),
    Type_Papier: selectedIdType?.code || '',
    ID_Papier: form.idNumber.trim(),
  }), [form, selectedProduct, selectedCurrency, selectedDelivery, selectedIdType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !customerId) return;

    const product = CARD_PRODUCTS.find((p) => p.id === form.cardProduct)!;
    const bank = ISSUING_BANKS.find((b) => b.id === form.issuingBank)!;

    const card = await createCard({
      customerId,
      productName: product.name,
      productCode: product.code,
      issuingBankName: bank.name,
      currency: form.currency,
      embossName: form.embossName.trim(),
      deliveryMethod: selectedDelivery?.code,
    });

    store.addCMSAction({ entityType: 'CARD', entityId: card.id, payload: cmsPayload });
    toast.success('Card issued (mock).');
    navigate(`/customers/${customerId}`);
  };

  if (custLoading) {
    return <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}><AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout></ProtectedRoute>;
  }

  const fieldLabel = (label: string, required = false) => (
    <span>{label}{required && <span className="text-destructive ml-0.5">*</span>}</span>
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Issue Additional Card"
            subtitle="Create a new card for this customer"
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customerId}`)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            }
          />

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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-6">
              {/* Card Details */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Details</h2>
                <div>
                  <TextField label={fieldLabel('Emboss Name', true)} value={form.embossName} onChange={(e) => set('embossName', e.target.value.toUpperCase())} error={errors.embossName} placeholder="Name on card" />
                  <p className="text-xs text-muted-foreground mt-1">Pre-filled from customer name, editable</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Card Product', true)}</label>
                    <Select value={form.cardProduct} onValueChange={(v) => set('cardProduct', v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {CARD_PRODUCTS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.cardProduct && <p className="text-xs text-destructive">{errors.cardProduct}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Currency', true)}</label>
                    <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select currency" /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Delivery Method', true)}</label>
                    <Select value={form.deliveryMethod} onValueChange={(v) => set('deliveryMethod', v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select delivery" /></SelectTrigger>
                      <SelectContent>
                        {DELIVERY_METHODS.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.deliveryMethod && <p className="text-xs text-destructive">{errors.deliveryMethod}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('Issuing Bank', true)}</label>
                    <Select value={form.issuingBank} onValueChange={(v) => set('issuingBank', v)}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent>
                        {ISSUING_BANKS.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.issuingBank && <p className="text-xs text-destructive">{errors.issuingBank}</p>}
                  </div>
                </div>
              </div>

              {/* Customer KYC & Contact (collapsible) */}
              <Collapsible open={kycOpen} onOpenChange={setKycOpen}>
                <div className="kardit-card p-6 space-y-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer KYC & Contact</h2>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${kycOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField label={fieldLabel('Email', true)} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
                      <TextField label={fieldLabel('Mobile Number', true)} value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="+971 50 123 4567" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{fieldLabel('ID Type', true)}</label>
                        <Select value={form.idType} onValueChange={(v) => set('idType', v)}>
                          <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {ID_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {errors.idType && <p className="text-xs text-destructive">{errors.idType}</p>}
                      </div>
                      <TextField label={fieldLabel('ID Number', true)} value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} error={errors.idNumber} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(`/customers/${customerId}`)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />} Issue Card
                </Button>
              </div>
            </form>

            {/* CMS Request Preview */}
            <div className="xl:col-span-1">
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <div className="kardit-card p-4 sticky top-24">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code className="h-4 w-4" /> CMS Request Preview
                    </h3>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-3 text-xs bg-muted rounded-md p-3 overflow-auto max-h-96 text-foreground">
                      {JSON.stringify(cmsPayload, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
