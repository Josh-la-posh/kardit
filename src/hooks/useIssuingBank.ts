import { useState, useCallback, useEffect } from 'react';
import { store, type IssuingBankSession, type IssuingBank, type IssuingBankDetails } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';
import { createIssuingBankSession } from '@/services/bankIssuingApi';
import { CreateIssuingBankRequest } from '@/types/bankIssuingContracts';

export function useCreateIssuingBankSession() {
  const { user } = useAuth();

  const create = useCallback(async (bankDetails: IssuingBankDetails & { contactFullName?: string }): Promise<IssuingBankSession> => {
    const tenantId = user?.tenantId || 'tenant_default';

    // Transform bankDetails to API contract
    const payload: CreateIssuingBankRequest = {
      legalName: bankDetails.name,
      shortName: bankDetails.shortName,
      bankCode: bankDetails.code,
      country: bankDetails.country,
      primaryContact: {
        fullName: bankDetails.contactFullName || 'Primary Contact',
        email: bankDetails.contactEmail,
        phone: bankDetails.contactPhone,
      },
      status: 'ACTIVE',
    };

    const apiResponse = await createIssuingBankSession(payload);

    const session = store.createIssuingBankSession(tenantId, {
      ...bankDetails,
      name: apiResponse.legalName,
    });

    return store.updateIssuingBankSession(session.sessionId, {
      bankId: apiResponse.bankId,
      bankDetails: {
        ...session.bankDetails,
        name: apiResponse.legalName,
        shortName: apiResponse.shortName || session.bankDetails.shortName,
      },
      internalAffiliate: {
        ...apiResponse.internalAffiliate,
        legalName: apiResponse.internalAffiliate.legalName || apiResponse.legalName,
        shortName: apiResponse.internalAffiliate.shortName || apiResponse.shortName || session.bankDetails.shortName,
      },
      internalPartnership: apiResponse.internalPartnership,
      updatedAt: apiResponse.provisionedAt,
    }) || session;
  }, [user?.tenantId]);

  return { create };
}

export function useIssuingBankSession(sessionId: string | undefined) {
  const [session, setSession] = useState<IssuingBankSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const s = store.getIssuingBankSession(sessionId);
      if (!s) throw new Error('Session not found');
      setSession(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to load session');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateBankDetails = useCallback(
    async (bankDetails: Partial<IssuingBankDetails>) => {
      if (!sessionId) return null;
      const current = store.getIssuingBankSession(sessionId);
      if (!current) return null;
      await new Promise((r) => setTimeout(r, 300));
      const updated = store.updateIssuingBankSession(sessionId, {
        bankDetails: { ...current.bankDetails, ...bankDetails },
      });
      setSession(updated);
      return updated;
    },
    [sessionId]
  );

  const submit = useCallback(async () => {
    if (!sessionId) return null;
    await new Promise((r) => setTimeout(r, 300));
    const submitted = store.submitIssuingBankSession(sessionId);
    setSession(submitted);
    return submitted;
  }, [sessionId]);

  const startProvisioning = useCallback(async () => {
    if (!sessionId) return null;
    await new Promise((r) => setTimeout(r, 300));
    const provisioning = store.provisionIssuingBankSession(sessionId);
    setSession(provisioning);
    return provisioning;
  }, [sessionId]);

  return {
    session,
    isLoading,
    error,
    refresh,
    updateBankDetails,
    submit,
    startProvisioning,
  };
}

export function useProvisioningProgress(sessionId: string | undefined) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Validating Bank Information');
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const steps = [
      { label: 'Validating Bank Information', duration: 2000 },
      { label: 'Setting Up Bank Account', duration: 2500 },
      { label: 'Configuring Integration', duration: 2000 },
      { label: 'Finalizing Setup', duration: 1500 },
    ];

    let currentStep = 0;
    let startTime = Date.now();

    const simulateFailure = Math.random() < 0.1; // 10% failure rate
    const failAtStep = simulateFailure ? Math.floor(Math.random() * steps.length) : -1;

    const errorMessages = [
      'Bank validation failed: Invalid routing number',
      'Account setup timeout: Please try again',
      'Integration configuration failed: Contact support',
      'Setup finalization error: Temporary service unavailable',
    ];

    const interval = setInterval(() => {
      const now = Date.now();
      const stepElapsed = now - startTime;
      const stepDuration = steps[currentStep].duration;

      if (stepElapsed >= stepDuration) {
        // Check for failure
        if (simulateFailure && currentStep === failAtStep) {
          setStatus(steps[currentStep].label);
          setProgress(((currentStep + 1) / steps.length) * 100);
          setIsFailed(true);
          setErrorMessage(errorMessages[currentStep]);
          clearInterval(interval);
          store.failProvisioning(sessionId, errorMessages[currentStep]);
          return;
        }

        currentStep++;
        if (currentStep >= steps.length) {
          // Success
          setProgress(100);
          setStatus('Setup Complete');
          setIsComplete(true);
          clearInterval(interval);
          store.completeProvisioning(sessionId);
        } else {
          startTime = now; // Reset for next step
          setStatus(steps[currentStep].label);
          setProgress(((currentStep + 1) / steps.length) * 100);
          store.updateProvisioningProgress(
            sessionId,
            ((currentStep + 1) / steps.length) * 100
          );
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sessionId]);

  return { progress, status, isComplete, isFailed, errorMessage };
}

export function useIssuingBanks() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<IssuingBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const tenantId = user?.tenantId || 'tenant_default';
    await new Promise((r) => setTimeout(r, 300));
    setBanks(store.getAllIssuingBanks(tenantId));
    setIsLoading(false);
  }, [user?.tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { banks, isLoading, refetch: fetch };
}

export function useIssuingBank(bankId: string | undefined) {
  const [bank, setBank] = useState<IssuingBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!bankId) return;
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const b = store.getIssuingBank(bankId);
      if (!b) throw new Error('Bank not found');
      setBank(b);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank');
      setBank(null);
    } finally {
      setIsLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateBankDetails = useCallback(
    async (patch: Partial<IssuingBank>) => {
      if (!bankId) return null;
      await new Promise((r) => setTimeout(r, 300));
      const updated = store.updateIssuingBank(bankId, patch);
      setBank(updated);
      return updated;
    },
    [bankId]
  );

  return { bank, isLoading, error, refetch: fetch, updateBankDetails };
}
