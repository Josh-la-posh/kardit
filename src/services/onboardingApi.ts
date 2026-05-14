import { ApiError, getApiErrorMessage } from '@/services/authApi';
import type {
  CreateOnboardingSessionRequest,
  CreateOnboardingSessionResponse,
  DecisionRequest,
  DecisionResponse,
  ListOnboardingCasesRequest,
  ListOnboardingCasesResponse,
  OnboardingCase,
  OnboardingDraft,
  OnboardingDocumentType,
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
    throw new ApiError(getApiErrorMessage(body, `Request failed (${res.status})`), res.status, body);
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
    const message = getApiErrorMessage(errorBody, `Request failed (${res.status})`);
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
    const message = getApiErrorMessage(errorBody, `Request failed (${res.status})`);
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
  SubmittedAt?: string;
  timeline?: Array<{ status: string; at: string }>;
  Timeline?: Array<{ Status?: string; At?: string }>;
}) {
  return (
    caseItem.submittedAt ||
    caseItem.SubmittedAt ||
    caseItem.timeline?.find((entry) => entry.status === 'SUBMITTED')?.at ||
    caseItem.Timeline?.find((entry) => entry.Status === 'SUBMITTED')?.At ||
    caseItem.timeline?.[0]?.at ||
    caseItem.Timeline?.[0]?.At ||
    new Date().toISOString()
  );
}

function deriveUpdatedAt(caseItem: {
  updatedAt?: string;
  UpdatedAt?: string;
  submittedAt?: string;
  SubmittedAt?: string;
  timeline?: Array<{ status: string; at: string }>;
  Timeline?: Array<{ Status?: string; At?: string }>;
}) {
  return (
    caseItem.updatedAt ||
    caseItem.UpdatedAt ||
    caseItem.timeline?.[caseItem.timeline.length - 1]?.at ||
    caseItem.Timeline?.[caseItem.Timeline.length - 1]?.At ||
    caseItem.submittedAt ||
    caseItem.SubmittedAt ||
    new Date().toISOString()
  );
}

function mapOrganization(response: any) {
  const organization = response.organization || response.Organization;
  const address = organization?.address || organization?.Address;
  const primaryContact = organization?.primaryContact || organization?.PrimaryContact;
  return organization
    ? {
        ...organization,
        legalName: organization.legalName ?? organization.LegalName,
        tradingName: organization.tradingName ?? organization.TradingName,
        registrationNumber: organization.registrationNumber ?? organization.RegistrationNumber,
        address: address
          ? {
              ...address,
              line1: address.line1 ?? address.Line1,
              city: address.city ?? address.City,
              state: address.state ?? address.State,
              country: address.country ?? address.Country,
            }
          : undefined,
        primaryContact: primaryContact
          ? {
              ...primaryContact,
              fullName: primaryContact.fullName ?? primaryContact.FullName,
              email: primaryContact.email ?? primaryContact.Email,
              phone: primaryContact.phone ?? primaryContact.Phone,
            }
          : undefined,
        addressLine1: address?.line1 ?? address?.Line1,
        city: address?.city ?? address?.City,
        country: address?.country ?? address?.Country,
      }
    : organization;
}

function mapContact(response: any, organization: ReturnType<typeof mapOrganization>) {
  return (
    response.contact ||
    response.Contact ||
    (organization?.primaryContact
      ? {
        contactName: organization.primaryContact.fullName,
        contactEmail: organization.primaryContact.email,
        contactPhone: organization.primaryContact.phone,
        }
      : undefined)
  );
}

function mapDocuments(response: any) {
  const documents = response.documents || response.Documents || [];
  return documents.map((document: any) => ({
    ...document,
    documentId: document.documentId ?? document.DocumentId,
    type: (document.type || document.documentType || document.docType || document.Type || document.DocumentType || document.DocType || 'OTHER') as OnboardingDocumentType,
    documentType: (document.documentType || document.type || document.docType || document.DocumentType || document.Type || document.DocType || 'OTHER') as OnboardingDocumentType,
    fileName: document.fileName || document.FileName || document.documentType || document.type || document.DocumentType || document.Type || document.documentId || document.DocumentId,
    uploadedAt: document.uploadedAt || document.UploadedAt || response.submittedAt || response.SubmittedAt || new Date().toISOString(),
    verificationStatus: document.verificationStatus ?? document.VerificationStatus,
  }));
}

