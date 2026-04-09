import { useState, useEffect, useCallback } from 'react';
import { getCardTransactions } from '@/services/transactionApi';
import type { TransactionStatus as ApiTransactionStatus, TransactionType as ApiTransactionType } from '@/types/transactionContracts';
import { Transaction, TransactionType, TransactionStatus } from '@/stores/transactionStore';

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: ApiTransactionType | 'ALL';
  status?: ApiTransactionStatus | 'ALL';
}

function mapTransactionType(type: ApiTransactionType): TransactionType {
  if (type === 'LOAD') return 'LOAD';
  if (type === 'UNLOAD') return 'REVERSAL';
  if (type === 'POS') return 'PURCHASE';
  return 'OTHER';
}

function mapTransactionStatus(status: ApiTransactionStatus): TransactionStatus {
  if (status === 'PENDING') return 'PENDING';
  if (status === 'REFUSED' || status === 'CANCELLED') return 'DECLINED';
  return 'POSTED';
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
      const response = await getCardTransactions(cardId);

      let txs = response.data.map((tx) => ({
        apiType: tx.transactionType,
        apiStatus: tx.status,
        record: {
          id: tx.transactionId,
          cardId: response.cardId,
          postedAt: tx.transactionDate,
          type: mapTransactionType(tx.transactionType),
          amount: tx.amount,
          currency: tx.currency,
          status: mapTransactionStatus(tx.status),
          narrative: tx.merchantName || tx.sourceRef,
        } satisfies Transaction,
      }));

      if (filters?.dateFrom) {
        const fromTime = new Date(filters.dateFrom).getTime();
        txs = txs.filter((tx) => new Date(tx.record.postedAt).getTime() >= fromTime);
      }

      if (filters?.dateTo) {
        const toTime = new Date(`${filters.dateTo}T23:59:59.999Z`).getTime();
        txs = txs.filter((tx) => new Date(tx.record.postedAt).getTime() <= toTime);
      }

      if (filters?.type && filters.type !== 'ALL') {
        txs = txs.filter((tx) => tx.apiType === filters.type);
      }

      if (filters?.status && filters.status !== 'ALL') {
        txs = txs.filter((tx) => tx.apiStatus === filters.status);
      }

      setTransactions(txs.map((tx) => tx.record));
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, filters?.dateFrom, filters?.dateTo, filters?.status, filters?.type]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, isLoading, refetch: fetch };
}
