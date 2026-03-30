import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  createAffiliateBankPartnershipRequest,
  getAffiliateBankPartnerships,
  resolveAffiliateId,
} from '@/services/affiliateBankApi';
import type {
  AffiliateBankPartnership,
  CreateBankPartnershipRequest,
  CreateBankPartnershipResponse,
} from '@/types/affiliateBankContracts';

export function useAffiliateBankPartnerships() {
  const { user } = useAuth();
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [banks, setBanks] = useState<AffiliateBankPartnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resolvedAffiliateId = resolveAffiliateId(user);
      setAffiliateId(resolvedAffiliateId);
      const response = await getAffiliateBankPartnerships(resolvedAffiliateId);
      setBanks(response.banks);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank partnerships');
      setBanks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPartnership = useCallback(
    async (request: CreateBankPartnershipRequest): Promise<CreateBankPartnershipResponse> => {
      const resolvedAffiliateId = affiliateId || resolveAffiliateId(user);
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await createAffiliateBankPartnershipRequest(resolvedAffiliateId, request);
        await refresh();
        return response;
      } catch (e: any) {
        setError(e?.message || 'Failed to submit partnership request');
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [affiliateId, refresh, user]
  );

  return {
    affiliateId,
    banks,
    isLoading,
    isSubmitting,
    error,
    refresh,
    requestPartnership,
  };
}
