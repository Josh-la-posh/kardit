import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KarditLogo } from '@/components/KarditLogo';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, FileText, Loader2, Upload, X } from 'lucide-react';
import type { OnboardingDocumentType } from '@/types/onboardingContracts';
import { StatusChip } from '@/components/ui/status-chip';

const DOC_TYPES: Array<{ value: OnboardingDocumentType; label: string }> = [
  { value: 'CERTIFICATE_OF_INCORPORATION', label: 'Certificate of Incorporation' },
  { value: 'TAX_ID', label: 'Tax ID' },
  { value: 'DIRECTORS_ID', label: "Directors' ID" },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address' },
  { value: 'OTHER', label: 'Other' },
];

export default function OnboardingDocumentsPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, addDocument, deleteDocument } = useOnboardingDraft(draftId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<OnboardingDocumentType>('CERTIFICATE_OF_INCORPORATION');
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    setSaving(true);
    try {
      await addDocument({ type: selectedType, fileName: file.name });
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to upload document');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onRemove = async (documentId: string) => {
    setSaving(true);
    try {
      await deleteDocument(documentId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="flex justify-center mb-6">
          <KarditLogo size="md" />
        </div>

        <div className="kardit-card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">KYB/KYC document upload</h1>
            <p className="text-sm text-muted-foreground">Upload supporting documents for review.</p>
          </div>

          {(localError || error) && (
            <div className="mb-5 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as OnboardingDocumentType)}>
                  <SelectTrigger className="bg-muted border-border flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  <Upload className="h-4 w-4" /> Browse
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} accept="image/*,.pdf" />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {draft?.documents?.length ? (
                  draft.documents.map((doc) => (
                    <div key={doc.documentId} className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status="PROCESSING" label="Staged" />
                        <button type="button" onClick={() => onRemove(doc.documentId)} className="text-muted-foreground hover:text-destructive transition-colors" disabled={saving}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</p>
                )}
              </div>

              <div className="flex justify-between gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => navigate(`/onboarding/${draftId}/organization`)} disabled={saving}>Back</Button>
                <Button type="button" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={saving}>Next</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
