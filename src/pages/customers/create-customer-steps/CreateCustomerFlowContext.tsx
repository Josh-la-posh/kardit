import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCreateCustomer } from '@/hooks/useCustomers'
import { useCreateCard } from '@/hooks/useCards'
import { getBankPartnershipsByAffiliate, resolveAffiliateId } from '@/services/affiliateBankApi'
import { approvedBanksCacheKey } from '@/lib/bankCache'
import type { PelpayCountry, PelpayState } from '@/services/locationApi'
import { CARD_PRODUCTS } from '@/stores/mockStore'

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
  selectedCountry: PelpayCountry | null
  selectedState: PelpayState | null
  setSelectedCountry: (v: PelpayCountry | null) => void
  setSelectedState: (v: PelpayState | null) => void
  phoneCode: string
  setPhoneCode: (v: string) => void
  customerValid: boolean
  validateCustomer: () => boolean
  bankSearch: string
  setBankSearch: (v: string) => void
  searchBanksFromBackend: (query: string) => Promise<void>
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
const CUSTOMER_BANKS_CACHE_KEY = 'kardit.affiliate.bank-catalog.v1'

type FlowBank = { bankId: string; bankDetails: { name: string; code: string } }

function mapBankItem(candidate: unknown): FlowBank | null {
  const bank = (candidate && typeof candidate === 'object' ? candidate : {}) as Record<string, unknown>
  const bankDetails =
    bank.bankDetails && typeof bank.bankDetails === 'object'
      ? (bank.bankDetails as Record<string, unknown>)
      : {}

  const bankId = String(bank.bankId || '').trim()
  const bankName = String(bankDetails.name || bank.bankName || '').trim()
  const bankCode = String(bankDetails.code || bank.bankCode || '').trim()
  const status = String(bank.status || bank.partnershipStatus || 'ACTIVE').trim()
  if (!bankId || !bankName || status !== 'ACTIVE') return null
  return {
    bankId,
    bankDetails: {
      name: bankName,
      code: bankCode,
    },
  }
}

function mergeUniqueBanks(current: FlowBank[], incoming: FlowBank[]) {
  const byId = new Map(current.map((bank) => [bank.bankId, bank]))
  for (const bank of incoming) byId.set(bank.bankId, bank)
  return Array.from(byId.values())
}

function isAtLeastAge(dateValue: string, minAge: number) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDelta = today.getMonth() - date.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }

  return age >= minAge
}

export function CreateCustomerFlowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
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
  const [selectedCountry, setSelectedCountry] = useState<PelpayCountry | null>(null)
  const [selectedState, setSelectedState] = useState<PelpayState | null>(null)
  const [phoneCode, setPhoneCode] = useState('+234')

  const [bankSearch, setBankSearch] = useState('')
  const [banks, setBanks] = useState<FlowBank[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [cardForm, setCardForm] = useState<CardForm>({
    bankId: '',
    productId: '',
    cardType: '',
    currency: 'NGN',
  })

  const saveBanksToCache = useCallback((affiliateId: string, items: FlowBank[]) => {
    window.localStorage.setItem(approvedBanksCacheKey(affiliateId), JSON.stringify(items))
    window.localStorage.setItem(`${CUSTOMER_BANKS_CACHE_KEY}:${affiliateId}`, JSON.stringify(items))
  }, [])

  useEffect(() => {
    let mounted = true

    const loadBanks = async () => {
      setBanksLoading(true)
      try {
        const affiliateId = resolveAffiliateId(user)
        const approvedCacheKey = approvedBanksCacheKey(affiliateId)
        const legacyCacheKey = `${CUSTOMER_BANKS_CACHE_KEY}:${affiliateId}`
        const raw = window.localStorage.getItem(approvedCacheKey) || window.localStorage.getItem(legacyCacheKey)
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as unknown[]
            const normalized = Array.isArray(parsed)
              ? parsed.map(mapBankItem).filter((bank): bank is FlowBank => Boolean(bank))
              : []

            if (normalized.length > 0) {
              if (mounted) setBanks(normalized)
              saveBanksToCache(affiliateId, normalized)
              return
            }
          } catch {
            window.localStorage.removeItem(approvedCacheKey)
            window.localStorage.removeItem(legacyCacheKey)
          }
        }

        const response = await getBankPartnershipsByAffiliate(affiliateId)
        const fetched = (response.banks || [])
          .map(mapBankItem)
          .filter((bank): bank is FlowBank => Boolean(bank))
        if (mounted) setBanks(fetched)
        saveBanksToCache(affiliateId, fetched)
      } catch {
        if (mounted) setBanks([])
      } finally {
        if (mounted) setBanksLoading(false)
      }
    }

    void loadBanks()
    return () => {
      mounted = false
    }
  }, [saveBanksToCache, user])

  const searchBanksFromBackend = useCallback(async (query: string) => {
    const term = query.trim().toLowerCase()
    if (!term) return

    const exists = banks.some((bank) => {
      const name = bank.bankDetails.name.toLowerCase()
      const code = bank.bankDetails.code.toLowerCase()
      return name.includes(term) || code.includes(term)
    })
    if (exists) return

    try {
      const affiliateId = resolveAffiliateId(user)
      setBanksLoading(true)
      const response = await getBankPartnershipsByAffiliate(affiliateId)
      const fetched = (response.banks || [])
        .map(mapBankItem)
        .filter((bank): bank is FlowBank => Boolean(bank))

      setBanks((prev) => {
        const merged = mergeUniqueBanks(prev, fetched)
        saveBanksToCache(affiliateId, merged)
        return merged
      })
    } catch {
      // Preserve current list when partnership refresh fails.
    } finally {
      setBanksLoading(false)
    }
  }, [banks, saveBanksToCache, user])

  const fullName = `${customerForm.firstName} ${customerForm.lastName}`.replace(/\s+/g, ' ').trim()
  const selectedBank = banks.find((bank) => bank.bankId === cardForm.bankId)
  const selectedProduct = CARD_PRODUCTS.find((product) => product.id === cardForm.productId)
  const selectedIdType = customerForm.idType

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
      customerForm.email.trim() &&
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
    else if (!isAtLeastAge(customerForm.dob, 14)) next.dob = 'Customer must be at least 14 years old'
    if (!combinedPhone) next.phone = 'Required'
    else if (!/^\+\d{7,20}$/.test(combinedPhone)) next.phone = 'Invalid phone'
    if (!customerForm.email.trim()) next.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) next.email = 'Invalid email'
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
      const email = customerForm.email.trim()

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
      const email = customerForm.email.trim()
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
    setSelectedCountry,
    setSelectedState,
    phoneCode,
    setPhoneCode,
    customerValid,
    validateCustomer,
    bankSearch,
    setBankSearch,
    searchBanksFromBackend,
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
  }), [errors, result, customerForm, setCustomer, selectedCountry, selectedState, phoneCode, customerValid, validateCustomer, bankSearch, banksLoading, banks, cardForm, setCard, cardValid, validateCard, fullName, selectedBank, selectedProduct, busy, draftCustomerId, submitCustomerDraft, handleIssue, combinedPhone, searchBanksFromBackend])

  return <CreateCustomerFlowContext.Provider value={value}>{children}</CreateCustomerFlowContext.Provider>
}

export function useCreateCustomerFlow() {
  const ctx = useContext(CreateCustomerFlowContext)
  if (!ctx) {
    throw new Error('useCreateCustomerFlow must be used within CreateCustomerFlowProvider')
  }
  return ctx
}
