import { useState, useEffect, useCallback } from 'react';
import { store, Customer, KycDocument, Card } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';

const DELAY = 500;

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setCustomers(store.getCustomers(tenantScope));
    setIsLoading(false);
  }, [tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customers, isLoading, refetch: fetch };
}

export function useCustomer(customerId: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    const c = store.getCustomer(customerId, tenantScope);
    setCustomer(c);
    if (c) {
      setKycDocuments(store.getKycDocuments(c.id, tenantScope));
      setCards(store.getCardsByCustomer(c.id, tenantScope));
    }
    setIsLoading(false);
  }, [customerId, tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customer, kycDocuments, cards, isLoading, refetch: fetch };
}

export function useCreateCustomer() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createCustomerWithCard = useCallback(async (
    customerData: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'status'>,
    cardData: { productName: string; productCode: string; issuingBankName: string; currency: string; embossName?: string; deliveryMethod?: string },
    kycDocs: { type: string; fileName: string }[]
  ) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const tenantId = user?.tenantId || 'tenant_alpha_affiliate';
    const customer = store.createCustomer({ ...customerData, tenantId });
    store.createCard({ tenantId, customerId: customer.id, ...cardData });
    kycDocs.forEach((doc) => {
      store.addKycDocument({ tenantId, customerId: customer.id, type: doc.type, status: 'UPLOADED', fileName: doc.fileName });
    });
    setIsLoading(false);
    return customer;
  }, [user?.tenantId]);

  return { createCustomerWithCard, isLoading };
}
