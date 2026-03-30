export interface ReportPageRequest {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
}

export interface BatchesReportResponse {
  page: number;
  pageSize: number;
  records: Array<{
    batchId: string;
    operationType: string;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    totalProcessedAmount: number;
    createdAt: string;
  }>;
}

export interface CmsTracesReportResponse {
  page: number;
  pageSize: number;
  records: Array<{
    requestId: string;
    operationType: string;
    cardId: string;
    cmsEndpoint: string;
    cmsReference: string;
    requestTimestamp: string;
    responseCode: string;
    responseMessage: string;
  }>;
}

export interface CustomerSupportViewReportResponse {
  customerRefId: string;
  cards: Array<{
    cardId: string;
    status: string;
    productType: string;
    availableBalance?: number;
    currency?: string;
    recentTransactions?: number;
    recentLoads?: number;
    recentUnloads?: number;
    fulfillmentStatus?: string;
  }>;
  generatedAt: string;
}

export interface ExceptionsReportResponse {
  page: number;
  pageSize: number;
  records: Array<{
    operationType: string;
    entityId: string;
    cardId: string;
    status: string;
    errorCode: string;
    errorMessage: string;
    occurredAt: string;
  }>;
}

export interface CardTransactionsReportResponse {
  cardId: string;
  page: number;
  pageSize: number;
  transactions: Array<{
    transactionId: string;
    merchantName: string;
    transactionType: string;
    amount: number;
    currency: string;
    status: string;
    authorizationCode: string;
    transactionDate: string;
  }>;
}

export interface CardLoadsReportResponse {
  cardId: string;
  loads: Array<{
    fundingTransactionId: string;
    amount: number;
    currency: string;
    fundingSource: string;
    bankTransferReference: string;
    status: string;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export interface CardUnloadsReportResponse {
  cardId: string;
  unloads: Array<{
    unloadTransactionId: string;
    amount: number;
    currency: string;
    destinationAccount: string;
    destinationBank: string;
    status: string;
    balanceAfter: number;
    processedAt: string;
  }>;
}

export interface CardLifecycleEventsReportResponse {
  cardId: string;
  page: number;
  pageSize: number;
  events: Array<{
    eventId: string;
    eventType: string;
    actorUserId: string;
    actorRole: string;
    reason: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
  }>;
}

export interface CardBalancesReportResponse {
  cardId: string;
  page: number;
  pageSize: number;
  snapshots: Array<{
    ledgerBalance: number;
    availableBalance: number;
    currency: string;
    source: string;
    retrievedAt: string;
  }>;
}

export interface CardsIssuanceReportResponse {
  page: number;
  pageSize: number;
  records: Array<{
    cardId: string;
    customerId: string;
    productId: string;
    bankId: string;
    cardType: string;
    status: string;
    issuedAt: string;
    virtualAccountStatus: string;
  }>;
}

export interface CardsFulfillmentReportResponse {
  page: number;
  pageSize: number;
  records: Array<{
    cardId: string;
    bureauStatus: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    lastUpdatedAt: string;
  }>;
}
