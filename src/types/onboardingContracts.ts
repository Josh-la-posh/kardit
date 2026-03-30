
// Request and response types for paginated onboarding case listing
export interface ListOnboardingCasesRequest {
  status?: OnboardingCaseStatus;
  page?: number;
  pageSize?: number;
}

export interface ListOnboardingCasesResponse {
  page: number;
  pageSize: number;
  total: number;
  cases: Array<{
    caseId: string;
    affiliateName: string;
    submittedAt: string;
    status: OnboardingCaseStatus;
  }>;
}
export interface SaveIssuingBanksRequest {
  onboardingSessionId: string;
  selectedBanks: { bankId: string }[];
}

export interface SaveIssuingBanksResponse {
  draftId: string;
  selectedBankCount: number;
  savedAt: string;
}

export type OnboardingDocumentType = 'CERTIFICATE_OF_INCORPORATION' | 'TAX_ID' | 'DIRECTORS_ID' | 'PROOF_OF_ADDRESS' | 'OTHER';

export type OnboardingCaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'CLARIFICATION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'PROVISIONED';

export interface CreateOnboardingSessionRequest {
  channel: 'web' | 'mobile' | string;
  email: string;
  phone: string;
  consentAccepted: boolean;
}

export interface CreateOnboardingSessionResponse {
  onboardingSessionId: string;
  draftId: string;
  expiresAt: string;
}

export interface SaveOrganizationRequest {
  onboardingSessionId: string;
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  address: {
    line1:string;
    city?: string;
    state?: string;
    country: string;
  }
  primaryContact: {
    fullName: string;
    email: string;
    phone: string;
  }
}

export interface SaveOrganizationResponse {
  draftId: string;
  status: string;
  savedAt: string;
}

export interface SaveContactRequest {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface UploadOnboardingDocumentRequest {
  onboardingSessionId: string;
  docType: OnboardingDocumentType;
  fileName: string;
  contentType: string;
  fileBase64: string;
}

export interface UploadOnboardingDocumentResponse {
  documentId: string;
  draftId: string;
  docType: OnboardingDocumentType;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  uploadedAt: string;
}

export interface OnboardingDocument {
  documentId: string;
  type: OnboardingDocumentType;
  fileName: string;
  uploadedAt: string;
  verificationStatus?: string;
}

export interface OnboardingDraft {
  draftId: string;
  onboardingSessionId: string;
  expiresAt: string;
  email: string;
  phone: string;
  consentAccepted: boolean;
  organization?: SaveOrganizationRequest;
  contact?: SaveContactRequest;
  documents: OnboardingDocument[];
  issuingBankIds: string[];
  submittedCaseId?: string;
}

export interface SubmitOnboardingDraftRequest {
  onboardingSessionId: string;
  declarations: {
    infoAccurate: boolean;
    authorizedSigner: boolean;
  };
}

export interface SubmitOnboardingDraftResponse {
  caseId: string;
  affiliateId: string;
  status: OnboardingCaseStatus;
  submittedAt: string;
}

export interface OnboardingCaseTimeline {
  status: OnboardingCaseStatus;
  at: string;
}

export interface OnboardingCaseMessage {
  from: string;
  type: string;
  text: string;
  at: string;
}

export interface OnboardingCase {
  caseId: string;
  draftId?: string;
  onboardingSessionId?: string;
  status: OnboardingCaseStatus;
  submittedAt: string;
  updatedAt: string;
  organization?: SaveOrganizationRequest;
  contact?: SaveContactRequest;
  documents: OnboardingDocument[];
  issuingBankIds: string[];
  timeline: OnboardingCaseTimeline[];
  messages: OnboardingCaseMessage[];
  reviewerNote?: string;
  decisionReason?: string;
  provisionedTenantId?: string;
  provisionedAdminEmail?: string;
  provisionedTemporaryPassword?: string;
}


export interface DecisionRequest {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION';
  reason?: string;
  reviewerNote?: string;
  reviewerNotes?: string;
  decisionReason?: string;
  selectedBanksApproved?: string[];
}

export interface DecisionResponse {
  caseId: string;
  status: OnboardingCaseStatus;
  decisionAt: string;
  decisionBy: {
    userId: string;
    name: string;
  };
}


export interface ProvisionOnboardingCaseRequest {
  userEmail?: string;
  adminContact: {
    fullName: string;
    email: string;
    phone: string;
  };
  deliveryChannels: string[];
}

export interface ProvisionOnboardingCaseResponse {
  caseId: string;
  affiliateId: string;
  tenantId: string;
  iamProvisioning: {
    status: string;
    loginUrl: string;
  };
  bankPartnershipRequests: Array<{
    bankId: string;
    status: string;
  }>;
  provisionedAt: string;
}

export type ProvisionResponse = ProvisionOnboardingCaseResponse;
