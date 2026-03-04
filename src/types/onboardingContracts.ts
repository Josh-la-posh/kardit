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
  type: OnboardingDocumentType;
  fileName: string;
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
  reason?: string;
  reviewerNote?: string;
}

export interface ProvisionResponse {
  tenantId: string;
  adminEmail: string;
  temporaryPassword: string;
  provisionedAt: string;
}
