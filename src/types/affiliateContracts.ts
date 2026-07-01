export type AffiliateType = 'EXTERNAL' | 'INTERNAL_BANK';

export interface AffiliateAdminContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateExternalAffiliateRequest {
  affiliateType: 'EXTERNAL';
  onboardingCaseId: string;
  legalName: string;
  shortName: string;
  adminContact: AffiliateAdminContact;
  selectedBankIds: string[];
}

export interface CreateInternalBankAffiliateRequest {
  affiliateType: 'INTERNAL_BANK';
  legalName: string;
  shortName: string;
  ownerBankId: string;
  isSystemManaged: boolean;
}

export type CreateAffiliateRequest = CreateExternalAffiliateRequest | CreateInternalBankAffiliateRequest;

export type CreateAffiliateResponse = CreateAffiliateRequest;

export interface AffiliateKybSnapshotDocument {
  documentId: string;
  documentType: string;
  verificationStatus: string;
}

export interface AffiliateKybSnapshot {
  caseId: string;
  status: string;
  documents: AffiliateKybSnapshotDocument[];
}

export interface GetAffiliateKybSnapshotResponse {
  affiliateId: string;
  onboardingSnapshot: AffiliateKybSnapshot;
}

export interface AffiliateProfile {
  affiliateType: string;
  affiliateId: string;
  tenantId: string;
  ownerBankId: string;
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isBankAffiliate: boolean;
  cardProductName: string;
  primaryContactFullName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}
