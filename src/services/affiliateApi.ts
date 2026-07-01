import { ApiError } from '@/services/apiError';
import type {
  AffiliateProfile,
  CreateAffiliateRequest,
  CreateAffiliateResponse,
  GetAffiliateKybSnapshotResponse,
} from '@/types/affiliateContracts';

export type AffiliateType = 'EXTERNAL' | 'INTERNAL' | 'INTERNAL_BANK' | 'ADMINSERVICE';
export type ServiceType = 'AffiliateService' | 'BankService' | 'AdminService';
type NormalizedServiceType = 'AFFILIATE_SERVICE' | 'BANK_SERVICE' | 'ADMIN_SERVICE';

export interface ServiceByTenantResponse {
  serviceType: ServiceType | string;
  tenantId: string;
  serviceUserId: string;
  serviceBankId: string;
  serviceUserName?: string;
  serviceUserEmail?: string;
  status: string;
}

export function normalizeServiceType(value: unknown): NormalizedServiceType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/[\s-]+/g, '_').toUpperCase();

  if (normalized === 'AFFILIATESERVICE' || normalized === 'AFFILIATE_SERVICE' || normalized === 'EXTERNAL') {
    return 'AFFILIATE_SERVICE';
  }
  if (normalized === 'BANKSERVICE' || normalized === 'BANK_SERVICE' || normalized === 'INTERNAL_BANK') {
    return 'BANK_SERVICE';
  }
  if (
    normalized === 'ADMINSERVICE' ||
    normalized === 'ADMIN_SERVICE' ||
    normalized === 'INTERNAL'
  ) {
    return 'ADMIN_SERVICE';
  }

  return undefined;
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

export async function getAffiliateProfile(affiliateId: string): Promise<AffiliateProfile> {
  return getJson<AffiliateProfile>(
    `/affiliates/${encodeURIComponent(affiliateId)}/profile`
  );
}

export async function getServiceByTenantId(tenantId: string): Promise<ServiceByTenantResponse> {
  const response = await getJson<ServiceByTenantResponse>(
    `/affiliates/GetServiceByTenantId?tenantId=${encodeURIComponent(tenantId)}`
  );
  return response;
}

export type TenantServiceProfile = ServiceByTenantResponse & Partial<AffiliateProfile>;

export async function getTenantServiceProfile(tenantId: string): Promise<TenantServiceProfile> {
  const service = await getServiceByTenantId(tenantId);

  if (normalizeServiceType(service.serviceType) !== 'AFFILIATE_SERVICE') {
    return service;
  }

  const affiliateId = service.serviceUserId?.trim();
  if (!affiliateId) {
    throw new ApiError('Tenant service response is missing affiliateId', 0, service);
  }

  const profile = await getAffiliateProfile(affiliateId);
  return { ...service, ...profile };
}

export function normalizeAffiliateType(value: unknown): AffiliateType | undefined {
  const serviceType = normalizeServiceType(value);
  if (serviceType === 'AFFILIATE_SERVICE') return 'EXTERNAL';
  if (serviceType === 'BANK_SERVICE') return 'INTERNAL_BANK';
  if (serviceType === 'ADMIN_SERVICE') return 'ADMINSERVICE';

  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  if (
    normalized === 'EXTERNAL' ||
    normalized === 'INTERNAL' ||
    normalized === 'INTERNAL_BANK' ||
    normalized === 'ADMINSERVICE'
  ) {
    return normalized;
  }
  return undefined;
}

export function getAffiliateTypeFromProfile(profile: unknown): AffiliateType | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  const record = profile as Record<string, unknown>;
  return normalizeAffiliateType(record.serviceType);
}

export function getStakeholderTypeForAffiliateType(
  affiliateType: unknown
): 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | undefined {
  switch (normalizeAffiliateType(affiliateType)) {
    case 'EXTERNAL':
      return 'AFFILIATE';
    case 'INTERNAL':
    case 'ADMINSERVICE':
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
    case 'ADMINSERVICE':
      return '/super-admin/dashboard';
    case 'INTERNAL_BANK':
      return '/bank/dashboard';
    case 'EXTERNAL':
    default:
      return '/dashboard';
  }
}
