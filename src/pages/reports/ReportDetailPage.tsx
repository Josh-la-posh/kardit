import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
          <main className="scr-main">
            <div className="container">
              <header className="page-head">
                <div>
                  <h1 className="page-title">{group.name}</h1>
                  <p className="page-sub">{group.description}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </header>

              <div className="action-grid" style={{ marginTop: 14 }}>
                {groupDefinitions.map((definition) => (
                  <button
                    key={definition.id}
                    onClick={() => navigate(`/reports/${definition.id}`)}
                    className="action-card"
                    type="button"
                    style={{ textAlign: 'left' }}
                  >
                    <div className="action-icon"><FileText /></div>
                    <div className="action-title">{definition.name}</div>
                    <div className="action-meta">{definition.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {definition.allowedFormats.map((format) => (
                        <span key={format} className="ujr-tag">{format}</span>
                      ))}
                    </div>
                    <div className="action-cta">Open <ArrowRight className="h-3 w-3" /></div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!def) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <main className="scr-main">
            <div className="container">
              <section className="bch-card" style={{ padding: 24 }}>
                <div className="empty-list-title">Report not found</div>
                <div className="empty-list-sub">The report definition could not be resolved.</div>
              </section>
            </div>
          </main>
        </AppLayout>
      </ProtectedRoute>
    );
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
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">{def.name}</h1>
                <p className="page-sub">{def.description}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/reports/${def.groupId}`)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </header>

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Report Code" value={def.code} sub="Definition identifier" />
              <Kpi label="Formats" value={def.allowedFormats.join(', ')} sub="Supported export types" />
              <Kpi label="Group" value={def.groupId.toUpperCase()} sub="Report collection" />
              <Kpi label="Run Status" value={instance?.status || 'IDLE'} sub="Current execution state" />
            </section> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginTop: 14 }}>
              <section className="bch-card card-pad space-y-4">
                <div className="section-head" style={{ marginTop: 0, marginBottom: 8 }}>
                  <div>
                    <div className="section-title">Filters</div>
                    <div className="section-sub">Configure report payload</div>
                  </div>
                </div>

                {needsCardId && (
                  <Field label="Card ID">
                    <input className="bch-input" value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="CARD-2026-000551" />
                  </Field>
                )}

                {needsCustomerRefId && (
                  <Field label="Customer Ref ID">
                    <input className="bch-input" value={customerRefId} onChange={(e) => setCustomerRefId(e.target.value)} placeholder="CUST-ACME-00091" />
                  </Field>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Page">
                    <input type="number" min="1" className="bch-input" value={page} onChange={(e) => setPage(e.target.value)} />
                  </Field>
                  <Field label="Page Size">
                    <select className="bch-select" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                      {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </Field>
                </div>

                {supportsDateRange && (
                  <>
                    <Field label="Date From">
                      <input type="date" className="bch-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </Field>
                    <Field label="Date To">
                      <input type="date" className="bch-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </Field>
                  </>
                )}

                {reportDefinitionId === 'card-issuance' && (
                  <Field label="Product Type">
                    <select className="bch-select" value={productType} onChange={(e) => setProductType(e.target.value)}>
                      <option value="">All</option>
                      <option value="PHYSICAL">PHYSICAL</option>
                      <option value="VIRTUAL">VIRTUAL</option>
                    </select>
                  </Field>
                )}

                {reportDefinitionId === 'card-fulfillment' && (
                  <Field label="Fulfillment Status">
                    <input className="bch-input" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="DISPATCHED" />
                  </Field>
                )}

                {supportsOperationType && (
                  <Field label="Operation Type">
                    <input className="bch-input" value={operationType} onChange={(e) => setOperationType(e.target.value)} placeholder="LOAD" />
                  </Field>
                )}

                {reportDefinitionId === 'cms-traces' && (
                  <Field label="Card ID">
                    <input className="bch-input" value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="CARD-2026-000551" />
                  </Field>
                )}

                <button onClick={handleGenerate} disabled={disableGenerate} className="btn btn-primary w-full">
                  {(instance?.status === 'QUEUED' || instance?.status === 'RUNNING') && <Loader2 className="h-4 w-4 spin" />}
                  <Play className="h-4 w-4" /> Generate Report
                </button>
              </section>

              <section className="lg:col-span-2 bch-card card-pad">
                <div className="section-head" style={{ marginTop: 0 }}>
                  <div>
                    <div className="section-title">Results</div>
                    <div className="section-sub">Preview generated report data</div>
                  </div>
                  {instance && <StatusChip status={statusMap[instance.status] || 'INACTIVE'} label={instance.status} />}
                </div>

                {!instance && <p className="section-sub">Set your filters and generate a report.</p>}
                {instance?.status === 'QUEUED' && <p className="section-sub">Report queued...</p>}
                {instance?.status === 'RUNNING' && (
                  <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 spin" /><span className="section-sub">Generating report...</span></div>
                )}
                {instance?.status === 'FAILED' && <p style={{ color: 'var(--cs-red-700)', fontSize: 13 }}>{instance.errorMessage || 'Report failed.'}</p>}

                {instance?.status === 'COMPLETED' && instance.previewColumns && instance.previewRows && (
                  <>
                    <div className="overflow-x-auto mb-4">
                      <table className="data">
                        <thead>
                          <tr>
                            {instance.previewColumns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {instance.previewRows.map((row, index) => (
                            <tr key={index}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell ?? '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {def.allowedFormats.map((format) => (
                        <Button key={format} variant="outline" size="sm" onClick={() => handleExport(format)}>
                          <Download className="h-4 w-4 mr-1" /> Export {format}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="bch-label">{label}</label>
      {children}
    </div>
  );
}
