import { useCallback, useEffect, useState } from 'react';
import { querySuperAdminAudits } from '@/services/superAdminApi';
import type { QuerySuperAdminAuditsResponse, SuperAdminAuditLog } from '@/types/superAdminContracts';

interface SuperAdminAuditQueryInput {
  page?: number;
  pageSize?: number;
}

function getAuditRows(response: QuerySuperAdminAuditsResponse) {
  return response.results ?? response.data ?? response.items ?? [];
}

export function useSuperAdminAudits(filters: SuperAdminAuditQueryInput) {
  const [audits, setAudits] = useState<SuperAdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [responsePage, setResponsePage] = useState(filters.page || 1);
  const [responsePageSize, setResponsePageSize] = useState(filters.pageSize || 25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await querySuperAdminAudits({
        page: filters.page || 1,
        pageSize: filters.pageSize || 25,
      });

      setAudits(getAuditRows(response));
      setTotal(response.total);
      setResponsePage(response.page);
      setResponsePageSize(response.pageSize);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
      setAudits([]);
      setTotal(0);
      setResponsePage(filters.page || 1);
      setResponsePageSize(filters.pageSize || 25);
    } finally {
      setIsLoading(false);
    }
  }, [filters.page, filters.pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    audits,
    total,
    page: responsePage,
    pageSize: responsePageSize,
    isLoading,
    error,
    refresh,
    refetch: refresh,
  };
}
