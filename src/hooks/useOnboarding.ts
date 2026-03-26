import { useCallback, useEffect, useState } from 'react';
import type {
  CreateOnboardingSessionRequest,
  OnboardingCase,
  OnboardingDraft,
  SaveContactRequest,
  SaveOrganizationRequest,
  SubmitOnboardingDraftRequest,
  UploadOnboardingDocumentRequest,
  DecisionRequest,
  ProvisionResponse,
} from '@/types/onboardingContracts';
import {
  createOnboardingSession,
  decideOnboardingCase,
  getOnboardingCase,
  getOnboardingDraft,
  listOnboardingCases,
  provisionOnboardingCase,
  removeDocument,
  saveContact,
  saveIssuingBanks,
  saveOrganization,
  submitOnboardingDraft,
  uploadDocument,
} from '@/services/onboardingApi';
import { useAuth } from '@/hooks/useAuth';

export function useOnboardingDraft(draftId: string | undefined) {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!draftId) return;
    setIsLoading(true);
    setError(null);
    try {
      setDraft(await getOnboardingDraft(draftId));
    } catch (e: any) {
      setError(e?.message || 'Failed to load draft');
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateOrganization = useCallback(
    async (org: SaveOrganizationRequest) => {
      if (!draftId) return null;
      const next = await saveOrganization(draftId, org);
      setDraft(prev => ({...prev!, ...next}));
      return next;
    },
    [draftId]
  );

  const updateContact = useCallback(
    async (contact: SaveContactRequest) => {
      if (!draftId) return null;
      const next = await saveContact(draftId, contact);
      setDraft(next);
      return next;
    },
    [draftId]
  );

  const addDocument = useCallback(
    async (payload: UploadOnboardingDocumentRequest) => {
      if (!draftId) return null;
      const next = await uploadDocument(draftId, payload);
      setDraft(prev => ({...prev!, ...next}));
      return next;
    },
    [draftId]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!draftId) return null;
      const next = await removeDocument(draftId, documentId);
      setDraft(next);
      return next;
    },
    [draftId]
  );

  const updateIssuingBanks = useCallback(
    async (issuingBankIds: string[], onboardingSessionId: string) => {
      if (!draftId) return null;
      const next = await saveIssuingBanks(draftId, issuingBankIds, onboardingSessionId);
      // setDraft(next);
      setDraft(prev => ({...prev!, issuingBankIds}))
      return next;
    },
    [draftId]
  );

  const submit = useCallback(
    async (payload: SubmitOnboardingDraftRequest) => {
      if (!draftId) throw new Error('Missing draftId');
      return await submitOnboardingDraft(draftId, payload);
    },
    [draftId]
  );

  return {
    draft,
    isLoading,
    error,
    refresh,
    updateOrganization,
    updateContact,
    addDocument,
    deleteDocument,
    updateIssuingBanks,
    submit,
  };
}

export function useCreateOnboardingSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: CreateOnboardingSessionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await createOnboardingSession(payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to start onboarding');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

export function useOnboardingCase(caseId: string | undefined) {
  const [caseItem, setCaseItem] = useState<OnboardingCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      setCaseItem(await getOnboardingCase(caseId));
    } catch (e: any) {
      setError(e?.message || 'Failed to load case');
      setCaseItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { caseItem, isLoading, error, refresh };
}

export function useReviewerOnboardingCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listOnboardingCases();
      setCases(response.cases || []);
      // setCases(await listOnboardingCases());
    } catch (e: any) {
      setError(e?.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const decide = useCallback(async (caseId: string, payload: DecisionRequest) => {
    const actor = {
      userId: user?.id || 'SR-SP-0007',
      name: user?.name || 'Chamsswitch Super Admin',
      userEmail: user?.email || 'superadmin@kardit.app',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
    const updated = await decideOnboardingCase(caseId, payload, actor);
    setCases((prev) => prev.map((c) => (c.caseId === updated.caseId ? updated : c)));
    return updated;
  }, [user?.email]);

  const provision = useCallback(async (caseId: string): Promise<ProvisionResponse> => {
    const actor = {
      userId: user?.id || 'SR-SP-0007',
      name: user?.name || 'Chamsswitch Super Admin',
      userEmail: user?.email || 'superadmin@kardit.app',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
    const res = await provisionOnboardingCase(caseId, actor);
    await refresh();
    return res;
  }, [refresh, user?.email]);

  return { cases, isLoading, error, refresh, decide, provision };
}
