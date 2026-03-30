import { useState, useEffect, useCallback } from 'react';
import { transactionStore, LoadTransaction } from '@/stores/transactionStore';
import { store } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';
import { getBatchLoad, getBatchLoadResults } from '@/services/cardsApi';
import type {
  BatchLoadUploadResponse,
  ExecuteBatchLoadResponse,
  GetBatchLoadResponse,
  GetBatchLoadResultsResponse,
} from '@/types/cardContracts';

const DELAY = 400;
const BATCH_STORAGE_KEY = 'kardit_batch_loads';

interface StoredBatchUpload {
  batchId: string;
  fileName: string;
  uploadedAt: string;
  validationStatus: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: BatchLoadUploadResponse['errors'];
}

export interface BatchLoadListItem {
  batchId: string;
  fileName: string;
  uploadedAt: string;
  validationStatus: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: string;
  totalProcessedAmount: number;
  lastUpdatedAt: string;
}

export interface BatchLoadDetail {
  upload: StoredBatchUpload | null;
  batch: GetBatchLoadResponse;
  results: GetBatchLoadResultsResponse | null;
}

function readStoredBatches(): StoredBatchUpload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredBatches(items: StoredBatchUpload[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(items));
}

function upsertStoredBatch(item: StoredBatchUpload) {
  const current = readStoredBatches().filter((entry) => entry.batchId !== item.batchId);
  writeStoredBatches([item, ...current]);
}

function toBatchListItem(upload: StoredBatchUpload, batch: GetBatchLoadResponse): BatchLoadListItem {
  return {
    batchId: batch.batchId,
    fileName: upload.fileName,
    uploadedAt: upload.uploadedAt,
    validationStatus: upload.validationStatus,
    totalRows: batch.totalRows || upload.totalRows,
    successfulRows: batch.successfulRows,
    failedRows: batch.failedRows,
    status: batch.status,
    totalProcessedAmount: batch.totalProcessedAmount,
    lastUpdatedAt: batch.lastUpdatedAt,
  };
}

export function useLoadSummary() {
  const [summary, setSummary] = useState({ todayCount: 0, todayAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setSummary(transactionStore.getLoadSummary());
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, []);

  return { summary, isLoading };
}

export function useCreateSingleLoad() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const createLoad = useCallback(async (data: {
    cardId: string; amount: number; currency: string; reference?: string;
    loadType?: string; productCode?: string;
  }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const card = store.getCard(data.cardId, tenantScope);
    if (!card) throw new Error('Card not found');
    const prevBalance = card.currentBalance;

    const lt = transactionStore.createLoad({ cardId: data.cardId, type: 'LOAD', amount: data.amount, currency: data.currency, reference: data.reference });
    transactionStore.addTransaction({ cardId: data.cardId, postedAt: new Date().toISOString(), type: data.amount < 0 ? 'REVERSAL' : 'LOAD', amount: data.amount, currency: data.currency, status: 'POSTED', narrative: data.reference || (data.amount < 0 ? 'Unload' : 'Single load') });
    store.updateCard(data.cardId, { currentBalance: prevBalance + data.amount });

    if (data.loadType || data.productCode) {
      store.addCMSAction({
        entityType: 'LOAD', entityId: lt.id,
        payload: { load_typ: data.loadType || 'L', crt_code_product: data.productCode || card.productCode, crt_load_value: Math.abs(data.amount), currency: data.currency, reference: data.reference },
      });
    }

    setIsLoading(false);
    return { loadTransaction: lt, previousBalance: prevBalance, newBalance: prevBalance + data.amount };
  }, [tenantScope]);

  return { createLoad, isLoading };
}

export function useCreateLoadReversal() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const createReversal = useCallback(async (data: {
    cardId: string; originalLoadId: string; amount: number; currency: string; reason?: string;
    productCode?: string;
  }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const card = store.getCard(data.cardId, tenantScope);
    if (!card) throw new Error('Card not found');
    const prevBalance = card.currentBalance;

    const lt = transactionStore.createLoad({ cardId: data.cardId, type: 'REVERSAL', amount: -data.amount, currency: data.currency, reference: data.reason, relatedLoadId: data.originalLoadId });
    transactionStore.addTransaction({ cardId: data.cardId, postedAt: new Date().toISOString(), type: 'REVERSAL', amount: -data.amount, currency: data.currency, status: 'POSTED', narrative: `Reversal: ${data.reason || ''}` });
    store.updateCard(data.cardId, { currentBalance: prevBalance - data.amount });

    store.addCMSAction({
      entityType: 'LOAD', entityId: lt.id,
      payload: { load_typ: 'U', crt_code_product: data.productCode || card.productCode, crt_load_value: data.amount, currency: data.currency, original_load_id: data.originalLoadId, reason: data.reason },
    });

    setIsLoading(false);
    return { loadTransaction: lt, previousBalance: prevBalance, newBalance: prevBalance - data.amount };
  }, [tenantScope]);

  return { createReversal, isLoading };
}

export function useLoadsByCard(cardId: string | undefined) {
  const [loads, setLoads] = useState<LoadTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!cardId) return;
    setIsLoading(true);
    const t = setTimeout(() => {
      setLoads(transactionStore.getLoadsByCard(cardId));
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, [cardId]);

  return { loads, isLoading };
}

export function useLoadBatches() {
  const [batches, setBatches] = useState<BatchLoadListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = readStoredBatches();
      const resolved = await Promise.all(
        stored.map(async (entry) => {
          try {
            const batch = await getBatchLoad(entry.batchId);
            return toBatchListItem(entry, batch);
          } catch {
            return null;
          }
        })
      );
      setBatches(resolved.filter((item): item is BatchLoadListItem => item !== null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load batch loads');
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const registerUpload = useCallback((fileName: string, response: BatchLoadUploadResponse) => {
    upsertStoredBatch({
      batchId: response.batchId,
      fileName,
      uploadedAt: new Date().toISOString(),
      validationStatus: response.validationStatus,
      totalRows: response.totalRows,
      successfulRows: response.successfulRows,
      failedRows: response.failedRows,
      errors: response.errors,
    });
  }, []);

  return { batches, isLoading, error, refetch: fetch, registerUpload };
}

export function useLoadBatch(batchId: string | undefined) {
  const [batch, setBatch] = useState<BatchLoadDetail | null>(null);
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
      const upload = readStoredBatches().find((entry) => entry.batchId === batchId) || null;
      const batchResponse = await getBatchLoad(batchId);
      const resultsResponse = await getBatchLoadResults(batchId).catch(() => null);
      setBatch({
        upload,
        batch: batchResponse,
        results: resultsResponse,
      });
    } catch (err) {
      setBatch(null);
      setError(err instanceof Error ? err.message : 'Unable to load batch detail');
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { batch, isLoading, error, refetch: fetch };
}
