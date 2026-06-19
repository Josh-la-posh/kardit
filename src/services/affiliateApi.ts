import { ApiError } from '@/services/apiError';
import type {
  CreateAffiliateRequest,
  CreateAffiliateResponse,
  GetAffiliateKybSnapshotResponse,
} from '@/types/affiliateContracts';

export type AffiliateType = 'EXTERNAL' | 'INTERNAL' | 'INTERNAL_BANK';

export interface AffiliateProfileByTenantResponse {
  affiliateType: AffiliateType;
  affiliateId: string;
  tenantId: string;
  ownerBankId: string;
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isBankAffiliate: boolean;
}

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

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  if (!res.ok) {
    const errorBody = await safeJson(res);
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
}

export async function createAffiliate(request: CreateAffiliateRequest): Promise<CreateAffiliateResponse> {
  return postJson<CreateAffiliateResponse>('/affiliates', request);
}

export async function getAffiliateKybSnapshot(affiliateId: string): Promise<GetAffiliateKybSnapshotResponse> {
  return getJson<GetAffiliateKybSnapshotResponse>(
    `/affiliates/${encodeURIComponent(affiliateId)}/kyb-snapshot`
  );
}

export async function getAffiliateProfileByTenant(tenantId: string): Promise<unknown> {
  return getJson<AffiliateProfileByTenantResponse>(
    `/affiliates/${encodeURIComponent(tenantId)}/profilebytenant`
  );
}

export function normalizeAffiliateType(value: unknown): AffiliateType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'EXTERNAL' || normalized === 'INTERNAL' || normalized === 'INTERNAL_BANK') {
    return normalized;
  }
  return undefined;
}

export function getAffiliateTypeFromProfile(profile: unknown): AffiliateType | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  return normalizeAffiliateType((profile as Record<string, unknown>).affiliateType);
}

export function getStakeholderTypeForAffiliateType(
  affiliateType: unknown
): 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | undefined {
  switch (normalizeAffiliateType(affiliateType)) {
    case 'EXTERNAL':
      return 'AFFILIATE';
    case 'INTERNAL':
      return 'SERVICE_PROVIDER';
    case 'INTERNAL_BANK':
      return 'BANK';
    default:
      return undefined;
  }
}

export function getRouteForAffiliateType(affiliateType: unknown): string {
  switch (normalizeAffiliateType(affiliateType)) {
    case 'INTERNAL':
      return '/super-admin/dashboard';
    case 'INTERNAL_BANK':
      return '/bank/dashboard';
    case 'EXTERNAL':
    default:
      return '/dashboard';
  }
}
