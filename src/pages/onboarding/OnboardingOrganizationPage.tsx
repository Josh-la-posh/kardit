import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { CitySelect, CountrySelect, GetCity, GetCountries, GetState, StateSelect } from 'react-country-state-city';
import type { City, Country, State } from 'react-country-state-city/dist/esm/types';
import { useCreateOnboardingSession, useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';
import { saveOrganization as saveOrganizationApi } from '@/services/onboardingApi';

function normalizeCountryValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeStateValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCityValue(value: string) {
  return value.trim().toLowerCase();
}

function getSelectInputClassName(hasError?: boolean) {
  return [
    'h-10 px-5 text-[hsl(var(--foreground))] rounded-lg text-base placeholder:text-muted-foreground bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    hasError ? 'border border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))/0.35]' : '',
  ].join(' ');
}

export default function OnboardingOrganizationPage() {
  type RequiredFieldKey =
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
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredFieldKey, string>>>({});
  const requiredFieldKeys: RequiredFieldKey[] = [
    'legalName',
    'registrationNumber',
    'addressLine1',
    'country',
    'contactFullName',
    'contactEmail',
    'contactPhone',
  ];

  React.useEffect(() => {
    let active = true;

    setForm(initial);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);

    const hydrateAddressSelections = async () => {
      const initialCountry = normalizeCountryValue(initial.country);
      const initialState = normalizeStateValue(initial.state);
      const initialCity = normalizeCityValue(initial.city);

      if (!initialCountry) return;

      const countries = (await GetCountries()) as Country[];
      if (!active) return;

      const countryMatch = countries.find(
        (country) =>
          country.iso2.toLowerCase() === initialCountry ||
          country.iso3.toLowerCase() === initialCountry ||
          country.name.toLowerCase() === initialCountry
      );

      if (!countryMatch) return;

      setSelectedCountry(countryMatch);
      setForm((prev) => ({ ...prev, country: countryMatch.iso2 }));

      if (!initialState) return;

      const states = (await GetState(countryMatch.id)) as State[];
      if (!active) return;

      const stateMatch = states.find(
        (state) =>
          state.state_code.toLowerCase() === initialState ||
          state.name.toLowerCase() === initialState
      );

      if (!stateMatch) return;

      setSelectedState(stateMatch);
      setForm((prev) => ({ ...prev, state: stateMatch.state_code || stateMatch.name }));

      if (!initialCity) return;

      const cities = (await GetCity(countryMatch.id, stateMatch.id)) as City[];
      if (!active) return;

      const cityMatch = cities.find((city) => city.name.toLowerCase() === initialCity);
      if (!cityMatch) return;

      setSelectedCity(cityMatch);
      setForm((prev) => ({ ...prev, city: cityMatch.name }));
    };

    void hydrateAddressSelections();

    return () => {
      active = false;
    };
  }, [initial]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (requiredFieldKeys.includes(k as RequiredFieldKey)) {
      setFieldErrors((prev) => ({ ...prev, [k as RequiredFieldKey]: undefined }));
    }
  };

  const validateRequiredFields = () => {
    const errors: Partial<Record<RequiredFieldKey, string>> = {};

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
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save organization details');
    } finally {
      setSaving(false);
    }
  };
  const toneClasses = "border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]";

  return (
    <PublicOnboardingLayout
      currentStep="organization"
      draftId={draftId}
      draft={draft}
      title="Tell us about your organization"
      description="All fields are required unless marked optional. Use your registered business name and address as on file with CAC."
    >
      <div className="animate-fade-in rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)] p-5 shadow-[var(--cs-shadow-lg)] md:p-7">

        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading && draftId ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={onNext} className="space-y-8">
            <section className="bg-[hsl(var(--landing-panel))] p-5">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Organization Details</h2>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <TextField label="Legal Business Name" value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={saving} error={fieldErrors.legalName} />
                </div>
                <div className="col-span-1">
                  <TextField label="RC / Registration Number" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} disabled={saving} error={fieldErrors.registrationNumber} />
                </div>
                <div className="col-span-1">
                  <TextField label="Trading Name" value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} disabled={saving} />
                </div>
                <div className="col-span-2">
                  <TextField className="  md:col-span-2" label="Address Line 1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={saving} error={fieldErrors.addressLine1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-semibold text-foreground">Country</label>
                  <CountrySelect
                    containerClassName={[toneClasses, fieldErrors.country ? 'border-[hsl(var(--destructive))]' : ''].join(' ')}
                    inputClassName={getSelectInputClassName(Boolean(fieldErrors.country))}
                    defaultValue={(selectedCountry ?? undefined) as any}
                    onChange={(country) => {
                      setSelectedCountry(country);
                      setSelectedState(null);
                      setSelectedCity(null);
                      setFieldErrors((prev) => ({ ...prev, country: undefined }));
                      setForm((prev) => ({
                        ...prev,
                        country: country.iso2,
                        state: '',
                        city: '',
                      }));
                    }}
                    placeHolder="Select country"
                    disabled={saving}
                  />
                  {fieldErrors.country && <p className="text-xs text-destructive">{fieldErrors.country}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-semibold text-foreground">State</label>
                  <StateSelect
                    countryid={selectedCountry?.id ?? 0}
                    containerClassName={toneClasses}
                    inputClassName={getSelectInputClassName()}
                    defaultValue={(selectedState ?? undefined) as any}
                    onChange={(state) => {
                      setSelectedState(state);
                      setSelectedCity(null);
                      setForm((prev) => ({
                        ...prev,
                        state: state.state_code || state.name,
                        city: '',
                      }));
                    }}
                    placeHolder={selectedCountry ? 'Select state' : 'Select country first'}
                    disabled={saving || !selectedCountry}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-semibold text-foreground">City</label>
                  <CitySelect
                    countryid={selectedCountry?.id ?? 0}
                    stateid={selectedState?.id ?? 0}
                    containerClassName={toneClasses}
                    inputClassName={getSelectInputClassName()}
                    defaultValue={(selectedCity ?? undefined) as any}
                    onChange={(city) => {
                      setSelectedCity(city);
                      set('city', city.name);
                    }}
                    placeHolder={selectedState ? 'Select city' : 'Select state first'}
                    disabled={saving || !selectedCountry || !selectedState}
                  />
                </div>                
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-foreground">Primary contact</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <TextField label="Full Name" value={form.contactFullName} onChange={(e) => set('contactFullName', e.target.value)} disabled={saving} error={fieldErrors.contactFullName} />
                </div>
                <TextField label="Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={saving} error={fieldErrors.contactEmail} />
                <TextField label="Phone" type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={saving} error={fieldErrors.contactPhone} />
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


