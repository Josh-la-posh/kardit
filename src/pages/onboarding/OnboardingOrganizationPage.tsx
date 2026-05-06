import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { CitySelect, CountrySelect, GetCity, GetCountries, GetState, StateSelect } from 'react-country-state-city';
import type { City, Country, State } from 'react-country-state-city/dist/esm/types';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Loader2 } from 'lucide-react';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

function normalizeCountryValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeStateValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCityValue(value: string) {
  return value.trim().toLowerCase();
}

function getSelectInputClassName() {
  return 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
}

export default function OnboardingOrganizationPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, updateOrganization } = useOnboardingDraft(draftId);

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

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!draftId || !draft) return;

    if (!form.legalName || !form.registrationNumber || !form.country || !form.addressLine1 || !form.contactFullName || !form.contactEmail || !form.contactPhone) {
      setLocalError('Please complete all required fields');
      return;
    }

    setSaving(true);
    try {
      if (!draft?.onboardingSessionId) {
        setLocalError('Missing onboarding session ID. Please restart onboarding.');
        return;
      }
      await updateOrganization({
        onboardingSessionId: draft.onboardingSessionId,
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
      });
      navigate(`/onboarding/${draftId}/documents`);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save organization details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicOnboardingLayout
      currentStep="organization"
      draftId={draftId}
      draft={draft}
      title="Organization & contact details"
      description="Provide the core business and contact information required to begin your affiliate KYB review."
    >
      <div className="animate-fade-in">

        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={onNext} className="space-y-8">
            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Business information</h3>
                <p className="mt-1 text-sm text-slate-600">Enter the official details exactly as they appear in your registration records.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Legal Name" value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={saving} />
                <TextField label="Trading Name" value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} disabled={saving} />
                <TextField label="Registration Number" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} disabled={saving} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Country</label>
                  <CountrySelect
                    containerClassName="border-none "
                    inputClassName={getSelectInputClassName()}
                    defaultValue={(selectedCountry ?? undefined) as any}
                    onChange={(country) => {
                      setSelectedCountry(country);
                      setSelectedState(null);
                      setSelectedCity(null);
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">State</label>
                  <StateSelect
                    countryid={selectedCountry?.id ?? 0}
                    containerClassName="w-full"
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
                  <label className="text-sm font-medium text-slate-900">City</label>
                  <CitySelect
                    countryid={selectedCountry?.id ?? 0}
                    stateid={selectedState?.id ?? 0}
                    containerClassName="w-full "
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
                <TextField className="  md:col-span-2" label="Address Line 1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={saving} />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Primary contact</h3>
                <p className="mt-1 text-sm text-slate-600">We will use this contact for onboarding communication and verification updates.</p>
              </div>
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contact details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField label="Full Name" value={form.contactFullName} onChange={(e) => set('contactFullName', e.target.value)} disabled={saving} />
                  <TextField label="Email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} disabled={saving} />
                  <TextField label="Phone" type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={saving} />
                </div>
              </div>
            </section>

            <div className="flex flex-col justify-end gap-3 border-t border-[#e6eee7] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={() => navigate('/onboarding/start')} disabled={saving}>Cancel</Button>
              <Button type="submit" className="h-11 rounded-xl px-6" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save and continue'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
