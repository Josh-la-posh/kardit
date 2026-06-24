import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingDraft } from '@/hooks/useOnboarding';
import { AlertCircle, Check, Loader2, RefreshCcw, Trash2, Upload } from 'lucide-react';
import type { OnboardingDocumentType } from '@/types/onboardingContracts';
import PublicOnboardingLayout from '@/components/onboarding/PublicOnboardingLayout';

const DOC_TYPES: Array<{ value: OnboardingDocumentType; label: string }> = [
  { value: 'CERTIFICATE_OF_INCORPORATION', label: 'CAC Certificate' },
  { value: 'TAX_IDENTIFICATION_CERTIFICATE', label: 'TIN Certificate' },
  { value: 'ARTICLES_OF_ASSOCIATION', label: "Articles of Association" },
  { value: 'BOARD_RESOLUTION', label: 'Board Resolution' },
  { value: 'MEMORANDUM_OF_ASSOCIATION', label: 'Memorandum of Association' },
];

const REQUIRED_TYPES: OnboardingDocumentType[] = [
  'CERTIFICATE_OF_INCORPORATION',
  'TAX_IDENTIFICATION_CERTIFICATE',
  'ARTICLES_OF_ASSOCIATION',
  'BOARD_RESOLUTION',
  'MEMORANDUM_OF_ASSOCIATION'
];

export default function OnboardingDocumentsPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { draft, isLoading, error, addDocument } = useOnboardingDraft(draftId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<OnboardingDocumentType>('CERTIFICATE_OF_INCORPORATION');
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const documents = draft?.documents || [];
  const uploadedRequiredCount = REQUIRED_TYPES.filter((type) => documents.some((doc) => doc.type === type)).length;
  const remainingCount = REQUIRED_TYPES.length - uploadedRequiredCount;

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

  const getUploadedDoc = (docType: OnboardingDocumentType) => documents.find((doc) => doc.type === docType);

  const formatSize = (sizeInBytes?: number) => {
    if (!sizeInBytes || sizeInBytes <= 0) return '';
    const mb = sizeInBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const removeDocumentFromDraft = (docType: OnboardingDocumentType) => {
    if (!draft) return;
    const nextDocs = documents.filter((doc) => doc.type !== docType);
    const raw = localStorage.getItem('kardit.onboarding.drafts.v2');
    const allDrafts = raw ? (JSON.parse(raw) as Record<string, any>) : {};
    localStorage.setItem(
      'kardit.onboarding.drafts.v2',
      JSON.stringify({
        ...allDrafts,
        [draft.draftId]: {
          ...draft,
          documents: nextDocs,
        },
      })
    );
    window.location.reload();
  };

  return (
    <PublicOnboardingLayout
      currentStep="documents"
      draftId={draftId}
      draft={draft}
      title="Upload required documents"
      description="All documents must be in PDF, JPG or PNG format and under 5MB. We accept clear scans or smartphone photos"
    >
      <div className="animate-fade-in ">
        {(localError || error) && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-[hsl(var(--landing-panel-border))] bg-[hsl(var(--landing-panel))] py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-dashed border-[var(--cs-green-300)] bg-[var(--cs-green-100)] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cs-bg-elevated)] text-[var(--cs-green-700)]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-[var(--cs-ink-900)]">Drag and drop files here</p>
                    <p className="mt-1 text-sm text-[var(--cs-ink-200)]">or click to browse. We'll auto-detect document type where possible.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--cs-line)]  shadow-[var(--cs-shadow-lg)]">
                  <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as OnboardingDocumentType)}>
                      <SelectTrigger className="h-11 min-w-[220px] rounded-xl border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl border-[var(--cs-green-700)] px-5 text-[var(--cs-green-700)]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                    >
                      Browse files
                    </Button>
                  </div>
                </div>

              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} accept="image/*,.pdf" />
            </section>

            <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--cs-line)] bg-[var(--cs-bg-elevated)]">
              <div className="flex items-center justify-between border-b border-[var(--cs-line)] px-5 py-4">
                <h3 className="text-lg font-semibold text-[var(--cs-ink-900)]">Required documents ({uploadedRequiredCount}/{REQUIRED_TYPES.length})</h3>
                <div className="rounded-full border border-[var(--cs-blue-300)] bg-[var(--cs-blue-100)] px-3 py-1 text-xs font-semibold text-[var(--cs-blue-900)]">
                  {remainingCount} remaining
                </div>
              </div>

              <div>
                {REQUIRED_TYPES.map((docType, idx) => {
                  const uploadedDoc = getUploadedDoc(docType);
                  const docLabel = DOC_TYPES.find((item) => item.value === docType)?.label || docType;
                  return (
                    <div
                      key={docType}
                      className={`flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between ${idx !== REQUIRED_TYPES.length - 1 ? 'border-b border-[var(--cs-line)]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`grid h-10 w-10 place-items-center rounded-xl ${uploadedDoc ? 'bg-[var(--cs-green-100)] text-[var(--cs-green-700)]' : 'bg-[var(--cs-mist)] text-[var(--cs-ink-200)]'}`}>
                          {uploadedDoc ? <Check className="h-5 w-5" /> : <Upload className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[var(--cs-ink-900)]">{docLabel}</p>
                          {uploadedDoc ? (
                            <p className="text-sm text-[var(--cs-ink-200)]">
                              {uploadedDoc.fileName}
                              {formatSize(uploadedDoc.fileSize) ? ` - ${formatSize(uploadedDoc.fileSize)}` : ''}
                              {' - uploaded'}
                            </p>
                          ) : (
                            <p className="text-sm text-[var(--cs-ink-200)]">Not uploaded yet</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-lg px-2 text-[var(--cs-ink-700)]"
                          onClick={() => {
                            setSelectedType(docType);
                            fileInputRef.current?.click();
                          }}
                          disabled={saving}
                        >
                          <RefreshCcw className="h-4 w-4" /> {uploadedDoc ? 'Replace' : 'Upload'}
                        </Button>
                        {uploadedDoc && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 rounded-lg px-2 text-destructive hover:text-destructive"
                            onClick={() => removeDocumentFromDraft(docType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[hsl(var(--landing-panel-border))] pt-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 rounded-xl border-[hsl(var(--landing-panel-border))] bg-card px-5" onClick={() => navigate(`/onboarding/${draftId}/organization`)} disabled={saving}>Back</Button>
              <Button type="button" className="h-11 rounded-xl px-6" onClick={() => navigate(`/onboarding/${draftId}/issuing-banks`)} disabled={saving}>Select Bank</Button>
            </div>
          </>
        )}
      </div>
    </PublicOnboardingLayout>
  );
}
