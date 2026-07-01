export interface CustomerSearchRequestContext {
  actorUserId: string;
  userType: 'AFFILIATE' | 'SERVICE_PROVIDER' | 'BANK_ADMIN' | string;
  tenantId: string;
  scopeType: 'AFFILIATE_TENANT' | 'BANK_TENANT' | string;
}

export interface CustomerDraftRequestContext {
  requestId: string;
  affiliateId: string;
  tenantId: string;
}

export interface CreateCustomerDraftRequest {
  requestContext: CustomerDraftRequestContext;
  customer: {
    identity: {
      firstName: string;
      lastName: string;
      dob: string;
      phone: string;
      email: string;
      address: {
        line1: string;
        city: string;
        state: string;
        country: string;
      };
    };
    kyc: {
      idType: string;
      idNumber: string;
      kycLevel: string;
      verifiedAt?: string;
    };
  };
}

export interface CreateCustomerDraftResponse {
  customerId: string;
  status: string;
  savedAt: string;
}

export interface CustomerSearchCriteria {
  phone?: string | null;
  name?: string | null;
  customerRefId?: string | null;
  idType?: string | null;
  idNumber?: string | null;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface SearchCustomersRequest {
  requestContext?: CustomerSearchRequestContext;
  criteria: CustomerSearchCriteria;
  pagination: PaginationRequest;
}

export interface CustomerSearchResult {
  customerRefId: string;
  fullName: string;
  phone: string;
  email: string;
  kycLevel: string;
  createdAt: string;
}

export interface SearchCustomersResponse {
  page: number;
  pageSize: number;
  total: number;
  results: CustomerSearchResult[];
}

export interface CustomerDetailResponse {
  customerRefId: string;
  tenantId: string;
  affiliateId: string;
  identity: {
    firstName: string;
    lastName: string;
    dob: string;
    phone: string;
    email: string;
    address: {
      line1: string;
      city: string;
      state: string;
      country: string;
    };
  };
  kyc: {
    idType: string;
    idNumberMasked?: string | null;
    idNumber?: string | null;
    kycLevel: string;
    verifiedAt: string;
  };
  cards: Array<{
    cardId: string;
    productType: string;
    bankId: string;
    maskedPan: string;
    status: string;
    createdAt: string;
  }>;
}
