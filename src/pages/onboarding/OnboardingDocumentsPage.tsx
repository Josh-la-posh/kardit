import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';
import type { OnboardingDocumentType } from '@/types/onboardingContracts';
import { StatusChip } from '@/components/ui/status-chip';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

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
  const { draft, isLoading, error, addDocument } = useOnboardingDraft(draftId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<OnboardingDocumentType>('CERTIFICATE_OF_INCORPORATION');
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const [, base64 = ''] = result.split(',');
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    setSaving(true);
    try {
      if (!draft?.onboardingSessionId) {
        throw new Error('Missing onboarding session ID. Please restart onboarding.');
      }
      const fileBase64 = await toBase64(file);
      await addDocument({
        onboardingSessionId: draft.onboardingSessionId,
        docType: selectedType,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileBase64,
      });
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to upload document');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <PublicOnboardingLayout
      currentStep="documents"
      draftId={draftId}
      draft={draft}
      title="KYB and KYC documents"
      description="Upload the supporting files needed for verification. The upload flow stays the same, with a clearer workspace for managing document status."
    >
      <div className="animate-fade-in">

        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Upload center</h3>
                  <p className="mt-1 text-sm text-slate-600">Select a document type, then add the corresponding file to your submission.</p>
                </div>
                <div className="rounded-full border border-primary/15 bg-[#e9f5eb] px-3 py-1 text-xs font-semibold text-primary">
                  {draft?.documents?.length || 0} uploaded
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as OnboardingDocumentType)}>
                  <SelectTrigger className="h-12 flex-1 rounded-xl border-[#d6e3d8] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" className="h-12 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  <Upload className="h-4 w-4" /> Browse files
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} accept="image/*,.pdf" />
              </div>
            </section>

            <section className="mt-6 rounded-[1.5rem] border border-[#e3ece5] bg-[#fbfdfb] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Uploaded documents</h3>
                <p className="mt-1 text-sm text-slate-600">Each upload remains visible here together with its current verification state.</p>
              </div>
              <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                {draft?.documents?.length ? (
                  draft.documents.map((doc) => (
                    <div key={doc.documentId} className="flex flex-col gap-3 rounded-2xl border border-[#e3ece5] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dce7de] bg-[#f5faf6]">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status="PROCESSING" label={doc.verificationStatus || 'PENDING'} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[#d6e3d8] bg-white py-10 text-center text-sm text-slate-500">No documents uploaded yet.</p>
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[#e6eee7] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[#d6e3d8] bg-white px-5" onClick={() => navigate(`/onboarding/${draftId}/organization`)} disabled={saving}>Back</Button>
              <Button type="button" className="h-11 rounded-xl px-6" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={saving}>Continue to issuing banks</Button>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
