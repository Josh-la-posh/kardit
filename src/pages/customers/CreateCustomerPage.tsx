import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { KycUploadModal } from '@/components/KycUploadModal';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { CARD_PRODUCTS, ISSUING_BANKS } from '@/stores/mockStore';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const { createCustomerWithCard, isLoading } = useCreateCustomer();

  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', nationality: '',
    idType: '', idNumber: '', idExpiryDate: '',
    email: '', phone: '',
    line1: '', line2: '', city: '', state: '', country: '', postalCode: '',
    cardProduct: '', issuingBank: '',
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
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.cardProduct) e.cardProduct = 'Required';
    if (!form.issuingBank) e.issuingBank = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const product = CARD_PRODUCTS.find((p) => p.id === form.cardProduct)!;
    const bank = ISSUING_BANKS.find((b) => b.id === form.issuingBank)!;

    const customer = await createCustomerWithCard(
      {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined, nationality: form.nationality || undefined,
        idType: form.idType || undefined, idNumber: form.idNumber || undefined,
        idExpiryDate: form.idExpiryDate || undefined,
        address: {
          line1: form.line1, line2: form.line2, city: form.city,
          state: form.state, country: form.country, postalCode: form.postalCode,
        },
      },
      { productName: product.name, issuingBankName: bank.name, currency: 'USD' },
      kycDocs,
    );

    toast.success('Customer and card created (mock).');
    navigate(`/customers/${customer.id}`);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-2xl">
          <PageHeader title="Create Customer" subtitle="Register a new customer with initial card" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="First Name *" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
                <TextField label="Last Name *" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
                <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
                <TextField label="Nationality" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="e.g. US" />
              </div>
            </div>

            {/* ID & KYC */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ID & KYC Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField label="ID Type" value={form.idType} onChange={(e) => set('idType', e.target.value)} placeholder="Passport" />
                <TextField label="ID Number" value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} />
                <TextField label="ID Expiry" type="date" value={form.idExpiryDate} onChange={(e) => set('idExpiryDate', e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kycDocs.length} document(s) staged</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setKycModalOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload KYC Documents
                </Button>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact & Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Email *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
                <TextField label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <TextField label="Address Line 1" value={form.line1} onChange={(e) => set('line1', e.target.value)} />
              <TextField label="Address Line 2" value={form.line2} onChange={(e) => set('line2', e.target.value)} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <TextField label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                <TextField label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
                <TextField label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} />
                <TextField label="Postal Code" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
              </div>
            </div>

            {/* Card Issuance */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Initial Card Issuance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Card Product *</label>
                  <Select value={form.cardProduct} onValueChange={(v) => set('cardProduct', v)}>
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
                  <Select value={form.issuingBank} onValueChange={(v) => set('issuingBank', v)}>
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
