import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { City, Country, State } from 'react-country-state-city/dist/esm/types'
import { toast } from 'sonner'
import { useCreateCustomer } from '@/hooks/useCustomers'
import { useCreateCard } from '@/hooks/useCards'
import { useIssuingBanks } from '@/hooks/useIssuingBank'
import { CARD_PRODUCTS } from '@/stores/mockStore'

const ID_TYPE_TO_API: Record<string, string> = {
  nin: 'NationalId',
  passport: 'Passport',
  national_id: 'NationalId',
  driver_license: 'DriverLicense',
  residence_permit: 'ResidencePermit',
}

export type Step = 'customer' | 'card' | 'review' | 'result'

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

type CardForm = {
  bankId: string
  productId: string
  cardType: string
  currency: string
}

type FlowContextType = {
  errors: Record<string, string>
  setErrors: (v: Record<string, string>) => void
  result: { customerId: string; cardId: string } | null
  customerForm: CustomerForm
  setCustomer: (key: keyof CustomerForm, value: string) => void
  selectedCountry: Country | null
  selectedState: State | null
  selectedCity: City | null
  setSelectedCountry: (v: Country | null) => void
  setSelectedState: (v: State | null) => void
  setSelectedCity: (v: City | null) => void
  phoneCode: string
  setPhoneCode: (v: string) => void
  customerValid: boolean
  validateCustomer: () => boolean
  bankSearch: string
  setBankSearch: (v: string) => void
  banksLoading: boolean
  banks: Array<{ bankId: string; bankDetails: { name: string; code: string } }>
  cardForm: CardForm
  setCard: (key: keyof CardForm, value: string) => void
  cardValid: boolean
  validateCard: () => boolean
  fullName: string
  selectedBank?: { bankId: string; bankDetails: { name: string; code: string } }
  selectedProduct?: { id: string; name: string; code: string }
  busy: boolean
  draftCustomerId: string | null
  submitCustomerDraft: () => Promise<boolean>
  handleIssue: () => Promise<boolean>
  combinedPhone: string
}

const CreateCustomerFlowContext = createContext<FlowContextType | null>(null)

