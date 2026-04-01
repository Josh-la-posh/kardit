import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/services/authApi';
import { createCard as createCardApi, getCard as getCardApi, getCardFundingDetails, getCardFulfillmentStatus } from '@/services/cardsApi';
import { useAuth } from '@/hooks/useAuth';
import { store, type Card } from '@/stores/mockStore';
import type {
  CreateCardRequest,
  CreateCardResponse,
  GetCardFundingDetails,
  GetCardFulfillmentStatusResponse,
  GetCardResponse,
} from '@/types/cardContracts';

export interface CreateCardInput {
  customerId: string;
  bankId: string;
  productId: string;
  productType: string;
  currency: string;
  productName?: string;
  productCode?: string;
  issuingBankName?: string;
  embossName?: string;
  deliveryMethod?: string;
  tenantId?: string;
  affiliateId?: string;
  customerIdentity: {
    firstName: string;
    lastName: string;
    dob: string;
    phone: string;
    email: string;
  };
  customerKyc: {
    idType: string;
    idNumber: string;
    kycLevel?: string;
  };
}

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function toCardStatus(status: string | undefined): Card['status'] {
  if (status === 'ACTIVE' || status === 'PENDING' || status === 'FROZEN' || status === 'BLOCKED') {
    return status;
  }

  const normalized = status?.toUpperCase();
  if (normalized === 'TERMINATED' || normalized === 'CLOSED') return 'BLOCKED';
  if (normalized === 'SUSPENDED') return 'FROZEN';
  return 'PENDING';
}

function toCardModel(
  source: {
    cardId?: string;
    customerId?: string;
    customerRefId?: string;
    bankId?: string;
    productType?: string;
    productName?: string;
    productCode?: string;
    status?: string;
    maskedPan?: string;
    currency?: string;
    createdAt?: string;
    issuedAt?: string;
    embossName?: string;
    deliveryMethod?: string;
  },
  tenantId?: string
): Card {
  return {
    id: source.cardId || '',
    tenantId: tenantId || '',
    customerId: source.customerId || source.customerRefId || '',
    maskedPan: source.maskedPan || 'Unavailable',
    productName: source.productName || source.productType || 'Card',
    productCode: source.productCode || source.productType || 'N/A',
    issuingBankName: source.bankId || 'Unknown Bank',
    status: toCardStatus(source.status),
    currency: source.currency || 'USD',
    currentBalance: 0,
    createdAt: source.createdAt || source.issuedAt || new Date().toISOString(),
    embossName: source.embossName,
    deliveryMethod: source.deliveryMethod,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while loading cards.';
}

function mapCreatedCard(response: CreateCardResponse, input: CreateCardInput, tenantId?: string): Card {
  return toCardModel(
    {
      cardId: response.cardId,
      customerId: response.customerId,
      bankId: input.issuingBankName || response.bankId,
      productType: response.productType,
      productName: input.productName || response.productType,
      productCode: input.productCode || input.productType,
      status: response.status,
      maskedPan: response.maskedPan,
      currency: input.currency,
      createdAt: response.createdAt,
      embossName: input.embossName,
      deliveryMethod: input.deliveryMethod,
    },
    tenantId
  );
}

function mapCardDetail(response: GetCardResponse, fundingDetails: GetCardFundingDetails | null, tenantId?: string): Card {
  return toCardModel(
    {
      cardId: response.cardId,
      customerId: response.customerId,
      bankId: response.bankId,
      productType: response.productType,
      status: response.status,
      maskedPan: response.maskedPan,
      currency: fundingDetails?.fundingInstructions.currency,
      createdAt: response.createdAt,
    },
    tenantId
  );
}

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setCards(store.getCards(tenantScope));
    } catch (err) {
      setCards([]);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [tenantScope]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { cards, isLoading, error, refetch: fetch };
}

export function useCard(cardId: string | undefined) {
  const [card, setCard] = useState<Card | null>(null);
  const [fundingDetails, setFundingDetails] = useState<GetCardFundingDetails | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<GetCardFulfillmentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetch = useCallback(async () => {
    if (!cardId) {
      setCard(null);
      setFundingDetails(null);
      setFulfillmentStatus(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [cardResponse, fundingResponse] = await Promise.all([
        getCardApi(cardId),
        getCardFundingDetails(cardId).catch(() => null),
      ]);

      setFundingDetails(fundingResponse);
      setFulfillmentStatus(
        cardResponse.productType === 'PHYSICAL'
          ? await getCardFulfillmentStatus(cardId).catch(() => null)
          : null
      );
      setCard(mapCardDetail(cardResponse, fundingResponse, user?.tenantId));
    } catch (err) {
      setCard(null);
      setFundingDetails(null);
      setFulfillmentStatus(null);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [cardId, user?.tenantId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { card, fundingDetails, fulfillmentStatus, isLoading, error, refetch: fetch };
}

export function useCreateCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createCard = useCallback(async (data: CreateCardInput) => {
    const request: CreateCardRequest = {
      requestContext: {
        requestId: randomId('card-request'),
        tenantId: data.tenantId || user?.tenantId || 'tenant_unknown',
        affiliateId: data.affiliateId || 'affiliate_unknown',
        idempotencyKey: randomId('card-idempotency'),
      },
      issuance: {
        bankId: data.bankId,
        productId: data.productId,
        productType: data.productType,
        currency: data.currency,
      },
      customer: {
        customerId: data.customerId,
        embeddedPayload: {
          identity: {
            firstName: data.customerIdentity.firstName,
            lastName: data.customerIdentity.lastName,
            dob: data.customerIdentity.dob,
            phone: data.customerIdentity.phone,
            email: data.customerIdentity.email,
          },
          kyc: {
            idType: data.customerKyc.idType,
            idNumber: data.customerKyc.idNumber,
            kycLevel: data.customerKyc.kycLevel || 'FULL',
          },
        },
      },
    };

    setIsLoading(true);
    setError(null);

    try {
      const response = await createCardApi(request);
      return mapCreatedCard(response, data, request.requestContext.tenantId);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId]);

  return { createCard, isLoading, error };
}
