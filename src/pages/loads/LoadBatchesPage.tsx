import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useLoadBatches, useLoadBatch } from '@/hooks/useLoads';
import { transactionStore } from '@/stores/transactionStore';
import { Loader2, Upload, Download, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LoadBatchesPage() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();

  if (batchId) return <BatchDetail batchId={batchId} />;
  return <BatchList />;
}

function BatchList() {
  const navigate = useNavigate();
  const { batches, isLoading, refetch } = useLoadBatches();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    transactionStore.addLoadBatch(file.name);
    refetch();
    toast.success(`Batch "${file.name}" uploaded`);
  };

  const handleDownloadTemplate = () => {
    const content = 'card_identifier,amount,currency\n****-****-****-1234,100.00,USD\n';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'load_batch_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute><AppLayout>
      <div className="animate-fade-in">
        <PageHeader title="Batch Loads" subtitle="Upload and process bulk load files" actions={
          <Button variant="outline" onClick={() => navigate('/loads')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Loads</Button>
        } />

        <div className="kardit-card p-6 mb-4">
          <h3 className="text-sm font-semibold mb-2">How batch loading works</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a CSV file with card identifiers and amounts. The system will validate each row and process valid loads.</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-1" /> Download Template
            </Button>
            <label className="cursor-pointer">
              <Button variant="default" size="sm" asChild><span><Upload className="h-4 w-4 mr-1" /> Upload File</span></Button>
              <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleUpload} />
            </label>
          </div>
        </div>

        <div className="kardit-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No batch loads yet. Upload a file to get started.</div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Batch ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {batches.map((b, i) => (
                  <tr key={b.id} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                    <td className="px-4 py-3 text-sm font-mono">{b.id}</td>
                    <td className="px-4 py-3 text-sm">{b.fileName}</td>
                    <td className="px-4 py-3"><StatusChip status={b.status as StatusType} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(b.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/loads/batches/${b.id}`)}>
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout></ProtectedRoute>
  );
}

function BatchDetail({ batchId }: { batchId: string }) {
  const navigate = useNavigate();
  const { batch, isLoading, refetch } = useLoadBatch(batchId);
  const [processing, setProcessing] = useState(false);

  if (isLoading) return <ProtectedRoute><AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout></ProtectedRoute>;
  if (!batch) return <ProtectedRoute><AppLayout><div className="text-center py-20 text-muted-foreground">Batch not found.</div></AppLayout></ProtectedRoute>;

  const validCount = batch.rows.filter(r => r.status === 'VALID').length;
  const invalidCount = batch.rows.filter(r => r.status === 'INVALID').length;
  const processedCount = batch.rows.filter(r => r.status === 'PROCESSED').length;
  const failedCount = batch.rows.filter(r => r.status === 'FAILED').length;

  const handleSubmitValid = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    const updatedRows = batch.rows.map(row => {
      if (row.status !== 'VALID') return row;
      const success = Math.random() > 0.15;
      return success
        ? { ...row, status: 'PROCESSED' as const, loadTransactionId: `lt-${Date.now()}-${row.rowNumber}` }
        : { ...row, status: 'FAILED' as const, errors: ['Processing error: insufficient funds'] };
    });
    transactionStore.updateLoadBatch(batchId, { status: 'COMPLETED', rows: updatedRows });
    refetch();
    setProcessing(false);
    toast.success('Batch processing completed');
  };

  const handleDownloadErrors = () => {
    const errorRows = batch.rows.filter(r => r.status === 'FAILED' || r.status === 'INVALID');
    const lines = ['Row,Card,Amount,Status,Errors', ...errorRows.map(r => `${r.rowNumber},${r.cardIdentifier},${r.amount},${r.status},"${(r.errors || []).join('; ')}"`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `errors_${batchId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute><AppLayout>
      <div className="animate-fade-in">
        <PageHeader title={`Batch: ${batch.fileName}`} subtitle={`ID: ${batch.id}`} actions={
          <div className="flex items-center gap-2">
            <StatusChip status={batch.status as StatusType} />
            <Button variant="outline" size="sm" onClick={() => navigate('/loads/batches')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </div>
        } />

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Total Rows</p><p className="text-xl font-bold">{batch.rows.length}</p></div>
          <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Valid</p><p className="text-xl font-bold text-success">{validCount + processedCount}</p></div>
          <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Invalid</p><p className="text-xl font-bold text-destructive">{invalidCount}</p></div>
          {(processedCount > 0 || failedCount > 0) && (
            <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Failed</p><p className="text-xl font-bold text-destructive">{failedCount}</p></div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          {(batch.status === 'UPLOADED' || batch.status === 'VALIDATED') && validCount > 0 && (
            <Button onClick={handleSubmitValid} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit {validCount} valid rows
            </Button>
          )}
          {(invalidCount > 0 || failedCount > 0) && (
            <Button variant="outline" onClick={handleDownloadErrors}><Download className="h-4 w-4 mr-1" /> Download Error Report</Button>
          )}
        </div>

        {/* Rows table */}
        <div className="kardit-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Row</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Errors / TX ID</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {batch.rows.map((r, i) => (
                  <tr key={r.rowNumber} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                    <td className="px-4 py-3 text-sm">{r.rowNumber}</td>
                    <td className="px-4 py-3 text-sm font-mono">{r.cardIdentifier}</td>
                    <td className="px-4 py-3 text-sm text-right">{r.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={
                        r.status === 'VALID' ? 'ACTIVE' as StatusType :
                        r.status === 'INVALID' ? 'REJECTED' as StatusType :
                        r.status === 'PROCESSED' ? 'SUCCESS' as StatusType :
                        'FAILED' as StatusType
                      } label={r.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {r.errors?.join(', ') || r.loadTransactionId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout></ProtectedRoute>
  );
}
