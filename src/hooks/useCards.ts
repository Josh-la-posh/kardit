import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/services/authApi';
import { createCard as createCardApi, getCard as getCardApi, getCardFundingDetails, getCardFulfillmentStatus, queryCards } from '@/services/cardsApi';
import { useAuth } from '@/hooks/useAuth';
import { resolveAffiliateId } from '@/services/affiliateBankApi';
import { getCustomer } from '@/services/customerApi';
import type { Card } from '@/stores/mockStore';
import type {
  CardQueryStatus,
  CardQueryType,
  CreateCardRequest,
  CreateCardResponse,
  GetCardFundingDetails,
  GetCardFulfillmentStatusResponse,
  GetCardResponse,
  // QueryCardsRequest,
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
  customerIdentity?: {
    firstName: string;
    lastName: string;
    dob: string;
    phone: string;
    email: string;
  };
  customerKyc?: {
    idType: string;
    idNumber: string;
    kycLevel?: string;
  };
}

export interface UseCardsOptions {
  bankId?: string;
  affiliateId?: string;
  customerId?: string;
  status?: CardQueryStatus[];
  cardType?: CardQueryType[];
  productId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function toCardStatus(status: string | undefined): Card['status'] {
  if (
    status === 'ACTIVE' ||
    status === 'PENDING' ||
    status === 'PENDING_ACTIVATION' ||
    status === 'FROZEN' ||
    status === 'BLOCKED' ||
    status === 'PERSONALIZING'
  ) {
    return status;
  }

  const normalized = status?.toUpperCase();
  if (normalized === 'TERMINATED' || normalized === 'CLOSED') return 'TERMINATED';
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
    cardType?: string;
    productId?: string;
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
    productName: source.productName || source.productType || source.cardType || source.productId || 'Card',
    productCode: source.productCode || source.productType || source.cardType || source.productId || 'N/A',
    issuingBankName: source.bankId || 'Unknown Bank',
    status: toCardStatus(source.status),
    currency: source.currency || 'USD',
    currentBalance: 0,
    createdAt: source.createdAt || source.issuedAt || new Date().toISOString(),
    embossName: source.embossName,
    deliveryMethod: source.deliveryMethod,
  };
}

// function mapQueriedCard(item: CardListItem, tenantId?: string): Card {
//   return toCardModel(
//     {
//       cardId: item.cardId,
//       customerId: item.customerId,
//       customerRefId: item.customerRefId,
//       bankId: item.bankId,
//       productType: item.cardType || item.productType,
//       productName: item.productName || item.cardType || item.productType,
//       productCode: item.productCode || item.productId || item.cardType || item.productType,
//       status: item.status,
//       maskedPan: item.maskedPan,
//       currency: item.currency,
//       createdAt: item.createdAt,
//       issuedAt: item.issuedAt,
//       embossName: item.embossName,
//       deliveryMethod: item.deliveryMethod,
//     },
//     tenantId
//   );
// }

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

function buildDefaultCardFilters(
  user: ReturnType<typeof useAuth>['user'],
  options: UseCardsOptions
): UseCardsOptions {
  if (options.bankId || options.affiliateId || options.customerId) return options;

  if (user?.stakeholderType === 'BANK') {
    return { ...options, bankId: user.bankId || user.tenantId };
  }

  if (user?.stakeholderType === 'AFFILIATE') {
    try {
      return { ...options, affiliateId: resolveAffiliateId(user) };
    } catch {
      return options;
    }
  }

  return options;
}

export function useCards(options?: UseCardsOptions) {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options?.page || 1);
  const [pageSize, setPageSize] = useState(options?.pageSize || 25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const bankId = options?.bankId;
  const affiliateId = options?.affiliateId;
  const customerId = options?.customerId;
  const status = options?.status;
  const cardType = options?.cardType;
  const productId = options?.productId;
  const fromDate = options?.fromDate;
  const toDate = options?.toDate;
  const requestedPage = options?.page || 1;
  const requestedPageSize = options?.pageSize || 25;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const resolvedOptions = buildDefaultCardFilters(user, {
        bankId,
        affiliateId,
        customerId,
        status,
        cardType,
        productId,
        fromDate,
        toDate,
        page: requestedPage,
        pageSize: requestedPageSize,
      });
      const response = await queryCards({
        filters: {
          ...(resolvedOptions.bankId ? { bankId: resolvedOptions.bankId } : {}),
          ...(resolvedOptions.affiliateId ? { affiliateId: resolvedOptions.affiliateId } : {}),
          ...(resolvedOptions.customerId ? { customerId: resolvedOptions.customerId } : {}),
          ...(resolvedOptions.status?.length ? { status: resolvedOptions.status } : {}),
          ...(resolvedOptions.cardType?.length ? { cardType: resolvedOptions.cardType } : {}),
          ...(resolvedOptions.productId ? { productId: resolvedOptions.productId } : {}),
          ...(resolvedOptions.fromDate ? { fromDate: resolvedOptions.fromDate } : {}),
          ...(resolvedOptions.toDate ? { toDate: resolvedOptions.toDate } : {}),
        },
        page: resolvedOptions.page || 1,
        pageSize: resolvedOptions.pageSize || 25,
      });
      setCards(response.data.map((card) => toCardModel(card, user?.tenantId)));
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
    } catch (err) {
      setCards([]);
      setTotal(0);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [affiliateId, bankId, cardType, customerId, fromDate, productId, requestedPage, requestedPageSize, status, toDate, user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { cards, total, page, pageSize, isLoading, error, refetch: fetch };
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
    const customerResponse =
      data.customerIdentity && data.customerKyc
        ? null
        : await getCustomer(data.customerId);

    const customerIdentity = data.customerIdentity || {
      firstName: customerResponse?.identity.firstName || '',
      lastName: customerResponse?.identity.lastName || '',
      dob: customerResponse?.identity.dob || '',
      phone: customerResponse?.identity.phone || '',
      email: customerResponse?.identity.email || '',
    };

    const customerKyc = data.customerKyc || {
      idType: customerResponse?.kyc.idType || '',
      idNumber: customerResponse?.kyc.idNumberMasked || '',
      kycLevel: customerResponse?.kyc.kycLevel || 'FULL',
    };

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
            firstName: customerIdentity.firstName,
            lastName: customerIdentity.lastName,
            dob: customerIdentity.dob,
            phone: customerIdentity.phone,
            email: customerIdentity.email,
          },
          kyc: {
            idType: customerKyc.idType,
            idNumber: customerKyc.idNumber,
            kycLevel: customerKyc.kycLevel || 'FULL',
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
