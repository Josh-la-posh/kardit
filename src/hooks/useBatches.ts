import { useState, useEffect, useCallback } from 'react';
import { store, CustomerBatch } from '@/stores/mockStore';

export function useBatches() {
  const [batches, setBatches] = useState<CustomerBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setBatches(store.getBatches());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addBatch = useCallback(async (fileName: string) => {
    const batch = store.addBatch(fileName);
    setBatches(store.getBatches());
    return batch;
  }, []);

  return { batches, isLoading, addBatch, refetch: fetch };
}
