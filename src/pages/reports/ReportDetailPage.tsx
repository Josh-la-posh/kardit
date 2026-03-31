import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useReportDefinitions, useRunReport } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { isBankReadOnlyUser } from '@/lib/permissions';
import { ArrowLeft, ArrowRight, Download, FileText, Loader2, Play } from 'lucide-react';

const PAGE_SIZES = ['10', '20', '50', '100'];

export default function ReportDetailPage() {
  const { reportDefinitionId } = useParams<{ reportDefinitionId: string }>();
  const navigate = useNavigate();
  const { groups, definitions, definitionsByGroup } = useReportDefinitions();
  const def = definitions.find((item) => item.id === reportDefinitionId);
  const group = groups.find((item) => item.id === reportDefinitionId);
  const groupDefinitions = group ? definitionsByGroup[group.id] || [] : [];
  const { instance, generate } = useRunReport(def?.id || '');
  const { user } = useAuth();
  const isReadOnly = isBankReadOnlyUser(user);

  const [cardId, setCardId] = useState('');
  const [customerRefId, setCustomerRefId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState('1');
  const [pageSize, setPageSize] = useState('20');
  const [productType, setProductType] = useState('');
  const [status, setStatus] = useState('');
  const [operationType, setOperationType] = useState('');

  const needsCardId = useMemo(
    () => ['card-transactions', 'card-loads', 'card-unloads', 'card-lifecycle-events', 'card-balances'].includes(reportDefinitionId || ''),
    [reportDefinitionId]
  );

  const needsCustomerRefId = reportDefinitionId === 'customer-support-view';
  const supportsDateRange = useMemo(
    () => ['card-transactions', 'card-lifecycle-events', 'card-balances', 'card-issuance', 'card-fulfillment', 'batches', 'exceptions'].includes(reportDefinitionId || ''),
    [reportDefinitionId]
  );
  const supportsOperationType = useMemo(
    () => ['batches', 'cms-traces', 'exceptions'].includes(reportDefinitionId || ''),
    [reportDefinitionId]
  );

  if (group) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="animate-fade-in">
            <PageHeader
              title={group.name}
              subtitle={group.description}
              actions={<Button variant="outline" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupDefinitions.map((definition) => (
                <button
                  key={definition.id}
                  onClick={() => navigate(`/reports/${definition.id}`)}
                  className="kardit-card p-5 text-left hover:border-primary/50 transition-colors group"
                >
                  <FileText className="h-5 w-5 text-primary mb-2" />
                  <h3 className="text-sm font-semibold mb-1">{definition.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{definition.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {definition.allowedFormats.map((format) => (
                        <span key={format} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {format}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!def) {
    return <ProtectedRoute><AppLayout><div className="text-center py-20 text-muted-foreground">Report not found.</div></AppLayout></ProtectedRoute>;
  }

  const handleGenerate = () => {
    if (isReadOnly) return;
    generate({
      cardId: cardId.trim() || undefined,
      customerRefId: customerRefId.trim() || undefined,
      page: Number(page),
      pageSize: Number(pageSize),
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
      productType: productType || undefined,
      status: status || undefined,
      operationType: operationType || undefined,
    });
  };

  const handleExport = (format: string) => {
    if (!instance?.previewColumns || !instance?.previewRows) return;
    const header = instance.previewColumns.join(',');
    const rows = instance.previewRows.map((row) => row.map((cell) => cell ?? '').join(','));
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${def.code}_report.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusMap: Record<string, StatusType> = {
    IDLE: 'INACTIVE',
    QUEUED: 'PENDING',
    RUNNING: 'PROCESSING',
    COMPLETED: 'SUCCESS',
    FAILED: 'FAILED',
  };

  const disableGenerate =
    isReadOnly ||
    instance?.status === 'QUEUED' ||
    instance?.status === 'RUNNING' ||
    (needsCardId && !cardId.trim()) ||
    (needsCustomerRefId && !customerRefId.trim());

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={def.name}
            subtitle={def.description}
            actions={<Button variant="outline" size="sm" onClick={() => navigate(`/reports/${def.groupId}`)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="kardit-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Filters</h3>

              {needsCardId && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Card ID</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    placeholder="CARD-2026-000551"
                  />
                </div>
              )}

              {needsCustomerRefId && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Ref ID</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={customerRefId}
                    onChange={(e) => setCustomerRefId(e.target.value)}
                    placeholder="CUST-ACME-00091"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Page</label>
                  <input
                    type="number"
                    min="1"
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Page Size</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                  >
                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
              </div>

              {supportsDateRange && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date From</label>
                    <input type="date" className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date To</label>
                    <input type="date" className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </>
              )}

              {reportDefinitionId === 'card-issuance' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Product Type</label>
                  <select className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={productType} onChange={(e) => setProductType(e.target.value)}>
                    <option value="">All</option>
                    <option value="PHYSICAL">PHYSICAL</option>
                    <option value="VIRTUAL">VIRTUAL</option>
                  </select>
                </div>
              )}

              {reportDefinitionId === 'card-fulfillment' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Fulfillment Status</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="DISPATCHED"
                  />
                </div>
              )}

              {supportsOperationType && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Operation Type</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    placeholder="LOAD"
                  />
                </div>
              )}

              {reportDefinitionId === 'cms-traces' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Card ID</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    placeholder="CARD-2026-000551"
                  />
                </div>
              )}

              <Button onClick={handleGenerate} disabled={disableGenerate} className="w-full">
                {(instance?.status === 'QUEUED' || instance?.status === 'RUNNING') && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Play className="h-4 w-4 mr-1" /> Generate Report
              </Button>
            </div>

            <div className="lg:col-span-2 kardit-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Results</h3>
                {instance && <StatusChip status={statusMap[instance.status] || 'INACTIVE'} label={instance.status} />}
              </div>

              {!instance && <p className="text-sm text-muted-foreground">Set your filters and generate a report.</p>}
              {instance?.status === 'QUEUED' && <p className="text-sm text-muted-foreground">Report queued...</p>}
              {instance?.status === 'RUNNING' && (
                <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm">Generating report...</span></div>
              )}
              {instance?.status === 'FAILED' && (
                <p className="text-sm text-destructive">{instance.errorMessage || 'Report failed.'}</p>
              )}

              {instance?.status === 'COMPLETED' && instance.previewColumns && instance.previewRows && (
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        {instance.previewColumns.map((column) => (
                          <th key={column} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{column}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {instance.previewRows.map((row, index) => (
                          <tr key={index} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm">{cell ?? '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    {def.allowedFormats.map((format) => (
                      <Button key={format} variant="outline" size="sm" onClick={() => handleExport(format)}>
                        <Download className="h-4 w-4 mr-1" /> Export {format}
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
