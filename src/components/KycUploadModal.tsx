import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusChip } from '@/components/ui/status-chip';
import { Upload, X, FileText } from 'lucide-react';

interface KycUploadModalProps {
  open: boolean;
  onClose: () => void;
  documents: { type: string; fileName: string }[];
  onDocumentsChange: (docs: { type: string; fileName: string }[]) => void;
}

const DOC_TYPES = ['ID_FRONT', 'ID_BACK', 'PROOF_OF_ADDRESS'];

export function KycUploadModal({ open, onClose, documents, onDocumentsChange }: KycUploadModalProps) {
  const [selectedType, setSelectedType] = useState('ID_FRONT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onDocumentsChange([...documents, { type: selectedType, fileName: file.name }]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDoc = (index: number) => {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload KYC Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-muted border-border flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Browse
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf" />
          </div>

          {/* Document List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No documents added yet.</p>
            ) : (
              documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status="PROCESSING" label="Staged" />
                    <button type="button" onClick={() => removeDoc(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
