import { ApiError } from "@/services/apiError";
import { CreateIssuingBankRequest, CreateIssuingBankResponse, getBankAffiliatesResponse, getBankCardsRequest, getBankCardsResponse, getIssuingBanksDashboardResponse } from "@/types/bankIssuingContracts";


const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return base ? normalizeBaseUrl(base) : '';
};

const safeJson = async (res: Response) => {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

async function getJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET', ...init });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new ApiError('Request failed', res.status, body);
  }
  return (await res.json()) as TResponse;
}

async function postJson<TResponse>(path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as any)
        ? String((errorBody as any).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

function normalizeCreateIssuingBankResponse(response: unknown): CreateIssuingBankResponse {
  const payload = (response && typeof response === 'object' ? response : {}) as Record<string, any>;
  const internalAffiliate = (payload.internalAffiliate ?? payload.InternalAffiliate ?? {}) as Record<string, any>;
  const internalPartnership = (payload.internalPartnership ?? payload.InternalPartnership ?? {}) as Record<string, any>;

  return {
    bankId: payload.bankId ?? payload.BankId ?? '',
    legalName: payload.legalName ?? payload.LegalName ?? '',
    shortName: payload.shortName ?? payload.ShortName,
    status: payload.status ?? payload.Status ?? '',
    internalAffiliate: {
      affiliateId: internalAffiliate.affiliateId ?? internalAffiliate.AffiliateId ?? '',
      affiliateType: internalAffiliate.affiliateType ?? internalAffiliate.AffiliateType ?? '',
      ownerBankId: internalAffiliate.ownerBankId ?? internalAffiliate.OwnerBankId ?? '',
      status: internalAffiliate.status ?? internalAffiliate.Status ?? '',
      isSystemManaged: internalAffiliate.isSystemManaged ?? internalAffiliate.IsSystemManaged ?? false,
      legalName: internalAffiliate.legalName ?? internalAffiliate.LegalName,
      shortName: internalAffiliate.shortName ?? internalAffiliate.ShortName,
    },
    internalPartnership: {
      partnershipRequestId:
        internalPartnership.partnershipRequestId ?? internalPartnership.PartnershipRequestId ?? '',
      status: internalPartnership.status ?? internalPartnership.Status ?? '',
    },
    provisionedAt:
      payload.provisionedAt ??
      payload.ProvisionedAt ??
      internalPartnership.provisionedAt ??
      internalPartnership.ProvisionedAt ??
      '',
  };
}

// API Endpoints for Bank Issuing

export async function createIssuingBankSession(payload: CreateIssuingBankRequest): Promise<CreateIssuingBankResponse> {
    // Validate required fields
    if (!payload) {
        throw new ApiError('Invalid payload', 400, undefined);
    }

    const { legalName, shortName, bankCode, country, primaryContact, status } = payload;

    if (!legalName || !shortName || !bankCode || !country) {
        throw new ApiError('Missing required fields: legalName, shortName, bankCode, country', 400, undefined);
    }

    if (!primaryContact || !primaryContact.fullName || !primaryContact.email || !primaryContact.phone) {
        throw new ApiError('Missing required contact fields: fullName, email, phone', 400, undefined);
    }

    const response = await postJson<CreateIssuingBankResponse>('/admin/banks', payload);
    return normalizeCreateIssuingBankResponse(response);
}
