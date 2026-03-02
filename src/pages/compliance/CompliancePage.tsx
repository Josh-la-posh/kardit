import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/AppLayout';

interface FormData {
  // Step 1: Personal Information
  fullName: string
  email: string
  phone: string
  dob: string
  address: string
  
  // Step 2: Business Information
  businessName: string
  tradingName?: string
  rcNumber: string
  tinNumber?: string
  businessType: string
  businessRegistration: string
  ownershipType?: string
  website?: string
  
  // Step 3: Compliance Documentation
  identityDocument: string
  proofOfAddress: string
  businessLicense: string
  
  // Step 4: Risk Assessment
  businessActivity: string
  projectedSalesVolume: string
  complianceRisk: string
  
  // Step 5: Verification
  termsAccepted: boolean
  privacyAccepted: boolean
}

const CompliancePage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    businessName: '',
    tradingName: '',
    rcNumber: '',
    tinNumber: '',
    businessType: '',
    businessRegistration: '',
    ownershipType: '',
    website: '',
    identityDocument: '',
    proofOfAddress: '',
    businessLicense: '',
    businessActivity: '',
    projectedSalesVolume: '',
    complianceRisk: '',
    termsAccepted: false,
    privacyAccepted: false,
  })

  const [submitted, setSubmitted] = useState(false)
  const totalSteps = 5

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const isStep1Valid = formData.fullName && formData.email && formData.phone && formData.dob && formData.address
  const isStep2Valid = formData.businessName && formData.businessType && formData.businessRegistration && formData.rcNumber && formData.tinNumber && formData.ownershipType && formData.website 
  const isStep3Valid = formData.identityDocument && formData.proofOfAddress && formData.businessLicense
  const isStep4Valid = formData.businessActivity && formData.projectedSalesVolume && formData.complianceRisk
  const isStep5Valid = formData.termsAccepted && formData.privacyAccepted

  const canContinue = () => {
    switch (currentStep) {
      case 1: return isStep1Valid
      case 2: return isStep2Valid
      case 3: return isStep3Valid
      case 4: return isStep4Valid
      case 5: return isStep5Valid
      default: return false
    }
  }

  const handleNext = () => {
    if (canContinue() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = () => {
    if (canContinue()) {
      console.log('Form submitted:', formData)
      setSubmitted(true)
      window.scrollTo(0, 0)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Form Submitted</h1>
              <p className="text-gray-600 mb-2">Your submission has been received successfully.</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6 text-left">
                <h3 className="font-semibold text-yellow-900 mb-2">Status: Under Review</h3>
                <p className="text-sm text-yellow-800 mb-3">Your compliance form is currently being reviewed by our team. This typically takes 2-5 business days.</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>✓ Form submission received</li>
                  <li>⏳ Documents verification in progress</li>
                  <li>⏳ Compliance review pending</li>
                  <li>⏳ Approval decision pending</li>
                </ul>
              </div>

              <p className="text-gray-600 mb-6 text-sm">You will receive an email notification once your application has been reviewed. You can also check your status on the dashboard.</p>
              
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Go Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in min-h-screen">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Compliance Form</h1>
              <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex gap-2 mb-4">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      index < currentStep ? 'bg-primary' : index === currentStep - 1 ? 'bg-primary/50' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Personal Info</span>
                <span>Business Info</span>
                <span>Documentation</span>
                <span>Risk Assessment</span>
                <span>Verification</span>
              </div>
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-lg">
              <div className="p-8">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold  mb-6">Personal Information</h2>
                    </div>

                    <div>
                      <Label htmlFor="fullName" className="text-gray-700 font-semibold mb-2 block">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-semibold mb-2 block">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-gray-700 font-semibold mb-2 block">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dob" className="text-gray-700 font-semibold mb-2 block">Date of Birth *</Label>
                      <Input 
                        id="dob"
                        name="dob"
                        type="date" 
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-gray-700 font-semibold mb-2 block">Residential Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your residential address"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Business Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold  mb-6">Business Information</h2>
                    </div>

                    <div>
                      <Label htmlFor="businessName" className="text-gray-700 font-semibold mb-2 block">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Enter your business name"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessType" className="text-gray-700 font-semibold mb-2 block">Business Type *</Label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={(e) => handleSelectChange('businessType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a business type</option>
                        <option value="sole-proprietorship">Sole Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="llc">LLC</option>
                        <option value="corporation">Corporation</option>
                        <option value="non-profit">Non-Profit</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="rcNumber" className="text-gray-700 font-semibold mb-2 block">RC Number *</Label>
                      <Input
                        id="rcNumber"
                        name="rcNumber"
                        value={formData.rcNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your RC number"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tinNumber" className="text-gray-700 font-semibold mb-2 block">TIN Number *</Label>
                      <Input
                        id="tinNumber"
                        name="tinNumber"
                        value={formData.tinNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your TIN number"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ownershipType" className="text-gray-700 font-semibold mb-2 block">Ownership Type *</Label>
                      <select
                        id="ownershipType"
                        name="ownershipType"
                        value={formData.ownershipType}
                        onChange={(e) => handleSelectChange('ownershipType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select ownership type</option>
                        <option value="individual">Individual</option>
                        <option value="joint">Joint</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="businessRegistration" className="text-gray-700 font-semibold mb-2 block">Business Registration Number *</Label>
                      <Input
                        id="businessRegistration"
                        name="businessRegistration"
                        value={formData.businessRegistration}
                        onChange={handleInputChange}
                        placeholder="Enter your registration number"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-gray-700 font-semibold mb-2 block">Business Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="Enter your business website (optional)"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Documentation */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold  mb-6">Required Documentation</h2>
                    </div>

                    <div>
                      <Label htmlFor="identityDocument" className="text-gray-700 font-semibold mb-2 block">Identity Document Type *</Label>
                      <select
                        id="identityDocument"
                        name="identityDocument"
                        value={formData.identityDocument}
                        onChange={(e) => handleSelectChange('identityDocument', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700  rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a document type</option>
                        <option value="passport">Passport</option>
                        <option value="drivers-license">Driver's License</option>
                        <option value="national-id">National ID</option>
                        <option value="birth-certificate">Birth Certificate</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="proofOfAddress" className="text-gray-700 font-semibold mb-2 block">Proof of Address *</Label>
                      <select
                        id="proofOfAddress"
                        name="proofOfAddress"
                        value={formData.proofOfAddress}
                        onChange={(e) => handleSelectChange('proofOfAddress', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a document type</option>
                        <option value="utility-bill">Utility Bill</option>
                        <option value="bank-statement">Bank Statement</option>
                        <option value="lease-agreement">Lease Agreement</option>
                        <option value="property-tax">Property Tax Document</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="businessLicense" className="text-gray-700 font-semibold mb-2 block">Business License *</Label>
                      <select
                        id="businessLicense"
                        name="businessLicense"
                        value={formData.businessLicense}
                        onChange={(e) => handleSelectChange('businessLicense', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select document availability</option>
                        <option value="uploaded">License Uploaded</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Risk Assessment */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold  mb-6">Risk Assessment</h2>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-semibold mb-4 block">Primary Business Activity *</Label>
                      <RadioGroup value={formData.businessActivity} onValueChange={(value) => handleSelectChange('businessActivity', value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="financial-services" id="financial-services" />
                          <Label htmlFor="financial-services" className="font-normal cursor-pointer">Financial Services</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ecommerce" id="ecommerce" />
                          <Label htmlFor="ecommerce" className="font-normal cursor-pointer">E-Commerce</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="real-estate" id="real-estate" />
                          <Label htmlFor="real-estate" className="font-normal cursor-pointer">Real Estate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cryptocurrency" id="cryptocurrency" />
                          <Label htmlFor="cryptocurrency" className="font-normal cursor-pointer">Cryptocurrency/Digital Assets</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="estimatedAnnualVolume" className="text-gray-700 font-semibold mb-2 block">Estimated Annual Transaction Volume *</Label>
                      <select
                        id="projectedSalesVolume"
                        name="projectedSalesVolume"
                        value={formData.projectedSalesVolume}
                        onChange={(e) => handleSelectChange('projectedSalesVolume', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a range</option>
                        <option value="0-100k">$0 - $100,000</option>
                        <option value="100k-500k">$100,000 - $500,000</option>
                        <option value="500k-1m">$500,000 - $1,000,000</option>
                        <option value="1m-5m">$1,000,000 - $5,000,000</option>
                        <option value="5m+">$5,000,000+</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-semibold mb-4 block">Compliance Risk Level *</Label>
                      <RadioGroup value={formData.complianceRisk} onValueChange={(value) => handleSelectChange('complianceRisk', value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low-risk" />
                          <Label htmlFor="low-risk" className="font-normal cursor-pointer">Low Risk</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium-risk" />
                          <Label htmlFor="medium-risk" className="font-normal cursor-pointer">Medium Risk</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high-risk" />
                          <Label htmlFor="high-risk" className="font-normal cursor-pointer">High Risk</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 5: Verification */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold  mb-6">Verification & Consent</h2>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">Please review all information before submitting. Ensure all details are accurate and complete.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))}
                          className="mt-1"
                        />
                        <Label htmlFor="terms" className="font-normal cursor-pointer">
                          I agree to the Terms and Conditions and understand that I am responsible for maintaining compliance with all applicable laws and regulations. *
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="privacy"
                          name="privacyAccepted"
                          checked={formData.privacyAccepted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privacyAccepted: checked as boolean }))}
                          className="mt-1"
                        />
                        <Label htmlFor="privacy" className="font-normal cursor-pointer">
                          I have read and agree to the Privacy Policy. I understand how my data will be collected, used, and protected. *
                        </Label>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700  mb-2">Submission Summary</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Personal information provided</li>
                        <li>✓ Business information verified</li>
                        <li>✓ Required documentation uploaded</li>
                        <li>✓ Risk assessment completed</li>
                        <li>✓ All consents accepted</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="border-t  px-8 py-6 flex justify-between items-center rounded-b-lg">
                <Button
                  onClick={handlePrev}
                  variant="outline"
                  disabled={currentStep === 1}
                  className="min-w-32"
                >
                  Previous
                </Button>

                <div className="text-sm text-gray-600">
                  Step {currentStep} of {totalSteps}
                </div>

                {currentStep === totalSteps ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canContinue()}
                    className="min-w-32 bg-primary text-white hover:bg-primary/90"
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canContinue()}
                    className="min-w-32 bg-primary text-white hover:bg-primary/90"
                  >
                    Next
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default CompliancePage
