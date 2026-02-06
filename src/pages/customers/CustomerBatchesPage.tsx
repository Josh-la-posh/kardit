import React, { useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { useBatches } from '@/hooks/useBatches';
import { Download, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CustomerBatchesPage() {
  const { batches, isLoading, addBatch } = useBatches();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    await addBatch(file.name);
    toast.success(`Batch "${file.name}" uploaded (mock).`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusMap: Record<string, StatusType> = {
    UPLOADED: 'PENDING',
    VALIDATING: 'PROCESSING',
    VALIDATED: 'ACTIVE',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'SUCCESS',
    FAILED: 'FAILED',
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Customer Batches"
            subtitle="Bulk customer onboarding"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4" /> Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload File
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx" />
              </div>
            }
          />

          {/* Instructions */}
          <div className="kardit-card p-6 mb-4">
            <h3 className="font-medium mb-2">How batch uploads work</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Download the CSV template using the button above.</li>
              <li>Fill in customer details following the template format.</li>
              <li>Upload the completed file.</li>
              <li>The system will validate and process records automatically.</li>
            </ol>
          </div>

          {/* Batches Table */}
          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No batches uploaded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
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
                    {batches.map((b, i) => (
                      <tr key={b.id} className={`transition-colors hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-3 text-sm font-mono text-primary">{b.id}</td>
                        <td className="px-4 py-3 text-sm">{b.fileName}</td>
                        <td className="px-4 py-3"><StatusChip status={statusMap[b.status] || 'PENDING'} label={b.status} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{b.totalRecords ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(b.createdAt), 'MMM d, yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
