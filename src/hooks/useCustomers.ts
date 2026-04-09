import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/services/authApi';
import { useAuth } from '@/hooks/useAuth';
import { createCustomerDraft as createCustomerDraftApi, getCustomer, searchCustomers } from '@/services/customerApi';
import { getCustomerTransactions } from '@/services/transactionApi';
import type { CustomerSearchCriteria } from '@/types/customerContracts';
import type { CustomerTransactionsResponse } from '@/types/transactionContracts';
import { store } from '@/stores/mockStore';
import type { Card, KycDocument } from '@/stores/mockStore';

export interface CustomerListItem {
  id: string;
  customerId: string;
  customerRefId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  kycLevel: string;
  createdAt: string;
  status: string;
  
}

export interface CustomerDetailItem {
  id: string;
  customerId: string;
  customerRefId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: string;
  embossName: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  idType?: string;
  idNumber?: string;
  kycLevel?: string;
  verifiedAt?: string;
  tenantId: string;
  affiliateId: string;
}

export interface CreateCustomerDraftInput {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    city: string;
    state: string;
    country: string;
  };
  kyc: {
    idType: string;
    idNumber: string;
    kycLevel?: string;
  };
}

export interface CreateCustomerDraftResult {
  customerId: string;
  status: string;
  savedAt: string;
}

export interface CustomerTransactionListItem {
  transactionId: string;
  cardId: string;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  merchantName?: string;
  transactionDate: string;
}

const toScopeType = (stakeholderType?: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER') => {
  if (stakeholderType === 'BANK') return 'BANK_PORTFOLIO';
  if (stakeholderType === 'SERVICE_PROVIDER') return 'GLOBAL';
  return 'AFFILIATE_TENANT';
};

const buildCriteria = (query: string): CustomerSearchCriteria => {
  const trimmed = query.trim();
  if (!trimmed) {
    return { phone: null, name: null, customerRefId: null, idNumber: null };
  }

  if (trimmed.toUpperCase().startsWith('CUST-')) {
    return { phone: null, name: null, customerRefId: trimmed, idNumber: null };
  }

  if (/^\+?\d[\d\s-]{6,}$/.test(trimmed)) {
    return { phone: trimmed, name: null, customerRefId: null, idNumber: null };
  }

  if (/^\d{6,}$/.test(trimmed)) {
    return { phone: null, name: null, customerRefId: null, idNumber: trimmed };
  }

  return { phone: null, name: trimmed, customerRefId: null, idNumber: null };
};

export function useCustomers(query = '') {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user?.id || !user?.tenantId) {
        throw new Error('Missing customer search context');
      }

      const response = await searchCustomers({
        requestContext: {
          actorUserId: user.id,
          userType: user.stakeholderType || 'AFFILIATE',
          tenantId: user.tenantId,
          scopeType: toScopeType(user.stakeholderType),
        },
        criteria: buildCriteria(query),
        pagination: { page: 1, pageSize: 20 },
      });

      setCustomers(
        response.results.map((item) => {
          const [firstName, ...rest] = item.fullName.split(' ');
          return {
            id: item.customerRefId,
            customerId: item.customerRefId,
            customerRefId: item.customerRefId,
            firstName: firstName || item.fullName,
            lastName: rest.join(' '),
            fullName: item.fullName,
            email: item.email,
            phone: item.phone,
            kycLevel: item.kycLevel,
            createdAt: item.createdAt,
            status: item.kycLevel,
          };
        })
      );
      setTotal(response.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
      setCustomers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customers, isLoading, error, total, refetch: fetch };
}

export function useCustomer(customerId: string | undefined) {
  const [customer, setCustomer] = useState<CustomerDetailItem | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCustomer(customerId);
      const fullName = `${response.identity.firstName} ${response.identity.lastName}`.trim();
      setCustomer({
        id: response.customerRefId,
        customerId: response.customerRefId,
        customerRefId: response.customerRefId,
        firstName: response.identity.firstName,
        lastName: response.identity.lastName,
        fullName,
        email: response.identity.email,
        phone: response.identity.phone,
        dateOfBirth: response.identity.dob,
        status: 'ACTIVE',
        embossName: fullName.toUpperCase(),
        address: response.identity.address,
        idType: response.kyc.idType,
        idNumber: response.kyc.idNumberMasked,
        kycLevel: response.kyc.kycLevel,
        verifiedAt: response.kyc.verifiedAt,
        tenantId: response.tenantId,
        affiliateId: response.affiliateId,
      });
      setKycDocuments([
        {
          id: `kyc-${response.customerRefId}`,
          tenantId: response.tenantId,
          customerId: response.customerRefId,
          type: response.kyc.idType,
          status: 'VERIFIED',
          fileName: response.kyc.idNumberMasked,
          uploadedAt: response.kyc.verifiedAt,
        },
      ]);
      setCards(
        response.cards.map((card) => ({
          id: card.cardId,
          tenantId: response.tenantId,
          customerId: response.customerRefId,
          maskedPan: card.maskedPan,
          productName: card.productType,
          productCode: card.productType,
          issuingBankName: card.bankId,
          status: card.status as Card['status'],
          currency: 'NGN',
          currentBalance: 0,
          createdAt: card.createdAt,
          embossName: fullName.toUpperCase(),
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load customer');
      setCustomer(null);
      setKycDocuments([]);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customer, kycDocuments, cards, isLoading, error, refetch: fetch };
}

export function useCustomerTransactions(customerId: string | undefined) {
  const [transactions, setTransactions] = useState<CustomerTransactionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!customerId) {
      setTransactions([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response: CustomerTransactionsResponse = await getCustomerTransactions(customerId);
      setTransactions(response.data);
      setTotal(response.total);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load customer transactions';
      setError(message);
      setTransactions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { transactions, total, isLoading, error, refetch: fetch };
}

export function useCreateCustomer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createCustomerDraft = useCallback(async (
    data: CreateCustomerDraftInput
  ): Promise<CreateCustomerDraftResult> => {
    const tenantId = user?.tenantId || 'tenant_unknown';
    const affiliateId = user?.tenantId || 'affiliate_unknown';
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `REQ-CUST-DRAFT-${crypto.randomUUID()}`
        : `REQ-CUST-DRAFT-${Date.now()}`;

    setIsLoading(true);
    setError(null);

    try {
      return await createCustomerDraftApi({
        requestContext: {
          requestId,
          affiliateId,
          tenantId,
        },
        customer: {
          identity: {
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            phone: data.phone,
            email: data.email,
            address: data.address,
          },
          kyc: {
            idType: data.kyc.idType,
            idNumber: data.kyc.idNumber,
            kycLevel: data.kyc.kycLevel || 'LEVEL_2',
          },
        },
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to create customer draft';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId]);

  return { createCustomerDraft, isLoading, error };
}
