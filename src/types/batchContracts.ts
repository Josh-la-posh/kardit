export interface BatchRequestContext {
  actorUserId: string;
  userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | string;
  tenantId: string;
}

export interface UploadBatchRequest {
  requestContext: BatchRequestContext;
  productId?: string;
  fileName: string;
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

export interface ExecuteBatchRequest {
  requestContext: BatchRequestContext;
}

export interface ExecuteBatchResponse {
  batchId: string;
  status: string;
  jobStartedAt: string;
}

export interface GetBatchResponse {
  batchId: string;
  status: string;
  totalRecords: number;
  successful: number;
  failed: number;
}

export interface GetBatchResultsResponse {
  batchId: string;
  resultFile: string;
  downloadUrl: string;
}
