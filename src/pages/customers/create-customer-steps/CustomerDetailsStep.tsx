import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { TextField } from '@/components/ui/text-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { getCountriesWithStates, type PelpayCountry, type PelpayState } from '@/services/locationApi'
import { ID_TYPES } from '@/stores/mockStore'

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMinimumDobForAge(minAge: number) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - minAge)
  return formatDateInputValue(date)
}

type CustomerForm = {
  firstName: string
  lastName: string
  dob: string
  phone: string
  email: string
  line1: string
  city: string
  state: string
  country: string
  idType: string
  idNumber: string
}

type Props = {
  customerForm: CustomerForm
  errors: Record<string, string>
  customerValid: boolean
  setCustomer: (key: keyof CustomerForm, value: string) => void
  selectedCountry: PelpayCountry | null
  selectedState: PelpayState | null
  setSelectedCountry: (v: PelpayCountry | null) => void
  setSelectedState: (v: PelpayState | null) => void
  phoneCode: string
  setPhoneCode: (v: string) => void
  busy: boolean
  onBack: () => void
  onContinue: () => void
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <>
      {children}<span className="text-destructive"> *</span>
    </>
  )
}

export default function CustomerDetailsStep({
  customerForm,
  errors,
  customerValid,
  setCustomer,
  selectedCountry,
  selectedState,
  setSelectedCountry,
  setSelectedState,
  phoneCode,
  setPhoneCode,
  busy,
  onBack,
  onContinue,
}: Props) {
  const maxDob = getMinimumDobForAge(14)
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
  } = useQuery({
    queryKey: ['pelpay-countries'],
    queryFn: getCountriesWithStates,
    staleTime: 1000 * 60 * 30,
  })
  const availableStates = selectedCountry?.states ?? []
  const selectTriggerClassName = (hasError?: boolean) =>
    [
      'h-10 rounded-[var(--cs-radius-sm)] border bg-[var(--cs-bg-elevated)] text-sm',
      hasError ? 'border-destructive' : 'border-[var(--cs-border-strong)]',
    ].join(' ')

  return (
    <section className="scr-main">
      <div className="container container--narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">Customer details</h1>
            <p className="page-sub">Identity, contact, address, KYC - same payload the issuance request embeds.</p>
          </div>
        </header>

        <AppCard padded="lg">
          <AppCardHeader style={{ marginBottom: 12 }}>
            <div>
              <AppCardTitle>Capture customer information</AppCardTitle>
              <AppCardSub>All required fields must be completed before you continue.</AppCardSub>
            </div>
          </AppCardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (busy) return
            onContinue()
          }}
          className="card-pad-lg"
          autoComplete="off"
        >
          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">Identity</h2>
              <span className="form-section-meta">Required</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <TextField required label={<RequiredLabel>First name</RequiredLabel>} value={customerForm.firstName} onChange={(e) => setCustomer('firstName', e.target.value)} placeholder="Tunde" error={errors.firstName} />
              </div>
              <div className="field">
                <TextField required label={<RequiredLabel>Last name</RequiredLabel>} value={customerForm.lastName} onChange={(e) => setCustomer('lastName', e.target.value)} placeholder="Bakare" error={errors.lastName} />
              </div>
              <div className="field">
                <TextField
                  required
                  label={<RequiredLabel>Date of birth</RequiredLabel>}
                  type="date"
                  value={customerForm.dob}
                  max={maxDob}
                  onChange={(e) => setCustomer('dob', e.target.value)}
                  error={errors.dob}
                  hint=""
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">Contact</h2>
              <span className="form-section-meta">Phone required</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Mobile number<span className="text-destructive"> *</span></label>
                <PhoneInput
                  country="ng"
                  value={`${phoneCode.replace('+', '')}${customerForm.phone}`}
                  onChange={(value, data) => {
                    const dialCode = `+${data.dialCode ?? ''}`
                    const localNumber = value.slice((data.dialCode ?? '').length)
                    setPhoneCode(dialCode)
                    setCustomer('phone', localNumber)
                  }}
                  enableSearch
                  countryCodeEditable={false}
                  inputProps={{ required: true }}
                  placeholder="8054420098"
                  inputClass={`!w-full !h-10 !pl-14 !rounded-[var(--cs-radius-sm)] !text-sm !bg-[var(--cs-bg-elevated)] !border ${errors.phone ? '!border-destructive' : '!border-[var(--cs-border-strong)]'}`}
                  buttonClass="!border-[var(--cs-border-strong)] !bg-[var(--cs-bg-elevated)] !rounded-l-[var(--cs-radius-sm)]"
                  dropdownClass="!bg-background !text-foreground"
                />
                {errors.phone ? <div className="help text-destructive">{errors.phone}</div> : <div className="help">Country code is selected automatically.</div>}
              </div>
              <div className="field">
                <TextField required label={<RequiredLabel>Email</RequiredLabel>} type="email" value={customerForm.email} onChange={(e) => setCustomer('email', e.target.value)} placeholder="tunde.bakare@example.com" error={errors.email} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">Address</h2>
              {/* <span className="form-section-meta">Used for delivery if physical</span> */}
            </div>
            <div className="form-grid">
              <div className="field form-row-full">
                <TextField required label={<RequiredLabel>Street address</RequiredLabel>} value={customerForm.line1} onChange={(e) => setCustomer('line1', e.target.value)} placeholder="27 Awolowo Road, Ikoyi" error={errors.line1} />
              </div>
              <div className="field">
                <label>Country<span className="text-destructive"> *</span></label>
                <Select
                  value={selectedCountry?.id ?? customerForm.country}
                  onValueChange={(countryId) => {
                    const country = countries.find((item) => item.id === countryId) ?? null
                    setSelectedCountry(country)
                    setSelectedState(null)
                    setCustomer('country', country?.id ?? '')
                    setCustomer('state', '')
                    setCustomer('city', '')
                  }}
                  disabled={isLoadingCountries || !countries.length}
                >
                  <SelectTrigger className={selectTriggerClassName(Boolean(errors.country))}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>{country.countryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <div className="help text-destructive">{errors.country}</div>}
              </div>
              <div className="field">
                <label>State<span className="text-destructive"> *</span></label>
                <Select
                  value={selectedState?.id ?? customerForm.state}
                  onValueChange={(stateId) => {
                    const state = availableStates.find((item) => item.id === stateId) ?? null
                    setSelectedState(state)
                    setCustomer('state', state?.id ?? '')
                    setCustomer('city', '')
                  }}
                  disabled={!selectedCountry || !availableStates.length}
                >
                  <SelectTrigger className={selectTriggerClassName(Boolean(errors.state))}>
                    <SelectValue placeholder={selectedCountry ? 'Select state' : 'Select country first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStates.map((state) => (
                      <SelectItem key={state.id} value={state.id}>{state.stateName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <div className="help text-destructive">{errors.state}</div>}
              </div>
              <div className="field">
                <TextField required label={<RequiredLabel>City</RequiredLabel>} value={customerForm.city} onChange={(e) => setCustomer('city', e.target.value)} placeholder="Ikeja" error={errors.city} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">KYC identifiers</h2>
              <span className="form-section-meta">ID required</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="idType">ID type<span className="text-destructive"> *</span></label>
                <Select value={customerForm.idType} onValueChange={(v) => setCustomer('idType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.idType && <div className="help text-destructive">{errors.idType}</div>}
              </div>
              <div className="field is-mono">
                <TextField required label={<RequiredLabel>ID number</RequiredLabel>} value={customerForm.idNumber} onChange={(e) => setCustomer('idNumber', e.target.value)} placeholder="A12345678" error={errors.idNumber} />
              </div>
            </div>
          </section>
          <div className="form-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <ArrowLeft /> Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={!customerValid || busy}>
              {busy ? 'Saving...' : 'Save & continue'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
        </AppCard>
      </div>
    </section>
  )
}
