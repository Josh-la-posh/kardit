import { useCallback, useEffect, useState } from 'react';
import { queryBanks } from '@/services/bankApi';
import type { BankQueryItem, BankStatus } from '@/types/bankContracts';

interface UseBankQueryOptions {
  status?: BankStatus[];
  country?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useBankQuery({
  status,
  country,
  search = '',
  page = 1,
  pageSize = 25,
}: UseBankQueryOptions = {}) {
  const [banks, setBanks] = useState<BankQueryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [responsePage, setResponsePage] = useState(page);
  const [responsePageSize, setResponsePageSize] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmedSearch = search.trim();
      const trimmedCountry = country?.trim();
      const response = await queryBanks({
        filters: {
          ...(status?.length ? { status } : {}),
          ...(trimmedCountry ? { country: trimmedCountry } : {}),
          ...(trimmedSearch ? { search: trimmedSearch } : {}),
        },
        page,
        pageSize,
      });

      setBanks(response.data);
      setTotal(response.total);
      setResponsePage(response.page);
      setResponsePageSize(response.pageSize);
    } catch (e) {
      setBanks([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : 'Failed to load banks');
    } finally {
      setIsLoading(false);
    }
  }, [country, page, pageSize, search, status]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  return {
    banks,
    total,
    page: responsePage,
    pageSize: responsePageSize,
    isLoading,
    error,
    refetch: fetchBanks,
  };
}
