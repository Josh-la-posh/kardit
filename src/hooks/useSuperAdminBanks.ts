import { useCallback, useEffect, useState } from 'react';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';

interface BankQueryFiltersInput {
  search?: string;
  status?: string;
  country?: string | null;
}

interface AffiliateQueryFiltersInput {
  search?: string;
  status?: string;
  country?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export function useSuperAdminBanks(filters: BankQueryFiltersInput) {
  const [banks, setBanks] = useState<BankQueryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await queryBanks({
        filters: {
          status: filters.status && filters.status !== 'ALL' ? [filters.status] : ['ACTIVE', 'INACTIVE'],
          country: filters.country || null,
          search: filters.search?.trim() || null,
        },
        page: 1,
        pageSize: 25,
      });
      setBanks(response.data);
      setTotal(response.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load banks');
      setBanks([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters.country, filters.search, filters.status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { banks, total, isLoading, error, refresh };
}

export function useSuperAdminBankAffiliates(bankId: string | undefined, filters: AffiliateQueryFiltersInput) {
  const [affiliates, setAffiliates] = useState<AffiliateQueryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!bankId) {
      setAffiliates([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await queryAffiliates({
        filters: {
          bankId,
          status: filters.status && filters.status !== 'ALL' ? [filters.status] : ['APPROVED', 'ACTIVE', 'SUSPENDED'],
          country: filters.country || null,
          fromDate: filters.fromDate || null,
          toDate: filters.toDate || null,
          search: filters.search?.trim() || null,
        },
        page: 1,
        pageSize: 25,
      });
      setAffiliates(response.data);
      setTotal(response.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank affiliates');
      setAffiliates([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [bankId, filters.country, filters.fromDate, filters.search, filters.status, filters.toDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { affiliates, total, isLoading, error, refresh };
}
