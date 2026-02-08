import { useState, useEffect, useCallback } from 'react';
import { transactionStore, Transaction, TransactionType, TransactionStatus } from '@/stores/transactionStore';

const DELAY = 400;

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType | 'ALL';
  status?: TransactionStatus | 'ALL';
}

export function useCardTransactions(cardId: string | undefined, filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cardId) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    let txs = transactionStore.getTransactionsByCard(cardId);
    if (filters?.type && filters.type !== 'ALL') txs = txs.filter(t => t.type === filters.type);
    if (filters?.status && filters.status !== 'ALL') txs = txs.filter(t => t.status === filters.status);
    if (filters?.dateFrom) txs = txs.filter(t => t.postedAt >= filters.dateFrom!);
    if (filters?.dateTo) txs = txs.filter(t => t.postedAt <= filters.dateTo! + 'T23:59:59Z');
    setTransactions(txs);
    setIsLoading(false);
  }, [cardId, filters?.type, filters?.status, filters?.dateFrom, filters?.dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, isLoading, refetch: fetch };
}
