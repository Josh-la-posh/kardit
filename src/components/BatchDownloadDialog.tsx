import { useState } from 'react';
import { Download, FileDown, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadProtectedBatchFile } from '@/services/batchApi';
import type { GetBatchResultsResponse } from '@/types/batchContracts';

interface BatchDownloadDialogProps {
  download: GetBatchResultsResponse | null;
  onClose: () => void;
}

export function BatchDownloadDialog({ download, onClose }: BatchDownloadDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!download) return;

    setIsDownloading(true);
    try {
      const { blob, fileName } = await downloadProtectedBatchFile(
        download.downloadUrl,
        download.resultFile
      );
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success(`${fileName} downloaded.`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not download batch results');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      open={download !== null}
      onOpenChange={(open) => {
        if (!open && !isDownloading) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (isDownloading) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isDownloading) event.preventDefault();
        }}
      >
        <DialogHeader className="pr-20">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileDown className="h-6 w-6" />
          </div>
          <DialogTitle>Download batch results</DialogTitle>
          <DialogDescription>
            Your result file is ready. Downloading it requires your secure session.
          </DialogDescription>
        </DialogHeader>

        {download && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">File</p>
              <p className="mt-1 break-all text-sm font-medium">{download.resultFile}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Batch ID</p>
              <p className="mt-1 break-all font-mono text-xs">{download.batchId}</p>
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              Authorized download
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!download || isDownloading}>
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
