import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBatch, getBatchResultsDownload, getBatchRows, submitBatch, uploadBatch, validateBatch } from '@/services/batchApi';
import { useAuth } from '@/hooks/useAuth';
import type {
  BatchRow,
  GetBatchResponse,
  GetBatchRowsResponse,
  GetBatchResultsResponse,
  SubmitBatchResponse,
  UploadBatchResponse,
  ValidateBatchResponse,
} from '@/types/batchContracts';

const STORAGE_KEY = 'kardit_generic_batches';

type BatchCategory = 'customers' | 'cards';

interface StoredBatch {
  batchId: string;
  category: BatchCategory;
  fileName: string;
  productId?: string;
  uploadedAt: string;
  uploadStatus: string;
  recordsReceived: number;
}

export interface BatchListItem {
  batchId: string;
  category: BatchCategory;
  fileName: string;
  productId?: string;
  uploadedAt: string;
  uploadStatus: string;
  recordsReceived: number;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
}

export interface BatchDetail {
  upload: StoredBatch;
  batch: GetBatchResponse;
  rows: BatchRow[];
  rowsTotal: number;
  results: GetBatchResultsResponse | null;
}

function readStoredBatches(): StoredBatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredBatches(items: StoredBatch[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function upsertStoredBatch(item: StoredBatch) {
  const next = [item, ...readStoredBatches().filter((entry) => entry.batchId !== item.batchId)];
  writeStoredBatches(next);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong while loading batches.';
}

function toListItem(upload: StoredBatch, batch: GetBatchResponse): BatchListItem {
  return {
    batchId: batch.batchId,
    category: upload.category,
    fileName: upload.fileName,
    productId: upload.productId,
    uploadedAt: upload.uploadedAt,
    uploadStatus: upload.uploadStatus,
    recordsReceived: upload.recordsReceived,
    status: batch.status,
    totalRows: batch.totalRows,
    validRows: batch.validRows,
    invalidRows: batch.invalidRows,
    processedRows: batch.processedRows,
    failedRows: batch.failedRows,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read upload file.'));
    reader.readAsDataURL(file);
  });
}

export function useBatches(category?: BatchCategory) {
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const context = useMemo(
    () => ({
      actorUserId: user?.id || 'user_unknown',
      userType: user?.stakeholderType || 'AFFILIATE',
      tenantId: user?.tenantId || 'tenant_unknown',
      affiliateId: user?.stakeholderType === 'AFFILIATE' ? user?.tenantId || 'affiliate_unknown' : undefined,
    }),
    [user?.id, user?.stakeholderType, user?.tenantId]
  );

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = readStoredBatches().filter((entry) => !category || entry.category === category);
      const items = await Promise.all(
        stored.map(async (entry) => {
          try {
            const batch = await getBatch(entry.batchId);
            return toListItem(entry, batch);
          } catch {
            return null;
          }
        })
      );
      setBatches(items.filter((item): item is BatchListItem => item !== null));
    } catch (err) {
      setError(toErrorMessage(err));
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const upload = useCallback(
    async (params: { category: BatchCategory; file: File; productId?: string }) => {
      const fileBase64 = await fileToBase64(params.file);
      const response: UploadBatchResponse = await uploadBatch({
        requestContext: context,
        productId: params.productId || '',
        file: {
          fileName: params.file.name,
          contentType: params.file.type || 'text/csv',
          fileBase64,
        },
      });

      upsertStoredBatch({
        batchId: response.batchId,
        category: params.category,
        fileName: params.file.name,
        productId: params.productId,
        uploadedAt: new Date().toISOString(),
        uploadStatus: response.status,
        recordsReceived: response.recordsReceived,
      });

      await fetch();
      return response;
    },
    [context, fetch]
  );

  const submit = useCallback(
    async (batchId: string) => {
      const response: SubmitBatchResponse = await submitBatch(batchId, { requestContext: context });
      await fetch();
      return response;
    },
    [context, fetch]
  );

  const validate = useCallback(
    async (batchId: string) => {
      const response: ValidateBatchResponse = await validateBatch(batchId, { requestContext: context });
      await fetch();
      return response;
    },
    [context, fetch]
  );

  return { batches, isLoading, error, upload, validate, submit, refetch: fetch };
}

export function useBatch(batchId: string | undefined) {
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!batchId) {
      setBatch(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const upload = readStoredBatches().find((entry) => entry.batchId === batchId);
      if (!upload) throw new Error('Batch not found in local history.');

      const batchResponse = await getBatch(batchId);
      const rowsResponse: GetBatchRowsResponse = await getBatchRows(batchId, { page: 1, pageSize: 25 }).catch(() => ({
        page: 1,
        pageSize: 25,
        total: 0,
        batchId,
        data: [],
      }));
      const resultsResponse = await getBatchResultsDownload(batchId).catch(() => null);
      setBatch({
        upload,
        batch: batchResponse,
        rows: rowsResponse.data,
        rowsTotal: rowsResponse.total,
        results: resultsResponse,
      });
    } catch (err) {
      setBatch(null);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { batch, isLoading, error, refetch: fetch };
}
