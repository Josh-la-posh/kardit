import { useState, useEffect, useCallback } from 'react';
import { store, Card } from '@/stores/mockStore';

const DELAY = 500;

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setCards(store.getCards());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { cards, isLoading, refetch: fetch };
}

export function useCard(cardId: string | undefined) {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cardId) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, DELAY));
    setCard(store.getCard(cardId) || null);
    setIsLoading(false);
  }, [cardId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { card, isLoading, refetch: fetch };
}

export function useCreateCard() {
  const [isLoading, setIsLoading] = useState(false);

  const createCard = useCallback(async (data: { customerId: string; productName: string; issuingBankName: string; currency: string }) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const card = store.createCard(data);
    setIsLoading(false);
    return card;
  }, []);

  return { createCard, isLoading };
}
