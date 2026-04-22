import { ApiError } from '@/services/authApi';
import type {
  CreateOnboardingSessionRequest,
  CreateOnboardingSessionResponse,
  DecisionRequest,
  DecisionResponse,
  ListOnboardingCasesRequest,
  ListOnboardingCasesResponse,
  OnboardingCase,
  OnboardingDraft,
  ProvisionOnboardingCaseRequest,
  ProvisionOnboardingCaseResponse,
  SaveIssuingBanksRequest,
  SaveIssuingBanksResponse,
  SaveContactRequest,
  SaveOrganizationRequest,
  SaveOrganizationResponse,
  SubmitOnboardingDraftRequest,
  SubmitOnboardingDraftResponse,
  UploadOnboardingDocumentRequest,
  UploadOnboardingDocumentResponse,
} from '@/types/onboardingContracts';

const LS_DRAFTS = 'kardit.onboarding.drafts.v2';
const LS_CASE_SESSIONS = 'kardit.onboarding.case-sessions.v1';

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');
const forceHttpsOnSecurePages = (baseUrl: string) => {
  if (typeof window === 'undefined') return baseUrl;
  if (window.location.protocol !== 'https:') return baseUrl;
  return baseUrl.replace(/^http:\/\//i, 'https://');
};

const getApiBaseUrl = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return base ? normalizeBaseUrl(forceHttpsOnSecurePages(base)) : '';
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
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
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
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as Record<string, unknown>)
        ? String((errorBody as Record<string, unknown>).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, errorBody);
  }
  return (await res.json()) as TResponse;
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

function saveDraft(draft: OnboardingDraft) {
  const drafts = getDrafts();
  drafts[draft.draftId] = draft;
  writeJson(LS_DRAFTS, drafts);
}

function updateDraft(draftId: string, updater: (current: OnboardingDraft) => OnboardingDraft): OnboardingDraft {
  const drafts = getDrafts();
  const current = drafts[draftId];
  if (!current) {
    throw new Error('Onboarding draft not found locally. Please restart onboarding.');
  }
  const next = updater(current);
  drafts[draftId] = next;
  writeJson(LS_DRAFTS, drafts);
  return next;
}

function getCaseSessions(): Record<string, string> {
  return readJson<Record<string, string>>(LS_CASE_SESSIONS, {});
}

function saveCaseSession(caseId: string, onboardingSessionId: string) {
  const mappings = getCaseSessions();
  mappings[caseId] = onboardingSessionId;
  writeJson(LS_CASE_SESSIONS, mappings);
}

function deriveSubmittedAt(caseItem: {
  submittedAt?: string;
  timeline?: Array<{ status: string; at: string }>;
}) {
  return (
    caseItem.submittedAt ||
    caseItem.timeline?.find((entry) => entry.status === 'SUBMITTED')?.at ||
    caseItem.timeline?.[0]?.at ||
    new Date().toISOString()
  );
}

function deriveUpdatedAt(caseItem: {
  updatedAt?: string;
  submittedAt?: string;
  timeline?: Array<{ status: string; at: string }>;
}) {
  return (
    caseItem.updatedAt ||
    caseItem.timeline?.[caseItem.timeline.length - 1]?.at ||
    caseItem.submittedAt ||
    new Date().toISOString()
  );
}

export function getStoredOnboardingDraft(draftId: string): OnboardingDraft | null {
  return getDrafts()[draftId] || null;
}

export function getStoredOnboardingSessionIdForCase(caseId: string): string | null {
  return getCaseSessions()[caseId] || null;
}

export async function createOnboardingSession(
  request: CreateOnboardingSessionRequest
): Promise<CreateOnboardingSessionResponse> {
  const response = await postJson<CreateOnboardingSessionResponse>('/affiliates/onboarding/sessions', request);
  saveDraft({
    draftId: response.draftId,
    onboardingSessionId: response.onboardingSessionId,
    expiresAt: response.expiresAt,
    email: request.email,
    phone: request.phone,
    consentAccepted: request.consentAccepted,
    documents: [],
    issuingBankIds: [],
  });
  return response;
}

export async function saveOrganization(
  draftId: string,
  org: SaveOrganizationRequest
): Promise<SaveOrganizationResponse> {
  const response = await putJson<SaveOrganizationResponse>(
    `/affiliates/onboarding/drafts/${encodeURIComponent(draftId)}/organization`,
    org
  );
  updateDraft(draftId, (current) => ({
    ...current,
    organization: {
      ...org,
      addressLine1: org.address.line1,
      city: org.address.city,
      country: org.address.country,
    },
    contact: {
      contactName: org.primaryContact.fullName,
      contactEmail: org.primaryContact.email,
      contactPhone: org.primaryContact.phone,
    },
  }));
  return response;
}

