export interface BankDashboardMetrics {
  totalCardsIssued: number;
  activeCards: number;
  frozenCards: number;
  terminatedCards: number;
  totalFundingVolume: number;
  totalUnloadVolume: number;
  totalTransactionVolume: number;
  pendingApprovals: number;
  failedCmsRequests: number;
}

export interface GetBankDashboardResponse {
  bankId: string;
  metrics: BankDashboardMetrics;
  generatedAt: string;
}

export interface BankCardMetrics {
  totalCardsIssued: number;
  activeCards: number;
  frozenCards: number;
  terminatedCards: number;
}

export interface GetBankCardMetricsResponse {
  bankId: string;
  metrics: BankCardMetrics;
  generatedAt: string;
}

export interface GetAffiliateCardMetricsResponse {
  affiliateId: string;
  metrics: BankCardMetrics;
  generatedAt: string;
}

export interface BankAffiliateSummary {
  affiliateId: string;
  tenantId: string;
  affiliateName: string;
  requestId?: string;
  relationshipStatus: BankAffiliateStatus;
  totalCards: number;
  activeCards: number;
  totalFundingVolume: number;
}

export type BankAffiliateStatus =
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'PENDING_BANK_APPROVAL';

export interface GetBankAffiliatesQuery {
  page?: number;
  pageSize?: number;
  status?: BankAffiliateStatus;
}

export interface GetBankAffiliatesResponse {
  bankId: string;
  affiliates: BankAffiliateSummary[];
  pagination?: {
    page: number;
    pageSize: number;
    total?: number;
  };
}

export interface BankCardsFilters {
  status?: string | null;
  affiliateId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface ListBankCardsRequest {
  filters: BankCardsFilters;
  pagination: PaginationRequest;
}

export interface BankCardItem {
  cardId: string;
  affiliateId: string;
  productType: string;
  status: string;
  maskedPan: string;
  customerRefId: string;
  issuedAt: string;
}

export interface ListBankCardsResponse {
  bankId: string;
  page: number;
  pageSize: number;
  total: number;
  cards: BankCardItem[];
}

export interface BankAuditLogFilters {
  fromDate?: string | null;
  toDate?: string | null;
  actorUserId?: string | null;
  eventType?: string | null;
}

export interface ListBankAuditLogsRequest {
  filters: BankAuditLogFilters;
  pagination: PaginationRequest;
}

export interface BankAuditLogItem {
  auditLogId: string;
  actorUserId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
}

export interface ListBankAuditLogsResponse {
  bankId: string;
  page: number;
  pageSize: number;
  total: number;
  logs: BankAuditLogItem[];
}

export interface BankReportFilters {
  reportType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface ListBankReportsRequest {
  filters: BankReportFilters;
  pagination: PaginationRequest;
}

export interface BankReportItem {
  reportId: string;
  reportType: string;
  generatedAt: string;
  status: string;
}

export interface ListBankReportsResponse {
  bankId: string;
  page: number;
  pageSize: number;
  total: number;
  reports: BankReportItem[];
}

export interface GetPartnershipRequestResponse {
  partnershipRequestId: string;
  affiliate: {
    affiliateId: string;
    legalName: string;
    tradingName?: string;
    registrationNumber: string;
  };
  onboardingSnapshot: {
    caseId: string;
    status: string;
    reviewersNotes?: string;
    reviewedAt?: string;
    kybLevel?: string;
    submittedAt?: string;
    documents: Array<{
      documentId: string;
      documentType: string;
      docType?: string;
      verificationStatus: string;
    }>;
  };
  note: string;
  status: string;
  requestedAt: string;
}

export interface QueryPartnershipRequestsFilters {
  bankId?: string | null;
  affiliateId?: string | null;
  status?: string[] | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface QueryPartnershipRequestsRequest {
  filters: QueryPartnershipRequestsFilters;
  page: number;
  pageSize: number;
}

export interface PartnershipRequestQueryItem {
  partnershipRequestId: string;
  affiliateId: string;
  affiliateName?: string;
  bankId: string;
  bankName?: string;
  status: string;
  note?: string;
  requestedAt: string;
  decisionedAt?: string;
}

export interface QueryPartnershipRequestsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: PartnershipRequestQueryItem[];
}

export interface ApprovePartnershipRequest {
  reviewerNotes: string;
  idempotencyKey: string;
}

export interface ApprovePartnershipResponse {
  partnershipId: string;
  status: string;
  activatedAt: string;
}

export interface RejectPartnershipRequest {
  rejectionReason: string;
  reviewerNotes: string;
  idempotencyKey: string;
}

export interface RejectPartnershipResponse {
  requestId: string;
  status: string;
}

export interface AffiliateActionRequestContext {
  requestId: string;
  actorUserId: string;
  bankId?: string;
  role?: string;
  userType: string;
  tenantId?: string;
  affiliateId?: string;
  idempotencyKey?: string;
}

export interface SuspendAffiliateRequest {
  requestContext: AffiliateActionRequestContext;
  reason: string;
  // idempotencyKey: string;
}

export interface SuspendAffiliateResponse {
  affiliateId: string;
  previousStatus: string;
  currentStatus: string;
  effectiveAt: string;
}

export interface BlockAffiliateRequest {
  requestContext: AffiliateActionRequestContext;
  reason: string;
  // idempotencyKey: string;
}

export interface BlockAffiliateResponse {
  affiliateId: string;
  previousStatus: string;
  currentStatus: string;
  cascadeActions: {
    cardsFrozen: number;
    approvalsCancelled: number;
    tokensRevoked: number;
  };
  effectiveAt: string;
}
