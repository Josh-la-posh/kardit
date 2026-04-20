import { useCallback, useEffect, useState } from 'react';
import { getBankTransactionVolume } from '@/services/transactionApi';
import type { BankTransactionVolumeResponse } from '@/types/transactionContracts';

export function useBankTransactionVolume(bankId: string | undefined) {
  const [volume, setVolume] = useState<BankTransactionVolumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bankId));
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!bankId) {
      setVolume(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getBankTransactionVolume(bankId);
      setVolume(response);
    } catch (err) {
      setVolume(null);
      setError(err instanceof Error ? err.message : 'Unable to load bank transaction volume');
    } finally {
      setIsLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { volume, isLoading, error, refetch: fetch };
}

export function useBankTransactionVolumes(bankIds: string[]) {
  const [volumes, setVolumes] = useState<Record<string, BankTransactionVolumeResponse | null>>({});
  const [isLoading, setIsLoading] = useState(bankIds.length > 0);

  const fetch = useCallback(async () => {
    if (bankIds.length === 0) {
      setVolumes({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const entries = await Promise.all(
      bankIds.map(async (bankId) => {
        try {
          const response = await getBankTransactionVolume(bankId);
          return [bankId, response] as const;
        } catch {
          return [bankId, null] as const;
        }
      })
    );
    setVolumes(Object.fromEntries(entries));
    setIsLoading(false);
  }, [bankIds]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { volumes, isLoading, refetch: fetch };
}
