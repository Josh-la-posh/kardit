import { ApiError } from '@/services/authApi';
import { reportStore } from '@/stores/reportStore';
import type {
  CreateOnboardingSessionRequest,
  CreateOnboardingSessionResponse,
  DecisionRequest,
  ListOnboardingCasesRequest,
  ListOnboardingCasesResponse,
  OnboardingCase,
  OnboardingDraft,
  ProvisionResponse,
  SaveContactRequest,
  SaveOrganizationRequest,
  SaveOrganizationResponse,
  SelectedIssuingBanksRequest,
  SelectedIssuingBanksResponse,
  SubmitOnboardingDraftRequest,
  SubmitOnboardingDraftResponse,
  UploadOnboardingDocumentRequest,
  UploadOnboardingDocumentResponse,
} from '@/types/onboardingContracts';

type AuditActor = {
  userId: string;
  name: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}; 

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return base ? normalizeBaseUrl(base) : '';
};

function shouldUseOnboardingApi(): boolean {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const flag = (import.meta as any).env?.VITE_USE_API_ONBOARDING as string | undefined;
  return Boolean(baseUrl) && flag === 'true';
}

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

export async function createOnboardingSession(
  request: CreateOnboardingSessionRequest
): Promise<CreateOnboardingSessionResponse> {
  if (shouldUseOnboardingApi()) {
    return postJson<CreateOnboardingSessionResponse>('/api/v1/onboarding/sessions', request);
  }

  if (!request.consentAccepted) {
    throw new ApiError('Consent is required', 400, { message: 'consentAccepted must be true' });
  }

  if (!request.email && !request.phone) {
    throw new ApiError('Contact information is required', 400, { message: 'email or phone must be provided' });
  }

  const onboardingSessionId = genId('onb_sess');
  const draftId = genId('onb_draft');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const draft: OnboardingDraft = {
    draftId,
    onboardingSessionId,
    expiresAt,
    email: request.email,
    phone: request.phone,
    consentAccepted: request.consentAccepted,
    documents: [],
    issuingBankIds: [],
  };
  setDraft(draft);

  return { onboardingSessionId, draftId, expiresAt };
}

export async function getOnboardingDraft(draftId: string): Promise<OnboardingDraft> {
  if (shouldUseOnboardingApi()) {
    return getJson<OnboardingDraft>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}`);
  }

  const draft = getDrafts()[draftId];
  if (!draft) throw new ApiError('Draft not found', 404, { draftId });
  return draft;
}

export async function saveOrganization(draftId: string, org: SaveOrganizationRequest): Promise<SaveOrganizationResponse> {
  if (shouldUseOnboardingApi()) {
    return putJson<SaveOrganizationResponse>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}/organization`, org);
  }

  const draft = await getOnboardingDraft(draftId);
  const next: OnboardingDraft = { ...draft, organization: org };
  setDraft(next);
  return { ...next, status: 'DRAFT', savedAt: new Date().toISOString() };
}

export async function saveContact(draftId: string, contact: SaveContactRequest): Promise<OnboardingDraft> {
  if (shouldUseOnboardingApi()) {
    return putJson<OnboardingDraft>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}/contact`, contact);
  }

  const draft = await getOnboardingDraft(draftId);
  const next: OnboardingDraft = { ...draft, contact };
  setDraft(next);
  return next;
}

export async function uploadDocument(
  draftId: string,
  payload: UploadOnboardingDocumentRequest
): Promise<UploadOnboardingDocumentResponse> {
  if (shouldUseOnboardingApi()) {
    return postJson<UploadOnboardingDocumentResponse>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}/documents`, payload);
  }

  const draft = await getOnboardingDraft(draftId);
  const doc = {
    documentId: genId('doc'),
    type: payload.docType,
    fileName: payload.fileName,
    uploadedAt: nowIso(),
  };
  const next: OnboardingDraft = { ...draft, documents: [...draft.documents, doc] };
  setDraft(next);
  return {documentId: doc.documentId, draftId, docType: doc.type, verificationStatus: 'PENDING', uploadedAt: doc.uploadedAt};
}

export async function removeDocument(draftId: string, documentId: string): Promise<OnboardingDraft> {
  const draft = await getOnboardingDraft(draftId);
  const next: OnboardingDraft = { ...draft, documents: draft.documents.filter((d) => d.documentId !== documentId) };
  setDraft(next);
  return next;
}