function mapMessages(response: any) {
  const messages = response.messages || response.Messages || [];
  return messages.map((entry: any) => ({
    ...entry,
    type: entry.type ?? entry.Type ?? '',
    at: entry.at ?? entry.At ?? new Date().toISOString(),
    text: entry.text || entry.message || entry.Text || entry.Message || '',
    message: entry.message || entry.text || entry.Message || entry.Text || '',
  }));
}

function mapTimeline(response: any) {
  const timeline = response.timeline || response.Timeline || [];
  return timeline.map((entry: any) => ({
    status: entry.status ?? entry.Status ?? 'SUBMITTED',
    at: entry.at ?? entry.At ?? new Date().toISOString(),
  }));
}

function mapKybSummary(response: any) {
  const kybSummary = response.kybSummary || response.KybSummary;
  return kybSummary
    ? {
        registrationNumber: kybSummary.registrationNumber ?? kybSummary.RegistrationNumber,
        country: kybSummary.country ?? kybSummary.Country,
        status: kybSummary.status ?? kybSummary.Status,
      }
    : undefined;
}

function mapOnboardingCase(response: any, fallback: { caseId: string; onboardingSessionId?: string }) {
  const organization = mapOrganization(response);
  const contact = mapContact(response, organization);

  return {
    caseId: response.caseId || response.CaseId || fallback.caseId,
    affiliateId: response.affiliateId || response.AffiliateId,
    affiliateName: response.affiliateName || response.AffiliateName || organization?.legalName,
    status: response.status || response.Status || 'SUBMITTED',
    timeline: mapTimeline(response),
    messages: mapMessages(response),
    submittedAt: deriveSubmittedAt(response),
    updatedAt: deriveUpdatedAt(response),
    draftId: response.draftId || response.DraftId,
    onboardingSessionId: fallback.onboardingSessionId,
    kybSummary: mapKybSummary(response),
    organization,
    contact,
    documents: mapDocuments(response),
    issuingBankIds: response.issuingBankIds || response.IssuingBankIds || [],
    reviewerNote: response.reviewerNote || response.ReviewerNote,
    decisionReason: response.decisionReason || response.DecisionReason,
    provisionedTenantId: response.provisionedTenantId || response.ProvisionedTenantId,
    provisionedAdminEmail: response.provisionedAdminEmail || response.ProvisionedAdminEmail,
    provisionedTemporaryPassword: response.provisionedTemporaryPassword || response.ProvisionedTemporaryPassword,
  } satisfies OnboardingCase;
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
  return mapOnboardingCase(response, { caseId, onboardingSessionId });
}

export async function getReviewerOnboardingCase(caseId: string): Promise<OnboardingCase> {
  const response = await getJson<Partial<OnboardingCase>>(`/admin/onboarding/cases/${encodeURIComponent(caseId)}`);
  return mapOnboardingCase(response, { caseId });
}

export async function listOnboardingCases(
  request: ListOnboardingCasesRequest
): Promise<ListOnboardingCasesResponse> {
  const search = new URLSearchParams();
  if (request.status) search.set('status', request.status);
  if (typeof request.page === 'number') search.set('page', String(request.page));
  if (typeof request.pageSize === 'number') search.set('pageSize', String(request.pageSize));
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const response = await getJson<any>(`/admin/onboarding/cases${suffix}`);

  const rawCases = Array.isArray(response?.cases)
    ? response.cases
    : Array.isArray(response?.Cases)
      ? response.Cases
      : [];

  return {
    page: Number(response?.page ?? response?.Page ?? request.page ?? 1),
    pageSize: Number(response?.pageSize ?? response?.PageSize ?? request.pageSize ?? 25),
    total: Number(response?.total ?? response?.Total ?? rawCases.length),
    cases: rawCases.map((item: any) => ({
      caseId: item?.caseId ?? item?.CaseId ?? '',
      affiliateName: item?.affiliateName ?? item?.AffiliateName ?? '',
      submittedAt: item?.submittedAt ?? item?.SubmittedAt ?? new Date().toISOString(),
      status: item?.status ?? item?.Status ?? 'SUBMITTED',
    })),
  };
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
