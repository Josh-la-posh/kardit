import { useState, useEffect, useCallback } from 'react';
import { reportStore, AuditLogEntry } from '@/stores/reportStore';

const DELAY = 400;

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setLogs(reportStore.getAuditLogs());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, isLoading, refetch: fetch };
}

export function useAuditLog(id: string | undefined) {
  const [log, setLog] = useState<AuditLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const t = setTimeout(() => {
      setLog(reportStore.getAuditLog(id));
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, [id]);

  return { log, isLoading };
}
