import { useCallback, useEffect, useState } from 'react';
import type {
  CreateOnboardingSessionRequest,
  OnboardingCase,
  OnboardingDraft,
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
  getStoredOnboardingDraft,
  getStoredOnboardingSessionIdForCase,
  listOnboardingCases,
  provisionOnboardingCase,
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
      setDraft(getStoredOnboardingDraft(draftId));
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
      const res = await saveOrganization(draftId, org);
      setDraft(getStoredOnboardingDraft(draftId));
      return res;
    },
    [draftId]
  );

  const addDocument = useCallback(
    async (payload: UploadOnboardingDocumentRequest) => {
      if (!draftId) return null;
      const result = await uploadDocument(draftId, payload);
      setDraft(getStoredOnboardingDraft(draftId));
      return result;
    },
    [draftId]
  );

  const updateIssuingBanks = useCallback(
    async (issuingBankIds: string[], onboardingSessionId: string) => {
      if (!draftId) return null;
      const req = {
        onboardingSessionId,
        selectedBanks: issuingBankIds.map(bankId => ({ bankId })),
      };
      const res = await saveIssuingBanks(draftId, req);
      setDraft(getStoredOnboardingDraft(draftId));
      return res;
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
    addDocument,
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
      const onboardingSessionId = getStoredOnboardingSessionIdForCase(caseId);
      if (!onboardingSessionId) {
        throw new Error('Missing onboarding session. Please restart onboarding from the original device.');
      }
      setCaseItem(await getOnboardingCase(caseId, onboardingSessionId));
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
      const response = await listOnboardingCases({ page: 1, pageSize: 25 });
      setCases(
        response.cases.map((item) => ({
          caseId: item.caseId,
          status: item.status,
          submittedAt: item.submittedAt,
          updatedAt: item.submittedAt,
          organization: {
            onboardingSessionId: '',
            legalName: item.affiliateName,
            registrationNumber: '',
            address: {
              line1: '',
              country: '',
            },
            primaryContact: {
              fullName: '',
              email: '',
              phone: '',
            },
          },
          documents: [],
          issuingBankIds: [],
          timeline: [],
          messages: [],
        }))
      );
    } catch (e) {
      setError((e as Error)?.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const decide = useCallback(async (caseId: string, payload: DecisionRequest) => {
    const updated = await decideOnboardingCase(caseId, payload);
    setCases((prev) => prev.map((c) => (c.caseId === updated.caseId ? { ...c, status: updated.status } : c)));
    return updated;
  }, []);


  const provision = useCallback(async (
    caseId: string,
    adminContact: { fullName: string; email: string; phone: string } = {
      fullName: 'Platform Admin',
      email: user?.email || 'admin@kardit.app',
      phone: '+2340000000000',
    },
    deliveryChannels: string[] = ['EMAIL']
  ): Promise<ProvisionResponse> => {
    const req = {
      adminContact,
      deliveryChannels,
    };
    const res = await provisionOnboardingCase(caseId, req);
    await refresh();
    return res;
  }, [refresh]);

  return { cases, isLoading, error, refresh, decide, provision };
}
