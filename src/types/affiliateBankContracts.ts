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

export interface QueryAffiliatePartnershipRequestsFilters {
  bankId?: string;
  affiliateId?: string;
  status?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface QueryAffiliatePartnershipRequestsRequest {
  filters: QueryAffiliatePartnershipRequestsFilters;
  page: number;
  pageSize: number;
}

export interface QueryAffiliatePartnershipRequestItem {
  partnershipRequestId: string;
  affiliateId: string;
  bankId: string;
  bankName?: string;
  status: AffiliateBankPartnershipStatus;
  note?: string;
  requestedAt: string;
  decisionedAt?: string;
}

export interface QueryAffiliatePartnershipRequestsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: QueryAffiliatePartnershipRequestItem[];
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
