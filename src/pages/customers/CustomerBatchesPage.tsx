import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { BatchDownloadDialog } from '@/components/BatchDownloadDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useBatch, useBatches } from '@/hooks/useBatches';
import { downloadBatchResults } from '@/services/batchApi';
import type { BatchResultsFormat, GetBatchResultsResponse } from '@/types/batchContracts';
import { Download, Loader2, Upload } from 'lucide-react';

function mapStatus(status: string): StatusType {
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') return 'SUCCESS' as StatusType;
  if (normalized === 'FAILED') return 'FAILED' as StatusType;
  if (normalized === 'UPLOADED') return 'PENDING' as StatusType;
  if (normalized === 'PROCESSING') return 'PROCESSING' as StatusType;
  return 'ACTIVE' as StatusType;
}

export default function CustomerBatchesPage() {
  const { batches, isLoading, upload } = useBatches('customers');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const content = 'firstName,lastName,email,phone,dateOfBirth,nationality,idType,idNumber\n';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await upload({ category: 'customers', file });
      setSelectedBatchId(response.batchId);
      toast.success(`Batch ${response.batchId} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Customer Batches</h1>
                <p className="page-sub">Bulk customer onboarding</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4" /> Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload File
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
              </div>
            </header>

          <section className="card card-pad">
            <h3 className="font-medium mb-2">How batch uploads work</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Download the CSV template.</li>
              <li>Upload the completed file to create a batch record.</li>
              <li>Select a batch below to submit, execute, and download results.</li>
            </ol>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <section className="xl:col-span-2 card" style={{ overflow: 'hidden' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : batches.length === 0 ? (
                <div className="empty-list">
                  <div className="empty-list-title">No batches uploaded yet.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Batch ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Records</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {batches.map((batch, i) => (
                        <tr
                          key={batch.batchId}
                          onClick={() => setSelectedBatchId(batch.batchId)}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 ${selectedBatchId === batch.batchId ? 'bg-primary/10' : i % 2 === 1 ? 'bg-muted/20' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm font-mono text-primary">{batch.batchId}</td>
                          <td className="px-4 py-3 text-sm">{batch.fileName}</td>
                          <td className="px-4 py-3"><StatusChip status={mapStatus(batch.status)} label={batch.status} /></td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{batch.processedRows}/{batch.totalRows}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(batch.uploadedAt), 'MMM d, yyyy HH:mm')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <CustomerBatchDetail batchId={selectedBatchId} />
          </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CustomerBatchDetail({ batchId }: { batchId: string | null }) {
  const { batch, isLoading, refetch } = useBatch(batchId || undefined);
  const { validate, submit } = useBatches('customers');
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState<BatchResultsFormat | null>(null);
  const [downloadDetails, setDownloadDetails] = useState<GetBatchResultsResponse | null>(null);

  const handleValidate = async () => {
    if (!batchId) return;
    setValidating(true);
    try {
      const response = await validate(batchId);
      toast.success(`Batch ${response.batchId} validated.`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to validate batch');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!batchId) return;
    setSubmitting(true);
    try {
      const response = await submit(batchId);
      toast.success(`Batch ${response.batchId} submitted.`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadResults = async (format: BatchResultsFormat) => {
    if (!batchId) return;
    setDownloading(format);
    try {
      const response = await downloadBatchResults(batchId, format);
      setDownloadDetails(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download batch results');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
    <section className="card card-pad">
      {!batchId ? (
        <p className="text-sm text-muted-foreground">Select a batch to view its status and actions.</p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !batch ? (
        <p className="text-sm text-muted-foreground">Batch not found.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Batch ID</p>
            <p className="text-sm font-mono">{batch.batch.batchId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            <StatusChip status={mapStatus(batch.batch.status)} label={batch.batch.status} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground uppercase">Total</p><p>{batch.batch.totalRows}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase">Valid</p><p>{batch.batch.validRows}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase">Invalid</p><p>{batch.batch.invalidRows}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase">Processed</p><p>{batch.batch.processedRows}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase">Failed</p><p>{batch.batch.failedRows}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase">Rows Shown</p><p>{batch.rows.length}/{batch.rowsTotal}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleValidate} disabled={validating}>
              {validating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Validate
            </Button>
            <Button variant="outline" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Submit
            </Button>
            <Button variant="outline" onClick={() => handleDownloadResults('csv')} disabled={downloading !== null}>
              {downloading === 'csv' && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} CSV Results
            </Button>
            <Button variant="outline" onClick={() => handleDownloadResults('excel')} disabled={downloading !== null}>
              {downloading === 'excel' && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Excel Results
            </Button>
          </div>
          {batch.rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Rows</p>
              {batch.rows.slice(0, 5).map((row) => (
                <div key={row.rowNumber} className="rounded-md border border-border p-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="font-mono">Row {row.rowNumber}</span>
                    <span>{row.status}</span>
                  </div>
                  {row.errors?.map((error) => (
                    <p key={`${row.rowNumber}-${error.errorCode}`} className="mt-1 text-muted-foreground">{error.message}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
    <BatchDownloadDialog download={downloadDetails} onClose={() => setDownloadDetails(null)} />
    </>
  );
}
