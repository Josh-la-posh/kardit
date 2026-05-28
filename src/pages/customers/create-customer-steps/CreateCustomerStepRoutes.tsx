import { Navigate, useNavigate } from 'react-router-dom'
import CustomerDetailsStep from './CustomerDetailsStep'
import CardSelectionStep from './CardSelectionStep'
import ReviewStep from './ReviewStep'
import ResultStep from './ResultStep'
import { useCreateCustomerFlow } from './CreateCustomerFlowContext'

export function CustomerStepRoute() {
  const navigate = useNavigate()
  const flow = useCreateCustomerFlow()

  return (
    <CustomerDetailsStep
      customerForm={flow.customerForm}
      errors={flow.errors}
      customerValid={flow.customerValid}
      setCustomer={flow.setCustomer}
      selectedCountry={flow.selectedCountry}
      selectedState={flow.selectedState}
      selectedCity={flow.selectedCity}
      setSelectedCountry={flow.setSelectedCountry}
      setSelectedState={flow.setSelectedState}
      setSelectedCity={flow.setSelectedCity}
      phoneCode={flow.phoneCode}
      setPhoneCode={flow.setPhoneCode}
      onBack={() => navigate('/cards/issue')}
      onContinue={async () => {
        const ok = await flow.submitCustomerDraft()
        if (ok) navigate('/customers/create/card')
      }}
    />
  )
}

export function CardStepRoute() {
  const navigate = useNavigate()
  const flow = useCreateCustomerFlow()

  if (!flow.draftCustomerId) {
    return <Navigate to="/customers/create/customer" replace />
  }

  return (
    <CardSelectionStep
      bankSearch={flow.bankSearch}
      setBankSearch={flow.setBankSearch}
      searchBanksFromBackend={flow.searchBanksFromBackend}
      banksLoading={flow.banksLoading}
      banks={flow.banks}
      cardForm={flow.cardForm}
      errors={flow.errors}
      cardValid={flow.cardValid}
      setCard={flow.setCard}
      onBack={() => navigate('/customers/create/customer')}
      onContinue={() => {
        if (flow.validateCard()) navigate('/customers/create/review')
      }}
    />
  )
}

export function ReviewStepRoute() {
  const navigate = useNavigate()
  const flow = useCreateCustomerFlow()

  if (!flow.cardValid) {
    return <Navigate to="/customers/create/card" replace />
  }

  return (
    <ReviewStep
      fullName={flow.fullName}
      phone={flow.combinedPhone}
      email={flow.customerForm.email}
      state={flow.customerForm.state}
      bvn={flow.customerForm.idNumber}
      customerId={flow.draftCustomerId || undefined}
      bankName={flow.selectedBank?.bankDetails.name}
      bankCode={flow.selectedBank?.bankDetails.code}
      productName={flow.selectedProduct?.name}
      productCode={flow.selectedProduct?.code}
      cardType={flow.cardForm.cardType}
      currency={flow.cardForm.currency}
      busy={flow.busy}
      onBack={() => navigate('/customers/create/card')}
      onEditCustomer={() => navigate('/customers/create/customer')}
      onEditCard={() => navigate('/customers/create/card')}
      onIssue={async () => {
        const ok = await flow.handleIssue()
        if (ok) navigate('/customers/create/result')
      }}
    />
  )
}

export function ResultStepRoute() {
  const navigate = useNavigate()
  const flow = useCreateCustomerFlow()

  if (!flow.result) {
    return <Navigate to="/customers/create/review" replace />
  }

  return (
    <ResultStep
      customerId={flow.result.customerId}
      cardId={flow.result.cardId}
      onGoCustomers={() => navigate('/customers')}
      onGoCards={() => navigate('/cards/list')}
    />
  )
}
