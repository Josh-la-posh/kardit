import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useRunReport, useReportDefinitions } from '@/hooks/useReports';
import { Loader2, Download, ArrowLeft, Play } from 'lucide-react';

export default function ReportDetailPage() {
  const { reportDefinitionId } = useParams<{ reportDefinitionId: string }>();
  const navigate = useNavigate();
  const { definitions } = useReportDefinitions();
  const def = definitions.find(d => d.id === reportDefinitionId);
  const { instance, generate } = useRunReport(reportDefinitionId || '');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!def) {
    return <ProtectedRoute><AppLayout><div className="text-center py-20 text-muted-foreground">Report not found.</div></AppLayout></ProtectedRoute>;
  }

  const handleGenerate = () => generate({ dateFrom, dateTo });

  const handleExport = (format: string) => {
    if (!instance?.previewColumns || !instance?.previewRows) return;
    const header = instance.previewColumns.join(',');
    const rows = instance.previewRows.map(r => r.map(v => v ?? '').join(','));
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${def.code}_report.${format.toLowerCase()}`; a.click();
    URL.revokeObjectURL(url);
  };

  const statusMap: Record<string, StatusType> = { IDLE: 'INACTIVE', QUEUED: 'PENDING', RUNNING: 'PROCESSING', COMPLETED: 'SUCCESS', FAILED: 'FAILED' };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title={def.name} subtitle={def.description} actions={
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          } />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Filters */}
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Filters</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Date From</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date To</label>
                <input type="date" className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <Button onClick={handleGenerate} disabled={instance?.status === 'QUEUED' || instance?.status === 'RUNNING'} className="w-full">
                {(instance?.status === 'QUEUED' || instance?.status === 'RUNNING') && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Play className="h-4 w-4 mr-1" /> Generate Report
              </Button>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 kardit-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Results</h3>
                {instance && <StatusChip status={statusMap[instance.status] || 'INACTIVE'} label={instance.status} />}
              </div>

              {!instance && <p className="text-sm text-muted-foreground">Click "Generate Report" to see results.</p>}
              {instance?.status === 'QUEUED' && <p className="text-sm text-muted-foreground">Report queued...</p>}
              {instance?.status === 'RUNNING' && (
                <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm">Generating report...</span></div>
              )}

              {instance?.status === 'COMPLETED' && instance.previewColumns && instance.previewRows && (
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        {instance.previewColumns.map(col => (
                          <th key={col} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{col}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {instance.previewRows.map((row, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-2 text-sm">{cell ?? '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    {def.allowedFormats.map(fmt => (
                      <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)}>
                        <Download className="h-4 w-4 mr-1" /> Export {fmt}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
