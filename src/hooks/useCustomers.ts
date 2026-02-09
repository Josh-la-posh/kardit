import { useState, useEffect, useCallback } from 'react';
import { store, Customer, KycDocument, Card } from '@/stores/mockStore';

const DELAY = 500;

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setCustomers(store.getCustomers());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { customers, isLoading, refetch: fetch };
}

export function useCustomer(customerId: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    const c = store.getCustomer(customerId);
    setCustomer(c);
    if (c) {
      setKycDocuments(store.getKycDocuments(c.id));
      setCards(store.getCardsByCustomer(c.id));
    }
    setIsLoading(false);
  }, [customerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customer, kycDocuments, cards, isLoading, refetch: fetch };
}

export function useCreateCustomer() {
  const [isLoading, setIsLoading] = useState(false);

  const createCustomerWithCard = useCallback(async (
    customerData: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'status'>,
    cardData: { productName: string; productCode: string; issuingBankName: string; currency: string; embossName?: string; deliveryMethod?: string },
    kycDocs: { type: string; fileName: string }[]
  ) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const customer = store.createCustomer(customerData);
    store.createCard({ customerId: customer.id, ...cardData });
    kycDocs.forEach((doc) => {
      store.addKycDocument({ customerId: customer.id, type: doc.type, status: 'UPLOADED', fileName: doc.fileName });
    });
    setIsLoading(false);
    return customer;
  }, []);

  return { createCustomerWithCard, isLoading };
}
