
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
  | 'UNDER_REVIEW'
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
  legalName: string;
  registrationNumber: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
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

export interface OnboardingDocument {
  documentId: string;
  type: OnboardingDocumentType;
  fileName: string;
  uploadedAt: string;
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

export interface OnboardingCase {
  caseId: string;
  draftId: string;
  onboardingSessionId: string;
  status: OnboardingCaseStatus;
  submittedAt: string;
  updatedAt: string;
  organization?: SaveOrganizationRequest;
  contact?: SaveContactRequest;
  documents: OnboardingDocument[];
  issuingBankIds: string[];
  reviewerNote?: string;
  decisionReason?: string;
  provisionedTenantId?: string;
  provisionedAdminEmail?: string;
  provisionedTemporaryPassword?: string;
}


export interface DecisionRequest {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION';
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
