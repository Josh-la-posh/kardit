export type TransactionType = 'LOADS' | 'UNLOADS';

export type TransactionStatus =
  | 'AUTHORIZED'
  | 'DECLINED'
  | 'PENDING'
  | 'SETTLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGEBACK'
  | 'CANCELLED'
  | 'REFUSED'
  | 'COMPLETED'
  | 'SUCCESS';

export interface TransactionQueryFilters {
  bankId?: string;
  affiliateId?: string;
  customerId?: string;
  cardId?: string;
  transactionType?: TransactionType[];
  status?: TransactionStatus[];
  fromDate?: string;
  toDate?: string;
  reference?: string;
  merchantName?: string;
}

export interface TransactionQueryRequest {
  filters: TransactionQueryFilters;
  pageNumber: number;
  pageSize: number;
}

export interface TransactionListItem {
  transactionId: string;
  bankId: string;
  affiliateId: string;
  customerId: string;
  cardId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  merchantName?: string;
  sourceRef?: string;
  transactionDate: string;
}

export interface TransactionQueryResponse {
  page: number;
  pageSize: number;
  total: number;
  data: TransactionListItem[];
}

export interface TransactionDetail {
  transactionId: string;
  cardId: string;
  customerId: string;
  bankId: string;
  affiliateId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  merchantName?: string;
  merchantCategoryCode?: string;
  authorizationCode?: string;
  sourceRef?: string;
  transactionDate: string;
  createdAt: string;
}

export interface CustomerTransactionsResponse {
  page: number;
  pageSize: number;
  total: number;
  customerId: string;
  data: Array<{
    transactionId: string;
    cardId: string;
    transactionType: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    merchantName?: string;
    transactionDate: string;
  }>;
}

export interface TransactionExportRequest {
  filters: Pick<
    TransactionQueryFilters,
    'bankId' | 'affiliateId' | 'status' | 'transactionType' | 'fromDate' | 'toDate'
  >;
  exportFormat: 'CSV' | 'EXCEL';
}

export interface TransactionExportResponse {
  exportId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  requestedAt: string;
}

export interface BankTransactionVolumeResponse {
  bankId: string;
  volumes: {
    totalFundingVolume: number;
    totalUnloadVolume: number;
    totalTransactionVolume: number;
  };
  generatedAt: string;
}

export interface AffiliateTransactionVolumeResponse {
  affiliateId: string;
  volumes: {
    totalFundingVolume: number;
  };
  generatedAt: string;
}

export interface CardUnloadTransactionsResponse {
  page: number;
  pageSize: number;
  total: number;
  cardId: string;
  data: Array<{
    unloadTransactionId: string;
    amount: number;
    currency: string;
    destinationAccountName: string;
    destinationBankName: string;
    destinationAccountNumberMasked: string;
    bankTransferReference: string;
    status: TransactionStatus;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export interface CardLoadTransactionsResponse {
  page: number;
  pageSize: number;
  total: number;
  cardId: string;
  data: Array<{
    fundingTransactionId: string;
    amount: number;
    currency: string;
    fundingSource: string;
    bankTransferReference: string;
    status: TransactionStatus;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export interface CardTransactionsResponse {
  page: number;
  pageSize: number;
  total: number;
  cardId: string;
  data: Array<{
    transactionId: string;
    merchantName?: string;
    transactionType: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    authorizationCode?: string;
    sourceRef?: string;
    transactionDate: string;
  }>;
}
