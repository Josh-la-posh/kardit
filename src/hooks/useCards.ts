import { useState, useEffect, useCallback } from 'react';
import { store, Card } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';

const DELAY = 500;

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setCards(store.getCards(tenantScope));
    setIsLoading(false);
  }, [tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  return { cards, isLoading, refetch: fetch };
}

export function useCard(cardId: string | undefined) {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    if (!cardId) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setCard(store.getCard(cardId, tenantScope) || null);
    setIsLoading(false);
  }, [cardId, tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  return { card, isLoading, refetch: fetch };
}

export function useCreateCard() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createCard = useCallback(async (data: {
    customerId: string;
    productName: string;
    productCode: string;
    issuingBankName: string;
    currency: string;
    embossName?: string;
    deliveryMethod?: string;
  }) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const tenantId = user?.tenantId || 'tenant_alpha_affiliate';
    const card = store.createCard({ tenantId, ...data });
    setIsLoading(false);
    return card;
  }, [user?.tenantId]);

  return { createCard, isLoading };
}
