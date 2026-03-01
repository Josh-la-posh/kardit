import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { KycUploadModal } from '@/components/KycUploadModal';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { CARD_PRODUCTS, ISSUING_BANKS, CURRENCIES, ID_TYPES, DELIVERY_METHODS, store } from '@/stores/mockStore';
import { Loader2, Upload, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const { createCustomerWithCard, isLoading } = useCreateCustomer();

  const [form, setForm] = useState({
    firstName: '', lastName: '', embossName: '',
    email: '', phone: '',
    idType: '', idNumber: '', idExpiryDate: '',
    line1: '', line2: '', city: '', country: '', postalCode: '',
    rib: '', agencyCode: '',
    cardProduct: '', currency: '', deliveryMethod: '', issuingBank: '',
  });
  const [kycDocs, setKycDocs] = useState<{ type: string; fileName: string }[]>([]);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.embossName.trim()) e.embossName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) e.phone = 'Invalid mobile number';
    if (!form.idType) e.idType = 'Required';
    if (!form.idNumber.trim()) e.idNumber = 'Required';
    if (!form.line1.trim()) e.line1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    if (!form.rib.trim()) e.rib = 'Required';
    if (!form.agencyCode.trim()) e.agencyCode = 'Required';
    if (!form.cardProduct) e.cardProduct = 'Required';
    if (!form.currency) e.currency = 'Required';
    if (!form.deliveryMethod) e.deliveryMethod = 'Required';
    if (!form.issuingBank) e.issuingBank = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedProduct = CARD_PRODUCTS.find(p => p.id === form.cardProduct);
  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency);
  const selectedDelivery = DELIVERY_METHODS.find(d => d.id === form.deliveryMethod);
  const selectedIdType = ID_TYPES.find(t => t.id === form.idType);

  const cmsPayload = useMemo(() => ({
    crt_first_name: form.firstName.trim(),
    crt_last_name: form.lastName.trim(),
    crt_emboss_name: form.embossName.trim(),
    enr_mail: form.email.trim(),
    mobile_num: form.phone.trim(),
    Type_Papier: selectedIdType?.code || form.idType,
    ID_Papier: form.idNumber.trim(),
    id_expiry_date: form.idExpiryDate || undefined,
    address_line1: form.line1.trim(),
    address_line2: form.line2.trim() || undefined,
    city: form.city.trim(),
    country: form.country.trim(),
    postal_code: form.postalCode.trim() || undefined,
    RIB_CLIENT: form.rib.trim(),
    Code_Agency: form.agencyCode.trim(),
    crt_code_product: selectedProduct?.code || '',
    cpt_currency: selectedCurrency?.numeric || '',
    delivery_method: selectedDelivery?.code || '',
  }), [form, selectedProduct, selectedCurrency, selectedDelivery, selectedIdType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const product = CARD_PRODUCTS.find((p) => p.id === form.cardProduct)!;
    const bank = ISSUING_BANKS.find((b) => b.id === form.issuingBank)!;

    const customer = await createCustomerWithCard(
      {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        embossName: form.embossName.trim(),
        email: form.email.trim(), phone: form.phone.trim() || undefined,
        idType: form.idType || undefined, idNumber: form.idNumber || undefined,
        idExpiryDate: form.idExpiryDate || undefined,
        address: {
          line1: form.line1, line2: form.line2, city: form.city,
          country: form.country, postalCode: form.postalCode,
        },
        rib: form.rib.trim(), agencyCode: form.agencyCode.trim(),
      },
      {
        productName: product.name, productCode: product.code,
        issuingBankName: bank.name, currency: form.currency,
        embossName: form.embossName.trim(),
        deliveryMethod: selectedDelivery?.code,
      },
      kycDocs,
    );

    // Store CMS payload for verification
    store.addPendingCMSRequest(customer.id, cmsPayload);

    toast.success('Customer and card created (mock).');
    navigate(`/customers/${customer.id}`);
  };

  const fieldLabel = (label: string, required = false) => (
    <span>{label}{required && <span className="text-destructive ml-0.5">*</span>}</span>
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Create Customer"
            subtitle="Register a new customer with initial card"
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            }
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form */}
            <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField label={fieldLabel('First Name', true)} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
                  <TextField label={fieldLabel('Last Name', true)} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
                </div>
                <div>
                  <TextField label={fieldLabel('Emboss Name', true)} value={form.embossName} onChange={(e) => set('embossName', e.target.value.toUpperCase())} error={errors.embossName} placeholder="Name printed on card" />
                  <p className="text-xs text-muted-foreground mt-1">Name as it will appear on the physical card</p>
                </div>
              </div>

              {/* Contact */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField label={fieldLabel('Email', true)} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
                  <div>
                    <TextField label={fieldLabel('Mobile Number', true)} value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="+971 50 123 4567" />
                    <p className="text-xs text-muted-foreground mt-1">Include country code</p>
                  </div>
                </div>
              </div>

              {/* Identity (KYC) */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identity (KYC)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <TextField label="ID Expiry Date" type="date" value={form.idExpiryDate} onChange={(e) => set('idExpiryDate', e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{kycDocs.length} document(s) staged</p>
                  <Button type="button" variant="outline" onClick={() => setKycModalOpen(true)}>
                    <Upload className="h-4 w-4" /> Upload KYC Documents
                  </Button>
                </div>
              </div>

              {/* Address */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address</h2>
                <TextField label={fieldLabel('Address Line 1', true)} value={form.line1} onChange={(e) => set('line1', e.target.value)} error={errors.line1} />
                <TextField label="Address Line 2" value={form.line2} onChange={(e) => set('line2', e.target.value)} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <TextField label={fieldLabel('City', true)} value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
                  <TextField label={fieldLabel('Country', true)} value={form.country} onChange={(e) => set('country', e.target.value)} error={errors.country} />
                  <TextField label="Postal Code" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                </div>
              </div>

              {/* Banking / Branch Details */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Banking / Branch Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <TextField label={fieldLabel('RIB / Client Bank Account', true)} value={form.rib} onChange={(e) => set('rib', e.target.value)} error={errors.rib} placeholder="e.g. 1234567890123456789012" />
                    <p className="text-xs text-muted-foreground mt-1">Bank account identifier (RIB_CLIENT)</p>
                  </div>
                  <TextField label={fieldLabel('Agency Code', true)} value={form.agencyCode} onChange={(e) => set('agencyCode', e.target.value)} error={errors.agencyCode} placeholder="e.g. AG001" />
                </div>
              </div>

              {/* Card Issuance */}
              <div className="kardit-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Initial Card Issuance</h2>
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

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/customers')}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Customer
                </Button>
              </div>
            </form>

            {/* Review Summary Panel */}
            <div className="xl:col-span-1">
              <div className="kardit-card p-6 sticky top-24 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" /> Review Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <SummaryRow label="Emboss Name" value={form.embossName || '—'} />
                  <SummaryRow label="Email" value={form.email || '—'} />
                  <SummaryRow label="Mobile" value={form.phone || '—'} />
                  <SummaryRow label="ID Type" value={selectedIdType?.label || '—'} />
                  <SummaryRow label="Product" value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : '—'} />
                  <SummaryRow label="Currency" value={selectedCurrency?.label || '—'} />
                  <SummaryRow label="Delivery" value={selectedDelivery?.label || '—'} />
                  <SummaryRow label="RIB" value={form.rib || '—'} />
                  <SummaryRow label="Agency" value={form.agencyCode || '—'} />
                  <SummaryRow label="KYC Docs" value={`${kycDocs.length} staged`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <KycUploadModal
          open={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          documents={kycDocs}
          onDocumentsChange={setKycDocs}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
