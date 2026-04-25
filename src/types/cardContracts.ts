export interface CardRequestContext {
  requestId: string;
  tenantId: string;
  affiliateId?: string;
  actorUserId?: string;
  userType?: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
  role?: string;
  idempotencyKey?: string;
}

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface ValueAmount {
  value: number;
  currency: string;
}

export interface ExternalCmsReference {
  cmsReference: string;
}

export interface CreateCardRequest {
  requestContext: {
    requestId: string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  issuance: {
    bankId: string;
    productId: string;
    productType: string;
    currency: string;
  };
  customer: {
    customerId: string;
    embeddedPayload: {
      identity: {
        firstName: string;
        lastName: string;
        dob: string;
        phone: string;
        email: string;
      };
      kyc: {
        idType: string;
        idNumber: string;
        kycLevel: string;
      };
    };
  };
}

export interface CardListItem {
  cardId: string;
  bankId?: string;
  affiliateId?: string;
  customerId?: string;
  customerRefId?: string;
  productId?: string;
  cardType?: string;
  productType?: string;
  productName?: string;
  productCode?: string;
  status: string;
  maskedPan: string;
  currency?: string;
  embossName?: string;
  deliveryMethod?: string;
  createdAt?: string;
  issuedAt?: string;
}

export type CardQueryStatus = 'ACTIVE' | 'FROZEN' | 'TERMINATED' | 'PENDING' | 'PENDING_ACTIVATION' | 'BLOCKED' | string;
export type CardQueryType = 'VIRTUAL' | 'PHYSICAL' | string;

export interface QueryCardsRequest {
  filters: {
    bankId?: string;
    affiliateId?: string;
    customerId?: string;
    status?: CardQueryStatus[];
    cardType?: CardQueryType[];
    productId?: string;
    fromDate?: string;
    toDate?: string;
  };
  page: number;
  pageSize: number;
}

export interface QueryCardsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: CardListItem[];
}

export type GetCardsResponse =
  | CardListItem[]
  | {
      cards?: CardListItem[];
      items?: CardListItem[];
      data?: CardListItem[];
    };

export interface CreateCardResponse {
  cardId: string;
  customerId: string;
  bankId: string;
  productType: string;
  status: string;
  maskedPan: string;
  expiryMonth: string;
  expiryYear: string;
  createdAt: string;
  virtualAccount: {
    virtualAccountId: string;
    bankId: string;
    status: string;
    linkedAt: string;
  };
}

export interface GetCardResponse {
  cardId: string;
  customerId: string;
  bankId: string;
  productType: string;
  status: string;
  maskedPan: string;
  createdAt: string;
  fulfillment: {
    bureauPushStatus: string;
    lastPushedAt: string;
  };
}

export interface GetCardFundingDetails {
  cardId: string;
  customerId: string;
  bankId: string;
  virtualAccount: {
    virtualAccountId: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    status: string;
    linkedAt: string;
  };
  fundingInstructions: {
    currency: string;
    message: string;
    referenceRequired: boolean;
  };
}

export interface GetCardFulfillmentStatusResponse {
  cardId: string;
  productType: string;
  fulfillment: {
    bureauStatus: string;
    lastUpdatedAt: string;
    tracking?: {
      carrier: string;
      trackingNumber: string;
      trackingUrl: string;
    };
  };
}

export interface RefreshCardFulfillmentRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
  };
}

export interface RefreshCardFulfillmentResponse {
  cardId: string;
  previousStatus: string;
  currentStatus: string;
  updatedAt: string;
}

export interface ReinitiateCardFulfillmentRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    idempotencyKey: string;
  };
  reason: string;
}

export interface ReinitiateCardFulfillmentResponse {
  cardId: string;
  status: string;
  bureauPushStatus: string;
  lastPushedAt: string;
}

export interface FreezeCardRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  reason: string;
}

export interface FreezeCardResponse {
  cardId: string;
  previousStatus: string;
  currentStatus: string;
  frozenAt: string;
  external: {
    cmsReference: string;
  };
}