export function CreateCustomerFlowProvider({ children }: { children: ReactNode }) {
  const { createCustomerDraft, isLoading: creatingCustomer } = useCreateCustomer()
  const { createCard, isLoading: creatingCard } = useCreateCard()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ customerId: string; cardId: string } | null>(null)
  const [draftCustomerId, setDraftCustomerId] = useState<string | null>(null)

  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    line1: '',
    city: '',
    state: '',
    country: '',
    idType: '',
    idNumber: '',
  })
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedState, setSelectedState] = useState<State | null>(null)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [phoneCode, setPhoneCode] = useState('+234')

  const [bankSearch, setBankSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { banks, isLoading: banksLoading } = useIssuingBanks(debouncedSearch)
  const [cardForm, setCardForm] = useState<CardForm>({
    bankId: '',
    productId: '',
    cardType: '',
    currency: 'NGN',
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(bankSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [bankSearch])

  const fullName = `${customerForm.firstName} ${customerForm.lastName}`.replace(/\s+/g, ' ').trim()
  const selectedBank = banks.find((bank) => bank.bankId === cardForm.bankId)
  const selectedProduct = CARD_PRODUCTS.find((product) => product.id === cardForm.productId)
  const selectedIdType = ID_TYPE_TO_API[customerForm.idType]

  const combinedPhone = useMemo(() => {
    const local = customerForm.phone.trim().replace(/^\+/, '')
    const prefix = phoneCode.startsWith('+') ? phoneCode : `+${phoneCode}`
    return local ? `${prefix}${local}` : ''
  }, [customerForm.phone, phoneCode])

  const customerValid = useMemo(() => {
    return !!(
      customerForm.firstName.trim() &&
      customerForm.lastName.trim() &&
      customerForm.dob &&
      combinedPhone &&
      customerForm.line1.trim() &&
      customerForm.city.trim() &&
      customerForm.state.trim() &&
      customerForm.country.trim() &&
      customerForm.idType &&
      customerForm.idNumber.trim()
    )
  }, [customerForm, combinedPhone])

  const cardValid = !!(cardForm.bankId && cardForm.productId && cardForm.cardType)

  const setCustomer = useCallback((key: keyof CustomerForm, value: string) => {
    setCustomerForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }, [])

  const setCard = useCallback((key: keyof CardForm, value: string) => {
    setCardForm((prev) => {
      if (key === 'bankId') return { bankId: value, productId: '', cardType: '', currency: 'NGN' }
      if (key === 'productId') return { ...prev, productId: value, cardType: '', currency: 'NGN' }
      return { ...prev, [key]: value }
    })
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }, [])

  const validateCustomer = useCallback(() => {
    const next: Record<string, string> = {}
    if (!customerForm.firstName.trim()) next.firstName = 'Required'
    if (!customerForm.lastName.trim()) next.lastName = 'Required'
    if (!customerForm.dob) next.dob = 'Required'
    if (!combinedPhone) next.phone = 'Required'
    else if (!/^\+\d{7,20}$/.test(combinedPhone)) next.phone = 'Invalid phone'
    if (customerForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) next.email = 'Invalid email'
    if (!customerForm.line1.trim()) next.line1 = 'Required'
    if (!customerForm.city.trim()) next.city = 'Required'
    if (!customerForm.state.trim()) next.state = 'Required'
    if (!customerForm.country.trim()) next.country = 'Required'
    if (!customerForm.idType) next.idType = 'Required'
    if (!customerForm.idNumber.trim()) next.idNumber = 'Required'

    setErrors(next)
    return Object.keys(next).length === 0
  }, [customerForm, combinedPhone])

  const validateCard = useCallback(() => {
    const next: Record<string, string> = {}
    if (!cardForm.bankId) next.bankId = 'Select a bank'
    if (!cardForm.productId) next.productId = 'Select a product'
    if (!cardForm.cardType) next.cardType = 'Select a card type'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [cardForm])

  const handleIssue = useCallback(async () => {
    if (!validateCard()) return false
    if (!selectedBank || !selectedProduct) {
      toast.error('Please complete your selections before issuing card.')
      return false
    }
    if (!draftCustomerId) {
      toast.error('Customer draft is missing. Please complete customer details first.')
      return false
    }

    setSubmitting(true)
    try {
      const fallbackEmail = `${customerForm.firstName.toLowerCase()}.${customerForm.lastName.toLowerCase()}@no-email.local`
      const email = customerForm.email.trim() || fallbackEmail

      const cardRes = await createCard({
        customerId: draftCustomerId,
        bankId: selectedBank.bankId,
        issuingBankName: selectedBank.bankDetails.name,
        productId: selectedProduct.id,
        productType: cardForm.cardType,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        currency: cardForm.currency,
        embossName: fullName.toUpperCase(),
        customerIdentity: {
          firstName: customerForm.firstName.trim(),
          lastName: customerForm.lastName.trim(),
          dob: customerForm.dob,
          phone: combinedPhone,
          email,
        },
        customerKyc: {
          idType: customerForm.idType,
          idNumber: customerForm.idNumber.trim(),
          kycLevel: 'LEVEL_2',
        },
      })

      setResult({ customerId: draftCustomerId, cardId: cardRes.id })
      toast.success('Customer and card created successfully.')
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete issuance flow')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [validateCard, selectedBank, selectedProduct, draftCustomerId, customerForm, combinedPhone, createCard, cardForm, fullName])

  const submitCustomerDraft = useCallback(async () => {
    if (!validateCustomer()) return false
    if (!selectedIdType) {
      toast.error('Please select a valid ID type.')
      return false
    }

    setSubmitting(true)
    try {
      const fallbackEmail = `${customerForm.firstName.toLowerCase()}.${customerForm.lastName.toLowerCase()}@no-email.local`
      const email = customerForm.email.trim() || fallbackEmail
      const dobIso = new Date(customerForm.dob).toISOString()

      const customerRes = await createCustomerDraft({
        firstName: customerForm.firstName.trim(),
        lastName: customerForm.lastName.trim(),
        dob: dobIso,
        phone: combinedPhone,
        email,
        address: {
          line1: customerForm.line1.trim(),
          city: customerForm.city.trim(),
          state: customerForm.state.trim(),
          country: customerForm.country.trim(),
        },
        kyc: {
          idType: selectedIdType,
          idNumber: customerForm.idNumber.trim(),
          kycLevel: 'LEVEL_1',
          verifiedAt: new Date().toISOString(),
        },
      })

      setDraftCustomerId(customerRes.customerId)
      toast.success('Customer draft created successfully.')
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create customer draft')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [validateCustomer, selectedIdType, customerForm, combinedPhone, createCustomerDraft])

  const busy = creatingCustomer || creatingCard || submitting

  const value = useMemo<FlowContextType>(() => ({
    errors,
    setErrors,
    result,
    customerForm,
    setCustomer,
    selectedCountry,
    selectedState,
    selectedCity,
    setSelectedCountry,
    setSelectedState,
    setSelectedCity,
    phoneCode,
    setPhoneCode,
    customerValid,
    validateCustomer,
    bankSearch,
    setBankSearch,
    banksLoading,
    banks,
    cardForm,
    setCard,
    cardValid,
    validateCard,
    fullName,
    selectedBank,
    selectedProduct,
    busy,
    draftCustomerId,
    submitCustomerDraft,
    handleIssue,
    combinedPhone,
  }), [errors, result, customerForm, setCustomer, selectedCountry, selectedState, selectedCity, phoneCode, customerValid, validateCustomer, bankSearch, banksLoading, banks, cardForm, setCard, cardValid, validateCard, fullName, selectedBank, selectedProduct, busy, draftCustomerId, submitCustomerDraft, handleIssue, combinedPhone])

  return <CreateCustomerFlowContext.Provider value={value}>{children}</CreateCustomerFlowContext.Provider>
}

export function useCreateCustomerFlow() {
  const ctx = useContext(CreateCustomerFlowContext)
  if (!ctx) {
    throw new Error('useCreateCustomerFlow must be used within CreateCustomerFlowProvider')
  }
  return ctx
}
