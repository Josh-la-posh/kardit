export interface BatchRequestContext {
  actorUserId: string;
  userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
  tenantId: string;
  affiliateId?: string;
}

export interface UploadBatchRequest {
  requestContext: BatchRequestContext;
  productId: string;
  file: {
    fileName: string;
    contentType: string;
    fileBase64: string;
  };
}

export interface UploadBatchResponse {
  batchId: string;
  status: string;
  recordsReceived: number;
}

export interface SubmitBatchRequest {
  requestContext: BatchRequestContext;
}

export interface SubmitBatchResponse {
  batchId: string;
  status: string;
}

export interface BatchRowError {
  errorCode: string;
  message: string;
}

export interface BatchRow {
  rowNumber: number;
  status: string;
  errors?: BatchRowError[];
  linkedEntityRefs?: {
    customerId?: string;
    cardId?: string;
  };
}

export interface ValidateBatchRequest {
  requestContext: BatchRequestContext;
}

export interface ValidateBatchResponse {
  batchId: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: BatchRow[];
}

export interface GetBatchResponse {
  batchId: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBatchRowsRequest {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GetBatchRowsResponse {
  page: number;
  pageSize: number;
  total: number;
  batchId: string;
  data: BatchRow[];
}

export interface GetBatchResultsResponse {
  batchId: string;
  resultFile: string;
  downloadUrl: string;
}
