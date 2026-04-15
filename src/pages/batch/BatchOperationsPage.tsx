import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatch, useBatches } from '@/hooks/useBatches';
import { CARD_PRODUCTS } from '@/stores/mockStore';
import { CreditCard, Download, Loader2, Upload } from 'lucide-react';

function mapStatus(status: string): StatusType {
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') return 'SUCCESS' as StatusType;
  if (normalized === 'FAILED') return 'FAILED' as StatusType;
  if (normalized === 'UPLOADED') return 'PENDING' as StatusType;
  if (normalized === 'PROCESSING') return 'PROCESSING' as StatusType;
  return 'ACTIVE' as StatusType;
}

export default function BatchOperationsPage() {
  const { batches, isLoading, upload } = useBatches('cards');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;

    setUploading(true);
    try {
      const response = await upload({
        category: 'cards',
        file,
        productId: selectedProductId,
      });
      setSelectedBatchId(response.batchId);
      toast.success(`Batch ${response.batchId} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const content = 'customerId,embossName,deliveryMethod,currency\nCUST-001,JANE DOE,COURIER,USD\n';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card_batch_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded.');
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Batch Operations" subtitle="Bulk card issuance" />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <div className="kardit-card p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-medium">Batch Card Creation</h2>
                    <p className="text-sm text-muted-foreground">Upload a file, choose the issuing product, then submit and execute the batch from the history panel.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Product <span className="text-destructive">*</span></label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {CARD_PRODUCTS.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name} ({product.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <Download className="h-4 w-4 mr-1" /> Template
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={!selectedProductId || uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />} Upload File
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">Upload request requirements: actor user, affiliate scope, product, and CSV file content.</p>
              </div>

              <div className="kardit-card overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : batches.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">No card issuance batches uploaded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Batch ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Records</th>
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
                            <td className="px-4 py-3 text-sm">{CARD_PRODUCTS.find((product) => product.id === batch.productId)?.name || batch.productId || '—'}</td>
                            <td className="px-4 py-3"><StatusChip status={mapStatus(batch.status)} label={batch.status} /></td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{batch.processedRows}/{batch.totalRows}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <CardBatchDetail batchId={selectedBatchId} />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CardBatchDetail({ batchId }: { batchId: string | null }) {
  const { batch, isLoading, refetch } = useBatch(batchId || undefined);
  const { validate, submit } = useBatches('cards');
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadResults = async () => {
    if (!batch?.results) return;
    setDownloading(true);
    try {
      window.open(batch.results.downloadUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opened ${batch.results.resultFile}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="kardit-card p-6">
      {!batchId ? (
        <p className="text-sm text-muted-foreground">Select a card batch to view its current state and actions.</p>
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
          <div className="text-sm text-muted-foreground">
            Uploaded: {format(new Date(batch.upload.uploadedAt), 'MMM d, yyyy HH:mm')}
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
            <Button variant="outline" onClick={handleDownloadResults} disabled={!batch.results || downloading}>
              {downloading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Results
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
          {batch.results && (
            <div className="text-sm text-muted-foreground">
              Result file: <span className="font-mono text-foreground">{batch.results.resultFile}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
