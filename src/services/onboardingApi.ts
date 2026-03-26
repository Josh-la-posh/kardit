import { ApiError } from '@/services/authApi';
import { reportStore } from '@/stores/reportStore';
import type {
  CreateOnboardingSessionRequest,
  CreateOnboardingSessionResponse,
  DecisionRequest,
  DecisionResponse,
  OnboardingCase,
  OnboardingDraft,
  ProvisionOnboardingCaseRequest,
  ProvisionOnboardingCaseResponse,
  SaveContactRequest,
  SaveOrganizationRequest,
  SubmitOnboardingDraftRequest,
  SubmitOnboardingDraftResponse,
  UploadOnboardingDocumentRequest,
  SaveIssuingBanksRequest,
  SaveIssuingBanksResponse,
} from '@/types/onboardingContracts';

type AuditActor = {
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');


const getApiBaseUrl = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  console.log('[API] Using base URL:', base);
  return base ? normalizeBaseUrl(base) : '';
};


// All API calls now always use the real backend. No mock/local fallback.

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

async function putJson<TResponse>(path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
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

// ---------- Local mock (localStorage) ----------

const LS_DRAFTS = 'kardit.onboarding.drafts.v1';
const LS_CASES = 'kardit.onboarding.cases.v1';

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}_${Date.now().toString(16)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDrafts(): Record<string, OnboardingDraft> {
  return readJson<Record<string, OnboardingDraft>>(LS_DRAFTS, {});
}

function setDraft(draft: OnboardingDraft) {
  const drafts = getDrafts();
  drafts[draft.draftId] = draft;
  writeJson(LS_DRAFTS, drafts);
}

function getCases(): Record<string, OnboardingCase> {
  return readJson<Record<string, OnboardingCase>>(LS_CASES, {});
}

function setCase(c: OnboardingCase) {
  const cases = getCases();
  cases[c.caseId] = c;
  writeJson(LS_CASES, cases);
}

// ---------- API surface (SRS-aligned) ----------


export async function createOnboardingSession(request: CreateOnboardingSessionRequest): Promise<CreateOnboardingSessionResponse> {
  return postJson<CreateOnboardingSessionResponse>('/onboarding/sessions', request);
}


export async function getOnboardingDraft(draftId: string): Promise<OnboardingDraft> {
  return getJson<OnboardingDraft>(`/onboarding/drafts/${encodeURIComponent(draftId)}`);
}


export async function saveOrganization(draftId: string, org: SaveOrganizationRequest): Promise<OnboardingDraft> {
  return putJson<OnboardingDraft>(`/onboarding/drafts/${encodeURIComponent(draftId)}/organization`, org);
}


export async function saveContact(draftId: string, contact: SaveContactRequest): Promise<OnboardingDraft> {
  return putJson<OnboardingDraft>(`/onboarding/drafts/${encodeURIComponent(draftId)}/contact`, contact);
}

export async function uploadDocument(
  draftId: string,
  payload: UploadOnboardingDocumentRequest
): Promise<OnboardingDraft> {
  // Always use real API, send docType, onboardingSessionId, contentType, fileBase64
  return postJson<OnboardingDraft>(`/onboarding/drafts/${encodeURIComponent(draftId)}/documents`, payload);
}


// This endpoint should be implemented in the backend. Placeholder for real API call if available.
export async function removeDocument(draftId: string, documentId: string): Promise<OnboardingDraft> {
  throw new Error('removeDocument API not implemented. Use backend endpoint.');
}

export async function saveIssuingBanks(
  draftId: string,
  request: SaveIssuingBanksRequest
): Promise<SaveIssuingBanksResponse> {
  // Always use real API
  return putJson<SaveIssuingBanksResponse>(`/onboarding/drafts/${encodeURIComponent(draftId)}/issuing-banks`, request);
}


export async function submitOnboardingDraft(
  draftId: string,
  request: SubmitOnboardingDraftRequest
): Promise<SubmitOnboardingDraftResponse> {
  return postJson<SubmitOnboardingDraftResponse>(`/onboarding/drafts/${encodeURIComponent(draftId)}/submit`, request);
}


export async function getOnboardingCase(caseId: string): Promise<OnboardingCase> {
  return getJson<OnboardingCase>(`/onboarding/cases/${encodeURIComponent(caseId)}`);
}



import type { ListOnboardingCasesRequest, ListOnboardingCasesResponse } from '@/types/onboardingContracts';

export async function listOnboardingCases(
  request: ListOnboardingCasesRequest
): Promise<ListOnboardingCasesResponse> {
  return postJson<ListOnboardingCasesResponse>('/admin/onboarding/cases', request);
}



export async function decideOnboardingCase(
  caseId: string,
  request: DecisionRequest
): Promise<DecisionResponse> {
  return postJson<DecisionResponse>(`/admin/onboarding/cases/${encodeURIComponent(caseId)}/decision`, request);
}



export async function provisionOnboardingCase(
  caseId: string,
  request: ProvisionOnboardingCaseRequest
): Promise<ProvisionOnboardingCaseResponse> {
  return postJson<ProvisionOnboardingCaseResponse>(`/admin/onboarding/cases/${encodeURIComponent(caseId)}/provision`, request);
}