export async function saveIssuingBanks(draftId: string, issuingBankIds: string[], onboardingSessionId: string): Promise<SelectedIssuingBanksResponse> {
  const payload:SelectedIssuingBanksRequest = {
  onboardingSessionId: onboardingSessionId || "",
  selectedBanks: issuingBankIds.map(id => ({ bankId: id })),
};
  if (shouldUseOnboardingApi()) {
    return putJson<SelectedIssuingBanksResponse>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}/issuing-banks`, payload
    );
  }

  const draft = await getOnboardingDraft(draftId);
  const next: OnboardingDraft = { ...draft, issuingBankIds };
  setDraft(next);
  return {draftId: draftId, selectedBankCount: issuingBankIds.length, savedAt: nowIso()};
}

export async function submitOnboardingDraft(
  draftId: string,
  request: SubmitOnboardingDraftRequest
): Promise<SubmitOnboardingDraftResponse> {
  if (shouldUseOnboardingApi()) {
    return postJson<SubmitOnboardingDraftResponse>(`/api/v1/onboarding/drafts/${encodeURIComponent(draftId)}/submit`, request);
  }

  const draft = await getOnboardingDraft(draftId);
  if (draft.onboardingSessionId !== request.onboardingSessionId) {
    throw new ApiError('Invalid onboarding session', 400, { message: 'onboardingSessionId mismatch' });
  }
  if (!draft.organization || !draft.contact) {
    throw new ApiError('Missing required details', 400, { message: 'organization and contact are required' });
  }
  if (!request.declarations.infoAccurate || !request.declarations.authorizedSigner) {
    throw new ApiError('Declarations required', 400, { message: 'declarations must be accepted' });
  }

  const submittedAt = nowIso();
  const caseId = genId('case');
  const affiliateId = `AFF-PENDING-${Math.floor(Math.random() * 90000 + 10000)}`;

  const c: OnboardingCase = {
    caseId,
    draftId: draft.draftId,
    onboardingSessionId: draft.onboardingSessionId,
    status: 'SUBMITTED',
    submittedAt,
    updatedAt: submittedAt,
    organization: draft.organization,
    contact: draft.contact,
    documents: draft.documents,
    issuingBankIds: draft.issuingBankIds,
    timeline: [{ status: 'SUBMITTED', at: submittedAt }],
    messages: [],
    decisionAt: undefined,
    decisionBy: undefined,
  };
  setCase(c);

  setDraft({ ...draft, submittedCaseId: caseId });
  return { caseId, affiliateId, status: 'SUBMITTED', submittedAt };
}

export async function getOnboardingCase(caseId: string): Promise<OnboardingCase> {
  if (shouldUseOnboardingApi()) {
    return getJson<OnboardingCase>(`/api/v1/onboarding/cases/${encodeURIComponent(caseId)}`);
  }

  const c = getCases()[caseId];
  if (!c) throw new ApiError('Case not found', 404, { caseId });
  return { ...c , timeline: c.timeline || [], messages: c.messages || [] };
}

export async function listOnboardingCases(request: ListOnboardingCasesRequest ={}): Promise<ListOnboardingCasesResponse> {
  if (shouldUseOnboardingApi()) {
    return getJson<ListOnboardingCasesResponse>('/api/v1/admin/onboarding/cases');
  }
  const {page = 1, pageSize = 25} = request;

  return{page, pageSize, total:0, cases:[]} 
  // return Object.values(getCases()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function decideOnboardingCase(
  caseId: string,
  request: DecisionRequest,
  actor?: AuditActor
): Promise<OnboardingCase> {
  if (shouldUseOnboardingApi()) {
    return postJson<OnboardingCase>(`/api/v1/admin/onboarding/cases/${encodeURIComponent(caseId)}/decision`, request);
  }

  const c = await getOnboardingCase(caseId);
  const updatedAt = nowIso();
  const status =
    request.decision === 'APPROVE'
      ? 'APPROVED'
      : request.decision === 'REJECT'
        ? 'REJECTED'
        : 'CLARIFICATION_REQUESTED';

  const next: OnboardingCase = {
    ...c,
    status,
    updatedAt,
    reviewerNote: request.reviewerNote,
    decisionReason: request.decisionReason,
    decisionBy: {
      userId: actor?.userId,
      name: actor?.name,
    },
    timeline: [...c.timeline, { status, at: updatedAt }],
    messages: c.messages || [],
  };

  reportStore.addAuditLog({
    userEmail: actor?.userEmail || 'superadmin@kardit.app',
    actionType: 'ONBOARDING_DECISION',
    entityType: 'OnboardingCase',
    entityId: caseId,
    ipAddress: actor?.ipAddress,
    userAgent: actor?.userAgent,
    oldValue: {
      status: c.status,
      reviewerNote: c.reviewerNote,
      decisionReason: c.decisionReason,
    },
    newValue: {
      status: next.status,
      decision: request.decision,
      reviewerNote: request.reviewerNote,
      decisionReason: request.decisionReason,
    },
  });

  setCase(next);
  return next;
}

export async function provisionOnboardingCase(caseId: string, actor?: AuditActor): Promise<ProvisionResponse> {
  if (shouldUseOnboardingApi()) {
    return postJson<ProvisionResponse>(`/api/v1/admin/onboarding/cases/${encodeURIComponent(caseId)}/provision`, {});
  }

  const c = await getOnboardingCase(caseId);
  if (c.status !== 'APPROVED') {
    throw new ApiError('Case must be approved before provisioning', 409, { status: c.status });
  }

  const tenantId = `TNT-AFF-${Math.floor(Math.random() * 90000 + 10000)}`;
  const adminEmail = c.contact?.contactEmail || `admin@${tenantId.toLowerCase()}.example`;
  const temporaryPassword = `Temp#${Math.floor(Math.random() * 900000 + 100000)}`;
  const provisionedAt = nowIso();
  const iamProvisioning = {
    status: 'TRIGGERED',
    loginUrl: ``,
  };
  const affiliateId = `AFF-${Math.floor(Math.random() * 90000 + 10000)}`;
  const bankPartnershipRequests = c.issuingBankIds.map(bankId => ({
    bankId,
    status: 'PENDING_BANK_APPROVAL',
  }));

  reportStore.addAuditLog({
    userEmail: actor?.userEmail || 'superadmin@kardit.app',
    actionType: 'ONBOARDING_PROVISION',
    entityType: 'OnboardingCase',
    entityId: caseId,
    ipAddress: actor?.ipAddress,
    userAgent: actor?.userAgent,
    oldValue: { status: c.status },
    newValue: {
      status: 'PROVISIONED',
      tenantId,
      adminEmail,
      provisionedAt,
      iamProvisioning,
      bankPartnershipRequests,
    },
  });

  setCase({
    ...c,
    status: 'PROVISIONED',
    updatedAt: provisionedAt,
    provisionedTenantId: tenantId,
    provisionedAdminEmail: adminEmail,
    provisionedTemporaryPassword: temporaryPassword,
  });

  return { caseId:c.caseId, tenantId, affiliateId, iamProvisioning, bankPartnershipRequests, provisionedAt };
}
