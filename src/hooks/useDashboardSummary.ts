import { useState, useEffect } from 'react';
import { 
  DashboardSummary, 
  mockDashboardSummary, 
  simulateDelay 
} from '@/services/mockData';

/**
 * Hook to fetch dashboard summary data
 * 
 * Usage:
 * const { data, isLoading, error, refetch } = useDashboardSummary();
 */
export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await simulateDelay(600);
      setData(mockDashboardSummary);
    } catch (err) {
      setError('Failed to load dashboard summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}