export async function saveContact(draftId: string, contact: SaveContactRequest): Promise<OnboardingDraft> {
  return updateDraft(draftId, (current) => ({
    ...current,
    contact,
    organization: current.organization
      ? {
          ...current.organization,
          primaryContact: {
            fullName: contact.contactName,
            email: contact.contactEmail,
            phone: contact.contactPhone,
          },
        }
      : current.organization,
  }));
}

export async function uploadDocument(
  draftId: string,
  payload: UploadOnboardingDocumentRequest
): Promise<UploadOnboardingDocumentResponse> {
  const response = await postJson<UploadOnboardingDocumentResponse>(
    `/affiliates/onboarding/drafts/${encodeURIComponent(draftId)}/documents`,
    payload
  );
  updateDraft(draftId, (current) => {
    const documents = current.documents.filter((doc) => doc.documentId !== response.documentId);
    documents.push({
      documentId: response.documentId,
      type: response.docType,
      fileName: payload.fileName,
      uploadedAt: response.uploadedAt,
      verificationStatus: response.verificationStatus,
    });
    return {
      ...current,
      documents,
    };
  });
  return response;
}

export async function saveIssuingBanks(
  draftId: string,
  request: SaveIssuingBanksRequest
): Promise<SaveIssuingBanksResponse> {
  const response = await putJson<SaveIssuingBanksResponse>(
    `/affiliates/onboarding/drafts/${encodeURIComponent(draftId)}/issuing-banks`,
    request
  );
  updateDraft(draftId, (current) => ({
    ...current,
    issuingBankIds: request.selectedBanks.map((bank) => bank.bankId),
  }));
  return response;
}

export async function submitOnboardingDraft(
  draftId: string,
  request: SubmitOnboardingDraftRequest
): Promise<SubmitOnboardingDraftResponse> {
  const response = await postJson<SubmitOnboardingDraftResponse>(
    `/affiliates/onboarding/drafts/${encodeURIComponent(draftId)}/submit`,
    request
  );
  updateDraft(draftId, (current) => ({
    ...current,
    submittedCaseId: response.caseId,
  }));
  saveCaseSession(response.caseId, request.onboardingSessionId);
  return response;
}

export async function getOnboardingCase(caseId: string, onboardingSessionId: string): Promise<OnboardingCase> {
  const search = new URLSearchParams({ onboardingSessionId });
  const response = await getJson<Partial<OnboardingCase>>(
    `/affiliates/onboarding/cases/${encodeURIComponent(caseId)}?${search.toString()}`
  );
  const organization = response.organization
    ? {
        ...response.organization,
        addressLine1: response.organization.address?.line1,
        city: response.organization.address?.city,
        country: response.organization.address?.country,
      }
    : response.organization;
  const contact =
    response.contact ||
    (organization?.primaryContact
      ? {
          contactName: organization.primaryContact.fullName,
          contactEmail: organization.primaryContact.email,
          contactPhone: organization.primaryContact.phone,
        }
      : undefined);
  return {
    caseId,
    status: response.status || 'SUBMITTED',
    timeline: response.timeline || [],
    messages: response.messages || [],
    submittedAt: deriveSubmittedAt(response),
    updatedAt: deriveUpdatedAt(response),
    draftId: response.draftId,
    onboardingSessionId,
    organization,
    contact,
    documents: response.documents || [],
    issuingBankIds: response.issuingBankIds || [],
    reviewerNote: response.reviewerNote,
    decisionReason: response.decisionReason,
    provisionedTenantId: response.provisionedTenantId,
    provisionedAdminEmail: response.provisionedAdminEmail,
    provisionedTemporaryPassword: response.provisionedTemporaryPassword,
  };
}

export async function listOnboardingCases(
  request: ListOnboardingCasesRequest
): Promise<ListOnboardingCasesResponse> {
  const search = new URLSearchParams();
  if (request.status) search.set('status', request.status);
  if (typeof request.page === 'number') search.set('page', String(request.page));
  if (typeof request.pageSize === 'number') search.set('pageSize', String(request.pageSize));
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return getJson<ListOnboardingCasesResponse>(`/admin/onboarding/cases${suffix}`);
}

export async function decideOnboardingCase(
  caseId: string,
  request: DecisionRequest,
  _auditActor?: unknown
): Promise<DecisionResponse> {
  return postJson<DecisionResponse>(`/admin/onboarding/cases/${encodeURIComponent(caseId)}/decision`, {
    decision: request.decision,
    reviewerNotes: request.reviewerNotes ?? request.reviewerNote,
    decisionReason: request.decisionReason ?? request.reason,
    selectedBanksApproved: request.selectedBanksApproved,
  });
}

export async function provisionOnboardingCase(
  caseId: string,
  request: ProvisionOnboardingCaseRequest
): Promise<ProvisionOnboardingCaseResponse> {
  return postJson<ProvisionOnboardingCaseResponse>(`/admin/onboarding/cases/${encodeURIComponent(caseId)}/provision`, request);
}
