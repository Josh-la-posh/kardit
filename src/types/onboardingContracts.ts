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
  onboardingSessionId: string;
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
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

export interface SelectedIssuingBanksRequest{
onboardingSessionId: string;
selectedBanks: Array<{bankId: string}>;
}

export interface SelectedIssuingBanksResponse{
  draftId: string;
  selectedBankCount: number;
  savedAt: string;
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

export interface OnboardingCaseTimeline{
  status: OnboardingCaseStatus;
  at: string;
}
export interface OnboardingCaseMessage{
  from: string;
  type: string;
  text: string;
  at: string;
}
// export interface OnboardingCaseResponse {
//   caseId: string;
//   status: string;
//   timeline: OnboardingCaseTimeline[];
//   messages: OnboaedingCaseMessage[];
// }
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
  timeline: OnboardingCaseTimeline[];
  messages: OnboardingCaseMessage[];
  reviewerNote?: string;
  decisionReason?: string;
  provisionedTenantId?: string;
  provisionedAdminEmail?: string;
  provisionedTemporaryPassword?: string;
  affiliateName?: string;
  decisionAt: string;
  decisionBy: {
    userId: string;
    name: string;
  }
}

export interface ListOnboardingCasesRequest{
  status?: OnboardingCaseStatus;
  page?: number;
  pageSize?: number;
}

export interface ListOnboardingCasesResponse{
  page: number;
  pageSize: number;
  total: number;
  cases: OnboardingCase[];
}

export interface DecisionRequest {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION';
  reviewerNote?: string;
  decisionReason?: string;
  selectedBanksApproved?: Array<{bankId: string}>;
}

export interface ProvisionResponse {
  caseId: string;
  affiliateId: string;
  tenantId: string;
  iamProvisioning: {
    status: "TRIGGERED" | string;
    loginUrl?: string;
  };
  bankPartnershipRequests: Array<{
    bankId: string;
    status: "PENDING_BANK_APPROVAL" | string;
  }>;
  provisionedAt: string;
}
