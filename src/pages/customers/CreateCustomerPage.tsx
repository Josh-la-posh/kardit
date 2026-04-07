import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KycUploadModal } from '@/components/KycUploadModal';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { ID_TYPES } from '@/stores/mockStore';
import { ArrowLeft, ChevronRight, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_VALUE = '--';

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const { createCustomerDraft, isLoading } = useCreateCustomer();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    embossName: '',
    dob: '',
    email: '',
    phone: '',
    idType: '',
    idNumber: '',
    idExpiryDate: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'NG',
    postalCode: '',
  });
  const [kycDocs, setKycDocs] = useState<{ type: string; fileName: string }[]>([]);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!form.embossName.trim()) next.embossName = 'Required';
    if (!form.dob) next.dob = 'Required';
    if (!form.email.trim()) next.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email';
    if (!form.phone.trim()) next.phone = 'Required';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) next.phone = 'Invalid mobile number';
    if (!form.idType) next.idType = 'Required';
    if (!form.idNumber.trim()) next.idNumber = 'Required';
    if (!form.line1.trim()) next.line1 = 'Required';
    if (!form.city.trim()) next.city = 'Required';
    if (!form.state.trim()) next.state = 'Required';
    if (!form.country.trim()) next.country = 'Required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const selectedIdType = ID_TYPES.find((type) => type.id === form.idType);

  const draftPayload = useMemo(
    () => ({
      customer: {
        identity: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dob: form.dob,
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: {
            line1: form.line1.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim(),
          },
        },
        kyc: {
          idType: selectedIdType?.code || form.idType.toUpperCase(),
          idNumber: form.idNumber.trim(),
          kycLevel: 'LEVEL_2',
        },
      },
    }),
    [form, selectedIdType]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await createCustomerDraft({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dob: form.dob,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: {
          line1: form.line1.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
        },
        kyc: {
          idType: selectedIdType?.code || form.idType.toUpperCase(),
          idNumber: form.idNumber.trim(),
          kycLevel: 'LEVEL_2',
        },
      });

      toast.success(`Customer draft saved: ${response.customerId}`);
      navigate('/customers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customer draft');
    }
  };

  const fieldLabel = (label: string, required = false) => (
    <span>
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </span>
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Create Customer"
            subtitle="Capture identity and KYC details before card issuance"
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate('/cards/create')}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <form onSubmit={handleSubmit} className="space-y-6 xl:col-span-2">
              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Info</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label={fieldLabel('First Name', true)}
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    error={errors.firstName}
                  />
                  <TextField
                    label={fieldLabel('Last Name', true)}
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    error={errors.lastName}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label={fieldLabel('Date of Birth', true)}
                    type="date"
                    value={form.dob}
                    onChange={(e) => set('dob', e.target.value)}
                    error={errors.dob}
                  />
                  <TextField
                    label={fieldLabel('Emboss Name', true)}
                    value={form.embossName}
                    onChange={(e) => set('embossName', e.target.value.toUpperCase())}
                    error={errors.embossName}
                    placeholder="Name printed on card"
                  />
                </div>
                <p className="text-xs text-muted-foreground">This draft saves the customer profile and leaves card issuance for the next step.</p>
              </div>

              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label={fieldLabel('Email', true)}
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                  />
                  <TextField
                    label={fieldLabel('Mobile Number', true)}
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="+2348098765432"
                    hint="Include country code"
                  />
                </div>
              </div>

              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Identity (KYC)</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{fieldLabel('ID Type', true)}</label>
                    <Select value={form.idType} onValueChange={(value) => set('idType', value)}>
                      <SelectTrigger className="border-border bg-muted">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.idType && <p className="text-xs text-destructive">{errors.idType}</p>}
                  </div>
                  <TextField
                    label={fieldLabel('ID Number', true)}
                    value={form.idNumber}
                    onChange={(e) => set('idNumber', e.target.value)}
                    error={errors.idNumber}
                  />
                  <TextField
                    label="ID Expiry Date"
                    type="date"
                    value={form.idExpiryDate}
                    onChange={(e) => set('idExpiryDate', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{kycDocs.length} document(s) staged</p>
                  <Button type="button" variant="outline" onClick={() => setKycModalOpen(true)}>
                    <Upload className="h-4 w-4" /> Upload KYC Documents
                  </Button>
                </div>
              </div>

              <div className="kardit-card space-y-4 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Address</h2>
                <TextField
                  label={fieldLabel('Address Line 1', true)}
                  value={form.line1}
                  onChange={(e) => set('line1', e.target.value)}
                  error={errors.line1}
                />
                <TextField label="Address Line 2" value={form.line2} onChange={(e) => set('line2', e.target.value)} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <TextField
                    label={fieldLabel('City', true)}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    error={errors.city}
                  />
                  <TextField
                    label={fieldLabel('State', true)}
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    error={errors.state}
                  />
                  <TextField
                    label={fieldLabel('Country', true)}
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    error={errors.country}
                  />
                  <TextField
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => set('postalCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/cards/create')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} onClick={() => navigate('/cards/create')} >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Customer Draft
                </Button>
              </div>
            </form>

            <div className="xl:col-span-1">
              <div className="kardit-card sticky top-24 space-y-4 p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <ChevronRight className="h-4 w-4" /> Review Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <SummaryRow label="Emboss Name" value={form.embossName || EMPTY_VALUE} />
                  <SummaryRow label="Date of Birth" value={form.dob || EMPTY_VALUE} />
                  <SummaryRow label="Email" value={form.email || EMPTY_VALUE} />
                  <SummaryRow label="Mobile" value={form.phone || EMPTY_VALUE} />
                  <SummaryRow label="ID Type" value={selectedIdType?.label || EMPTY_VALUE} />
                  <SummaryRow label="State" value={form.state || EMPTY_VALUE} />
                  <SummaryRow label="Country" value={form.country || EMPTY_VALUE} />
                  <SummaryRow label="KYC Level" value="LEVEL_2" />
                  <SummaryRow label="KYC Docs" value={`${kycDocs.length} staged`} />
                </div>
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {JSON.stringify(draftPayload, null, 2)}
                </pre>
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
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