export interface UnfreezeCardRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  reason: string;
}

export interface UnfreezeCardResponse {
  cardId: string;
  previousStatus: string;
  currentStatus: string;
  unfrozenAt: string;
  external: {
    cmsReference: string;
  };
}

export interface ActivateCardRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId?: string;
    idempotencyKey?: string;
  };
  reason: string;
}

export interface ActivateCardResponse {
  cardId: string;
  previousStatus: string;
  currentStatus: string;
  activatedAt: string;
  external: {
    cmsReference: string;
  };
}

export interface TerminateCardRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  reason: string;
}

export interface TerminateCardResponse {
  cardId: string;
  previousStatus: string;
  currentStatus: string;
  terminatedAt: string;
  external: {
    cmsReference: string;
  };
}

export interface GetCardBalanceResponse {
  cardId: string;
  balance: {
    ledgerBalance: number;
    availableBalance: number;
    currency: string;
  };
  source: string;
  retrievedAt: string;
}

export interface CreateCardLimitRequestRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
  };
  requestedLimit: {
    amount: number;
    currency: string;
  };
  reason: string;
}

export interface CreateCardLimitRequestResponse {
  limitRequestId: string;
  cardId: string;
  previousLimit: number;
  requestedLimit: number;
  status: string;
  createdAt: string;
}

export interface CompleteCardLimitRequestRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    role: string;
  };
  outcome: string;
  appliedLimit: MoneyAmount;
  external: ExternalCmsReference;
  opsRemarks: string;
}

export interface CompleteCardLimitRequestResponse {
  limitRequestId: string;
  cardId: string;
  status: string;
  appliedLimit: MoneyAmount;
  completedAt: string;
  external: ExternalCmsReference;
}

export interface PinResetRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  reason: string;
}

export interface PinResetResponse {
  cardId: string;
  status: string;
  smsDelivery: {
    channel: string;
    phoneMasked: string;
    status: string;
    sentAt: string;
  };
  external: ExternalCmsReference;
}

export interface CardLoadRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  amount: ValueAmount;
  fundingReference: {
    virtualAccountNumber: string;
    bankId: string;
    bankTransferReference: string;
    proofType: string;
  };
}

export interface CardLoadResponse {
  fundingTransactionId: string;
  cardId: string;
  status: string;
  balanceAfter: number;
  completedAt: string;
  external: ExternalCmsReference;
}

export interface CardUnloadRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
    tenantId: string;
    affiliateId: string;
    idempotencyKey: string;
  };
  amount: ValueAmount;
  destinationAccount: {
    accountId: string;
    bankCode: string;
    accountNumberMasked: string;
  };
  reason: string;
}

export interface CardUnloadResponse {
  unloadTransactionId: string;
  cardId: string;
  status: string;
  balanceAfter: number;
  transferredTo: {
    accountId: string;
    bankCode: string;
    accountNumberMasked: string;
  };
  completedAt: string;
  external: {
    bankTransferReference: string;
    cmsReference: string;
  };
}

export interface BatchLoadUploadRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    tenantId: string;
    affiliateId: string;
  };
  file: {
    fileName: string;
    contentType: string;
    fileBase64: string;
  };
}

export interface BatchLoadValidationError {
  rowNumber: number;
  errorCode: string;
  message: string;
}

export interface BatchLoadUploadResponse {
  batchId: string;
  validationStatus: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: BatchLoadValidationError[];
}

export interface ExecuteBatchLoadRequest {
  requestContext: {
    requestId: string;
    actorUserId: string;
    tenantId: string;
    affiliateId: string;
  };
}

export interface ExecuteBatchLoadResponse {
  batchId: string;
  status: string;
  executionSummary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    totalProcessedAmount: number;
  };
}

export interface GetBatchLoadResponse {
  batchId: string;
  status: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  totalProcessedAmount: number;
  lastUpdatedAt: string;
}

export interface GetBatchLoadResultsResponse {
  batchId: string;
  resultFile: string;
  downloadUrl: string;
}
