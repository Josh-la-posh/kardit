import { useState, useCallback } from 'react';
import { reportStore, ReportDefinition, ReportInstance, ReportInstanceStatus } from '@/stores/reportStore';

export function useReportDefinitions() {
  return { definitions: reportStore.getDefinitions() };
}

export function useRunReport(definitionId: string) {
  const [instance, setInstance] = useState<ReportInstance | null>(null);

  const generate = useCallback(async (filters: Record<string, any>) => {
    const id = `ri-${Date.now()}`;
    const base: ReportInstance = { id, reportDefinitionId: definitionId, createdAt: new Date().toISOString(), status: 'QUEUED', filters };
    setInstance(base);

    await new Promise(r => setTimeout(r, 500));
    setInstance(prev => prev ? { ...prev, status: 'RUNNING' } : prev);

    await new Promise(r => setTimeout(r, 1000));
    const preview = reportStore.generatePreview(definitionId);
    setInstance(prev => prev ? {
      ...prev,
      status: 'COMPLETED' as ReportInstanceStatus,
      previewColumns: preview?.columns,
      previewRows: preview?.rows,
    } : prev);
  }, [definitionId]);

  return { instance, generate };
}
