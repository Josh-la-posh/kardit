export type AffiliateBankPartnershipStatus =
  | 'ACTIVE'
  | 'PENDING_BANK_APPROVAL'
  | 'REJECTED'
  | 'INACTIVE'
  | string;

export interface AffiliateBankPartnership {
  bankId: string;
  bankName: string;
  partnershipStatus: AffiliateBankPartnershipStatus;
  rejectionReason?: string;
  lastUpdatedAt: string;
}

export interface GetAffiliateBankPartnershipsResponse {
  affiliateId: string;
  banks: AffiliateBankPartnership[];
}

export interface CreateBankPartnershipRequest {
  bankId: string;
  note: string;
}

export interface CreateBankPartnershipResponse {
  partnershipRequestId: string;
  affiliateId: string;
  bankId: string;
  status: AffiliateBankPartnershipStatus;
  requestedAt: string;
}
