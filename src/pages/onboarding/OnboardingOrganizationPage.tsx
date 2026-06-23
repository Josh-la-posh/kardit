import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';
import { useCreateOnboardingSession, useOnboardingDraft } from '@/hooks/useOnboarding';
import { saveOrganization as saveOrganizationApi } from '@/services/onboardingApi';
import { getCountriesWithStates, type PelpayCountry, type PelpayState } from '@/services/locationApi';

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children} <span className="text-destructive">*</span>
    </span>
  );
}

function normalizeCountryValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeStateValue(value: string) {
  return value.trim().toLowerCase();
}

export default function OnboardingOrganizationPage() {
  type RequiredFieldKey =
    | 'tenantId'
    | 'legalName'
    | 'registrationNumber'
    | 'addressLine1'
    | 'country'
    | 'contactFullName'
    | 'contactEmail'
    | 'contactPhone';

  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, updateOrganization } = useOnboardingDraft(draftId);
  const { create, isLoading: creatingSession } = useCreateOnboardingSession();

  const initial = useMemo(() => {
    return {
      tenantId: draft?.organization?.tenantId || '',
      legalName: draft?.organization?.legalName || '',
      tradingName: draft?.organization?.tradingName || '',
      registrationNumber: draft?.organization?.registrationNumber || '',
      addressLine1: draft?.organization?.address?.line1 || '',
      city: draft?.organization?.address?.city || '',
      state: draft?.organization?.address?.state || '',
      country: draft?.organization?.address?.country || '',
      contactFullName: draft?.organization?.primaryContact?.fullName || '',
      contactEmail: draft?.organization?.primaryContact?.email || draft?.email || '',
      contactPhone: draft?.organization?.primaryContact?.phone || draft?.phone || '',
    };
  }, [draft]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<PelpayCountry | null>(null);
  const [selectedState, setSelectedState] = useState<PelpayState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredFieldKey, string>>>({});
  const requiredFieldKeys: RequiredFieldKey[] = [
    'tenantId',
    'legalName',
    'registrationNumber',
    'addressLine1',
    'country',
    'contactFullName',
    'contactEmail',
    'contactPhone',
  ];

  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    error: countriesError,
  } = useQuery({
    queryKey: ['pelpay-countries'],
    queryFn: getCountriesWithStates,
    staleTime: 1000 * 60 * 30,
  });

  const availableStates = selectedCountry?.states ?? [];

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  React.useEffect(() => {
    const initialCountry = normalizeCountryValue(initial.country);
    const initialState = normalizeStateValue(initial.state);

    if (!countries.length) {
      setSelectedCountry(null);
      setSelectedState(null);
      return;
    }

    const countryMatch =
      countries.find(
        (country) =>
          country.id.toLowerCase() === initialCountry ||
          country.countryName.toLowerCase() === initialCountry
      ) ?? null;

    setSelectedCountry(countryMatch);

    if (!countryMatch) {
      setSelectedState(null);
      return;
    }

    const stateMatch =
      countryMatch.states.find(
        (state) =>
          state.id.toLowerCase() === initialState ||
          state.stateName.toLowerCase() === initialState
      ) ?? null;

    setSelectedState(stateMatch);
  }, [countries, initial.country, initial.state]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (requiredFieldKeys.includes(k as RequiredFieldKey)) {
      setFieldErrors((prev) => ({ ...prev, [k as RequiredFieldKey]: undefined }));
    }
  };

  const validateRequiredFields = () => {
    const errors: Partial<Record<RequiredFieldKey, string>> = {};

    if (!form.tenantId.trim()) errors.tenantId = 'Tenant ID is required';
    if (!form.legalName.trim()) errors.legalName = 'Legal business name is required';
    if (!form.registrationNumber.trim()) errors.registrationNumber = 'Registration number is required';
    if (!form.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required';
    if (!form.country.trim()) errors.country = 'Country is required';
    if (!form.contactFullName.trim()) errors.contactFullName = 'Full name is required';
    if (!form.contactEmail.trim()) errors.contactEmail = 'Email is required';
    if (!form.contactPhone.trim()) errors.contactPhone = 'Phone is required';

    return errors;
  };

  const onNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const errors = validateRequiredFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLocalError('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      let activeDraftId = draftId;
      let activeOnboardingSessionId = draft?.onboardingSessionId;

      if (!activeDraftId || !activeOnboardingSessionId) {
        const session = await create({
          channel: 'web',
          email: form.contactEmail || 'affiliate-onboarding@kardit.app',
          phone: form.contactPhone || '+2340000000000',
          consentAccepted: true,
        });
        activeDraftId = session.draftId;
        activeOnboardingSessionId = session.onboardingSessionId;
      }

      if (!activeDraftId || !activeOnboardingSessionId) {
        setLocalError('Missing onboarding session ID. Please restart onboarding.');
        return;
      }

      const payload = {
        onboardingSessionId: activeOnboardingSessionId,
        tenantId: form.tenantId,
        legalName: form.legalName,
        tradingName: form.tradingName,
        registrationNumber: form.registrationNumber,
        address: {
          line1: form.addressLine1,
          city: form.city,
          state: form.state,
          country: form.country,
        },
        primaryContact: {
          fullName: form.contactFullName,
          email: form.contactEmail,
          phone: form.contactPhone,
        },
      };

      if (draftId) {
        await updateOrganization(payload);
      } else {
        await saveOrganizationApi(activeDraftId, payload);
      }
      navigate(`/onboarding/${activeDraftId}/documents`);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save organization details');
    } finally {
      setSaving(false);
    }
  };

  const toneClasses = 'border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]';
  const selectTriggerClassName = (hasError?: boolean) =>
    [
      'h-12 rounded-lg border px-3 text-base',
      toneClasses,
      hasError ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))/0.35]' : '',
    ].join(' ');

  return (
    <PublicOnboardingLayout
      currentStep="organization"
      draftId={draftId}
      draft={draft}
      title="Tell us about your organization"
      description="All fields are required unless marked optional. Use your registered business name and address as on file with CAC."
    >
      <div className="animate-fade-in rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-5 shadow-[var(--cs-shadow-lg)] md:p-7">
        {(localError || error || countriesError) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error || (countriesError instanceof Error ? countriesError.message : 'Failed to load countries')}</span>
          </div>
        )}

        {(isLoading && draftId) || isLoadingCountries ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={onNext} className="space-y-8">
            <section className="bg-[hsl(var(--landing-panel))] rounded-[1.5rem] p-5">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Organization Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="col-span-2">
                  <TextField label={<RequiredLabel>Legal Business Name</RequiredLabel>} value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={saving} error={fieldErrors.legalName} />
                </div>
                <TextField label="Trading Name" value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} disabled={saving} />
                <TextField label={<RequiredLabel>RC / Registration Number</RequiredLabel>} value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} disabled={saving} error={fieldErrors.registrationNumber} />
                <TextField label={<RequiredLabel>Tenant ID</RequiredLabel>} value={form.tenantId} onChange={(e) => set('tenantId', e.target.value)} disabled={saving} error={fieldErrors.tenantId} />
                <div className="col-span-2">
                  <TextField className="md:col-span-2" label="Address Line 1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={saving} error={fieldErrors.addressLine1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-semibold text-foreground"><RequiredLabel>Country</RequiredLabel></label>
                  <Select
                    value={selectedCountry?.id ?? ''}
                    onValueChange={(countryId) => {
                      const country = countries.find((item) => item.id === countryId) ?? null;
                      setSelectedCountry(country);
                      setSelectedState(null);
                      setFieldErrors((prev) => ({ ...prev, country: undefined }));
                      setForm((prev) => ({
                        ...prev,
                        country: country?.id ?? '',
                        state: '',
                        city: '',
                      }));
                    }}
                    disabled={saving || !countries.length}
                  >
                    <SelectTrigger className={selectTriggerClassName(Boolean(fieldErrors.country))}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.countryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.country && <p className="text-xs text-destructive">{fieldErrors.country}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-semibold text-foreground"><RequiredLabel>State</RequiredLabel></label>
                  <Select
                    value={selectedState?.id ?? ''}
                    onValueChange={(stateId) => {
                      const state = availableStates.find((item) => item.id === stateId) ?? null;
                      setSelectedState(state);
                      setForm((prev) => ({
                        ...prev,
                        state: state?.id ?? '',
                        city: '',
                      }));
                    }}
                    disabled={saving || !selectedCountry || !availableStates.length}
                  >
                    <SelectTrigger className={selectTriggerClassName()}>
                      <SelectValue placeholder={selectedCountry ? 'Select state' : 'Select country first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.stateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Enter city"
                  disabled={saving}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-foreground">Primary contact</h2>
              </div>
              <div className="grid grid-col-1 gap-4 md:grid-cols-2">
                <div className="col-span-2">
                  <TextField label={<RequiredLabel>Full Name</RequiredLabel>} value={form.contactFullName} onChange={(e) => set('contactFullName', e.target.value)} disabled={saving} error={fieldErrors.contactFullName} />
                </div>
                <TextField label={<RequiredLabel>Email</RequiredLabel>} type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={saving} error={fieldErrors.contactEmail} />
                <TextField label={<RequiredLabel>Phone</RequiredLabel>} type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={saving} error={fieldErrors.contactPhone} />
              </div>
            </section>

            <div className="flex flex-col justify-end gap-3 border-t border-[hsl(var(--landing-panel-border))] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[hsl(var(--landing-panel-border))] bg-card px-5" onClick={() => navigate('/onboarding/start')} disabled={saving}>Cancel</Button>
              <Button type="submit" className="h-11 rounded-xl px-6" disabled={saving || creatingSession}>
                {saving || creatingSession ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save and continue'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
