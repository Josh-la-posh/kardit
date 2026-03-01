import { useState, useEffect, useCallback } from 'react';
import { store, CustomerBatch } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';

export function useBatches() {
  const [batches, setBatches] = useState<CustomerBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setBatches(store.getBatches(tenantScope));
    setIsLoading(false);
  }, [tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBatch = useCallback(async (fileName: string) => {
    const tenantId = user?.tenantId || 'tenant_alpha_affiliate';
    const batch = store.addBatch(fileName, tenantId);
    setBatches(store.getBatches(tenantScope));
    return batch;
  }, [tenantScope, user?.tenantId]);

  return { batches, isLoading, addBatch, refetch: fetch };
}
