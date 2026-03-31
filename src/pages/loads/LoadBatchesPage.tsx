import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { executeBatchLoad, getBatchLoadResults, uploadBatchLoad } from '@/services/cardsApi';
import { useLoadBatch, useLoadBatches } from '@/hooks/useLoads';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, FileText, Loader2, Upload } from 'lucide-react';

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function mapStatus(status: string): StatusType {
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') return 'SUCCESS' as StatusType;
  if (normalized === 'FAILED') return 'FAILED' as StatusType;
  if (normalized === 'VALIDATED' || normalized === 'UPLOADED') return 'ACTIVE' as StatusType;
  if (normalized === 'VALIDATION_FAILED') return 'REJECTED' as StatusType;
  return 'PENDING' as StatusType;
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

export default function LoadBatchesPage() {
  const { batchId } = useParams<{ batchId: string }>();
  if (batchId) return <BatchDetail batchId={batchId} />;
  return <BatchList />;
}

function BatchList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { batches, isLoading, refetch, registerUpload } = useLoadBatches();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const response = await uploadBatchLoad({
        requestContext: {
          requestId: randomId('batch-load-upload'),
          actorUserId: user?.id || 'user_unknown',
          tenantId: user?.tenantId || 'tenant_unknown',
          affiliateId: user?.tenantId || 'affiliate_unknown',
        },
        file: {
          fileName: file.name,
          contentType: file.type || 'text/csv',
          fileBase64,
        },
      });
      registerUpload(file.name, response);
      await refetch();
      toast.success(`Batch ${response.batchId} uploaded`);
      navigate(`/loads/batches/${response.batchId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const content = 'cardId,amount,currency,reference\nCARD-2026-000551,750000,NGN,TRF-2026-009811\nCARD-2026-000552,250000,NGN,TRF-2026-009812\n';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_load_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Batch Loads"
            subtitle="Upload and process bulk card load files"
            actions={<Button variant="outline" onClick={() => navigate('/loads')}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Loads</Button>}
          />

          <div className="kardit-card p-6 mb-4">
            <h3 className="text-sm font-semibold mb-2">How batch loading works</h3>
            <p className="text-sm text-muted-foreground mb-3">Upload a CSV file, let the API validate the rows, then execute the batch from the detail screen once validation passes.</p>
            <p className="text-xs text-muted-foreground mb-4">Required columns: <span className="font-mono text-foreground">cardId</span>, <span className="font-mono text-foreground">amount</span>, <span className="font-mono text-foreground">currency</span>, <span className="font-mono text-foreground">reference</span></p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Download Template
              </Button>
              <label className="cursor-pointer">
                <Button variant="default" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />} Upload File</span>
                </Button>
                <input type="file" className="hidden" accept=".csv" onChange={handleUpload} />
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rows</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {batches.map((batch, i) => (
                    <tr key={batch.batchId} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                      <td className="px-4 py-3 text-sm font-mono">{batch.batchId}</td>
                      <td className="px-4 py-3 text-sm">{batch.fileName}</td>
                      <td className="px-4 py-3"><StatusChip status={mapStatus(batch.status)} label={batch.status} /></td>
                      <td className="px-4 py-3 text-sm">{batch.successfulRows}/{batch.totalRows} successful</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(batch.lastUpdatedAt || batch.uploadedAt), 'MMM d, yyyy HH:mm')}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/loads/batches/${batch.batchId}`)}>
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
      </AppLayout>
    </ProtectedRoute>
  );
}

function BatchDetail({ batchId }: { batchId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { batch, isLoading, refetch } = useLoadBatch(batchId);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}><AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout></ProtectedRoute>;
  }

  if (!batch) {
    return <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}><AppLayout><div className="text-center py-20 text-muted-foreground">Batch not found.</div></AppLayout></ProtectedRoute>;
  }

  const validation = batch.upload;
  const canExecute = batch.batch.status !== 'COMPLETED' && (validation?.validationStatus || '').toUpperCase() !== 'FAILED';

  const handleExecute = async () => {
    setProcessing(true);
    try {
      const response = await executeBatchLoad(batchId, {
        requestContext: {
          requestId: randomId('batch-load-exec'),
          actorUserId: user?.id || 'user_unknown',
          tenantId: user?.tenantId || 'tenant_unknown',
          affiliateId: user?.tenantId || 'affiliate_unknown',
        },
      });
      toast.success(`Batch ${response.batchId} executed`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch execution failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadResults = async () => {
    setDownloading(true);
    try {
      const response = batch.results || await getBatchLoadResults(batchId);
      window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opened ${response.resultFile}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download results');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title={`Batch ${batch.batch.batchId}`}
            subtitle={validation ? validation.fileName : 'Batch load detail'}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={mapStatus(batch.batch.status)} label={batch.batch.status} />
                <Button variant="outline" size="sm" onClick={() => navigate('/loads/batches')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              </div>
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Total Rows</p><p className="text-xl font-bold">{batch.batch.totalRows}</p></div>
            <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Successful</p><p className="text-xl font-bold text-success">{batch.batch.successfulRows}</p></div>
            <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Failed</p><p className="text-xl font-bold text-destructive">{batch.batch.failedRows}</p></div>
            <div className="kardit-card p-4"><p className="text-xs text-muted-foreground uppercase">Processed Amount</p><p className="text-xl font-bold">{batch.batch.totalProcessedAmount.toLocaleString('en-US')}</p></div>
          </div>

          <div className="kardit-card p-6 mb-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              {canExecute && (
                <Button onClick={handleExecute} disabled={processing}>
                  {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Execute Batch
                </Button>
              )}
              {batch.results && (
                <Button variant="outline" onClick={handleDownloadResults} disabled={downloading}>
                  {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                  Download Results
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Validation Status</p>
                <p>{validation?.validationStatus || 'Unavailable'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Last Updated</p>
                <p>{format(new Date(batch.batch.lastUpdatedAt), 'PPP p')}</p>
              </div>
            </div>
          </div>

          <div className="kardit-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Validation Errors</h3>
            {validation?.errors?.length ? (
              <div className="space-y-3">
                {validation.errors.map((error) => (
                  <div key={`${error.rowNumber}-${error.errorCode}`} className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Row {error.rowNumber} - {error.errorCode}</p>
                    <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No validation errors were returned for this batch.</p>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
