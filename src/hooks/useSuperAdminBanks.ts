import { useCallback, useEffect, useState } from 'react';
import { queryAffiliates, queryBanks } from '@/services/superAdminApi';
import type { AffiliateQueryItem, BankQueryItem } from '@/types/superAdminContracts';

interface BankQueryFiltersInput {
  search?: string;
  status?: string | string[];
  country?: string | null;
  page?: number;
  pageSize?: number;
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
  const [responsePage, setResponsePage] = useState(filters.page || 1);
  const [responsePageSize, setResponsePageSize] = useState(filters.pageSize || 25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedStatuses = Array.isArray(filters.status)
        ? filters.status
        : filters.status && filters.status !== 'ALL'
          ? [filters.status]
          : undefined;
      const trimmedCountry = filters.country?.trim();
      const trimmedSearch = filters.search?.trim();

      const response = await queryBanks({
        filters: {
          ...(selectedStatuses?.length ? { status: selectedStatuses } : {}),
          ...(trimmedCountry ? { country: trimmedCountry } : {}),
          ...(trimmedSearch ? { search: trimmedSearch } : {}),
        },
        page: filters.page || 1,
        pageSize: filters.pageSize || 25,
      });
      setBanks(response.data);
      setTotal(response.total);
      setResponsePage(response.page);
      setResponsePageSize(response.pageSize);
    } catch (e: any) {
      setError(e?.message || 'Failed to load banks');
      setBanks([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters.country, filters.page, filters.pageSize, filters.search, filters.status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    banks,
    total,
    page: responsePage,
    pageSize: responsePageSize,
    isLoading,
    error,
    refresh,
    refetch: refresh,
  };
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
          ...(filters.status && filters.status !== 'ALL' ? { status: [filters.status] } : {}),
          ...(filters.country ? { country: filters.country } : {}),
          ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
          ...(filters.toDate ? { toDate: filters.toDate } : {}),
          ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
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
