import { useState, useEffect, useCallback } from 'react';
import { getCardTransactionsReport } from '@/services/reportApi';
import { Transaction, TransactionType, TransactionStatus } from '@/stores/transactionStore';

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
    if (!cardId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await getCardTransactionsReport(cardId, {
        page: 1,
        pageSize: 100,
        fromDate: filters?.dateFrom,
        toDate: filters?.dateTo,
      });

      let txs: Transaction[] = response.transactions.map((tx) => ({
        id: tx.transactionId,
        cardId: response.cardId,
        postedAt: tx.transactionDate,
        type: (tx.transactionType || 'OTHER') as TransactionType,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status as TransactionStatus,
        narrative: tx.merchantName,
      }));

      if (filters?.type && filters.type !== 'ALL') {
        txs = txs.filter((tx) => tx.type === filters.type);
      }

      if (filters?.status && filters.status !== 'ALL') {
        txs = txs.filter((tx) => tx.status === filters.status);
      }

      setTransactions(txs);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, filters?.dateFrom, filters?.dateTo, filters?.status, filters?.type]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, isLoading, refetch: fetch };
}
