import { useState, useEffect, useCallback } from 'react';
import { transactionStore, LoadTransaction, LoadBatch } from '@/stores/transactionStore';
import { store } from '@/stores/mockStore';

const DELAY = 400;

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

  const createLoad = useCallback(async (data: { cardId: string; amount: number; currency: string; reference?: string }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const card = store.getCard(data.cardId);
    if (!card) throw new Error('Card not found');
    const prevBalance = card.currentBalance;

    const lt = transactionStore.createLoad({ cardId: data.cardId, type: 'LOAD', amount: data.amount, currency: data.currency, reference: data.reference });
    transactionStore.addTransaction({ cardId: data.cardId, postedAt: new Date().toISOString(), type: 'LOAD', amount: data.amount, currency: data.currency, status: 'POSTED', narrative: data.reference || 'Single load' });
    store.updateCard(data.cardId, { currentBalance: prevBalance + data.amount });

    setIsLoading(false);
    return { loadTransaction: lt, previousBalance: prevBalance, newBalance: prevBalance + data.amount };
  }, []);

  return { createLoad, isLoading };
}

export function useCreateLoadReversal() {
  const [isLoading, setIsLoading] = useState(false);

  const createReversal = useCallback(async (data: { cardId: string; originalLoadId: string; amount: number; currency: string; reason?: string }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const card = store.getCard(data.cardId);
    if (!card) throw new Error('Card not found');
    const prevBalance = card.currentBalance;

    const lt = transactionStore.createLoad({ cardId: data.cardId, type: 'REVERSAL', amount: -data.amount, currency: data.currency, reference: data.reason, relatedLoadId: data.originalLoadId });
    transactionStore.addTransaction({ cardId: data.cardId, postedAt: new Date().toISOString(), type: 'REVERSAL', amount: -data.amount, currency: data.currency, status: 'POSTED', narrative: `Reversal: ${data.reason || ''}` });
    store.updateCard(data.cardId, { currentBalance: prevBalance - data.amount });

    setIsLoading(false);
    return { loadTransaction: lt, previousBalance: prevBalance, newBalance: prevBalance - data.amount };
  }, []);

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
  const [batches, setBatches] = useState<LoadBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setBatches(transactionStore.getLoadBatches());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { batches, isLoading, refetch: fetch };
}

export function useLoadBatch(batchId: string | undefined) {
  const [batch, setBatch] = useState<LoadBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setBatch(transactionStore.getLoadBatch(batchId));
    setIsLoading(false);
  }, [batchId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { batch, isLoading, refetch: fetch };
}
