import { ArrowLeft, ArrowRight } from 'lucide-react'
import { TextField } from '@/components/ui/text-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CitySelect, CountrySelect, StateSelect } from 'react-country-state-city'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import type { City, Country, State } from 'react-country-state-city/dist/esm/types'
import { ID_TYPES } from '@/stores/mockStore'

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
  selectedCountry: Country | null
  selectedState: State | null
  selectedCity: City | null
  setSelectedCountry: (v: Country | null) => void
  setSelectedState: (v: State | null) => void
  setSelectedCity: (v: City | null) => void
  phoneCode: string
  setPhoneCode: (v: string) => void
  onBack: () => void
  onContinue: () => void
}

export default function CustomerDetailsStep({
  customerForm,
  errors,
  customerValid,
  setCustomer,
  selectedCountry,
  selectedState,
  selectedCity,
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  phoneCode,
  setPhoneCode,
  onBack,
  onContinue,
}: Props) {
  return (
    <section className="src-main">
      <div className="container container--narrow">
        <header className="page-head">
          <div>
            <h1 className="page-title">Customer details</h1>
            <p className="page-sub">Identity, contact, address, KYC - same payload the issuance request embeds.</p>
          </div>
        </header>

        <form onSubmit={onContinue} className="card card-pad-lg" autoComplete="off">
          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">Identity</h2>
              <span className="form-section-meta">Required</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <TextField label="First name *" value={customerForm.firstName} onChange={(e) => setCustomer('firstName', e.target.value)} placeholder="Tunde" error={errors.firstName} />
              </div>
              <div className="field">
                <TextField label="Last name *" value={customerForm.lastName} onChange={(e) => setCustomer('lastName', e.target.value)} placeholder="Bakare" error={errors.lastName} />
              </div>
              <div className="field">
                <TextField label="Date of birth *" type="date" value={customerForm.dob} onChange={(e) => setCustomer('dob', e.target.value)} error={errors.dob} />
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
                <label>Mobile number<span className="req">*</span></label>
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
                  placeholder="8054420098"
                  inputClass={`!w-full !h-10 !pl-14 !rounded-[var(--cs-radius-sm)] !text-sm !bg-[var(--cs-bg-elevated)] !border ${errors.phone ? '!border-destructive' : '!border-[var(--cs-border-strong)]'}`}
                  buttonClass="!border-[var(--cs-border-strong)] !bg-[var(--cs-bg-elevated)] !rounded-l-[var(--cs-radius-sm)]"
                  dropdownClass="!bg-background !text-foreground"
                />
                {errors.phone ? <div className="help text-destructive">{errors.phone}</div> : <div className="help">Country code is selected automatically.</div>}
              </div>
              <div className="field">
                <TextField label="Email" type="email" value={customerForm.email} onChange={(e) => setCustomer('email', e.target.value)} placeholder="tunde.bakare@example.com" error={errors.email} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2 className="form-section-title">Address</h2>
              <span className="form-section-meta">Used for delivery if physical</span>
            </div>
            <div className="form-grid">
              <div className="field form-row-full">
                <TextField label="Street address *" value={customerForm.line1} onChange={(e) => setCustomer('line1', e.target.value)} placeholder="27 Awolowo Road, Ikoyi" error={errors.line1} />
              </div>
              <div className="field">
                <label>Country<span className="req">*</span></label>
                <CountrySelect
                  containerClassName={errors.country ? 'border border-destructive rounded-[var(--cs-radius-sm)]' : ''}
                  inputClassName="h-10 px-3 rounded-[var(--cs-radius-sm)] text-sm bg-[var(--cs-bg-elevated)] border border-[var(--cs-border-strong)]"
                  onChange={(country) => {
                    setSelectedCountry(country)
                    setSelectedState(null)
                    setSelectedCity(null)
                    setCustomer('country', country.name)
                    setCustomer('state', '')
                    setCustomer('city', '')
                  }}
                  placeHolder="Select country"
                  defaultValue={(selectedCountry ?? undefined) as any}
                />
                {errors.country && <div className="help text-destructive">{errors.country}</div>}
              </div>
              <div className="field">
                <label>State<span className="req">*</span></label>
                <StateSelect
                  countryid={selectedCountry?.id ?? 0}
                  containerClassName={errors.state ? 'border border-destructive rounded-[var(--cs-radius-sm)]' : ''}
                  inputClassName="h-10 px-3 rounded-[var(--cs-radius-sm)] text-sm bg-[var(--cs-bg-elevated)] border border-[var(--cs-border-strong)]"
                  onChange={(state) => {
                    setSelectedState(state)
                    setSelectedCity(null)
                    setCustomer('state', state.name)
                    setCustomer('city', '')
                  }}
                  placeHolder={selectedCountry ? 'Select state' : 'Select country first'}
                  defaultValue={(selectedState ?? undefined) as any}
                  disabled={!selectedCountry}
                />
                {errors.state && <div className="help text-destructive">{errors.state}</div>}
              </div>
              <div className="field">
                <label>City<span className="req">*</span></label>
                <CitySelect
                  countryid={selectedCountry?.id ?? 0}
                  stateid={selectedState?.id ?? 0}
                  containerClassName={errors.city ? 'border border-destructive rounded-[var(--cs-radius-sm)]' : ''}
                  inputClassName="h-10 px-3 rounded-[var(--cs-radius-sm)] text-sm bg-[var(--cs-bg-elevated)] border border-[var(--cs-border-strong)]"
                  onChange={(city) => {
                    setSelectedCity(city)
                    setCustomer('city', city.name)
                  }}
                  placeHolder={selectedState ? 'Select city' : 'Select state first'}
                  defaultValue={(selectedCity ?? undefined) as any}
                  disabled={!selectedCountry || !selectedState}
                />
                {errors.city && <div className="help text-destructive">{errors.city}</div>}
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
                <label htmlFor="idType">ID type<span className="req">*</span></label>
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
                <TextField label="ID number *" value={customerForm.idNumber} onChange={(e) => setCustomer('idNumber', e.target.value)} placeholder="A12345678" error={errors.idNumber} />
              </div>
            </div>
          </section>
          <div className="form-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <ArrowLeft /> Back
            </button>
            <button type="button" className="btn btn-primary" onClick={onContinue} disabled={!customerValid}>
              Save &amp; continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

