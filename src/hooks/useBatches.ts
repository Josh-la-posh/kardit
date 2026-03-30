import { useCallback, useEffect, useMemo, useState } from 'react';
import { executeBatch, getBatch, getBatchResults, submitBatch, uploadBatch } from '@/services/batchApi';
import { useAuth } from '@/hooks/useAuth';
import type {
  ExecuteBatchResponse,
  GetBatchResponse,
  GetBatchResultsResponse,
  SubmitBatchResponse,
  UploadBatchResponse,
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
  totalRecords: number;
  successful: number;
  failed: number;
}

export interface BatchDetail {
  upload: StoredBatch;
  batch: GetBatchResponse;
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
    totalRecords: batch.totalRecords,
    successful: batch.successful,
    failed: batch.failed,
  };
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
    async (params: { category: BatchCategory; fileName: string; productId?: string }) => {
      const response: UploadBatchResponse = await uploadBatch({
        requestContext: context,
        productId: params.productId,
        fileName: params.fileName,
      });

      upsertStoredBatch({
        batchId: response.batchId,
        category: params.category,
        fileName: params.fileName,
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

  const execute = useCallback(
    async (batchId: string) => {
      const response: ExecuteBatchResponse = await executeBatch(batchId, { requestContext: context });
      await fetch();
      return response;
    },
    [context, fetch]
  );

  return { batches, isLoading, error, upload, submit, execute, refetch: fetch };
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
      const resultsResponse = await getBatchResults(batchId).catch(() => null);
      setBatch({
        upload,
        batch: batchResponse,
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
