import { useCallback, useState } from 'react';
import { createAffiliate as createAffiliateApi } from '@/services/affiliateApi';
import { ApiError } from '@/services/authApi';
import type { CreateAffiliateRequest, CreateAffiliateResponse } from '@/types/affiliateContracts';

export function useCreateAffiliate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAffiliate = useCallback(async (request: CreateAffiliateRequest): Promise<CreateAffiliateResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      return await createAffiliateApi(request);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to create affiliate';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createAffiliate, isLoading, error };
}
