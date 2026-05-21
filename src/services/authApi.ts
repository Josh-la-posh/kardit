import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types/authContracts';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(errorBody: unknown, fallback: string): string {
  if (!errorBody) return fallback;

  if (typeof errorBody === 'string') return errorBody;

  if (typeof errorBody === 'object') {
    const body = errorBody as Record<string, unknown>;
    const nestedError = body.Error;

    const validationErrors = body.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      for (const value of Object.values(validationErrors as Record<string, unknown>)) {
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          if (typeof first === 'string' && first.trim()) return first;
        }
        if (typeof value === 'string' && value.trim()) return value;
      }
    }

    if (nestedError && typeof nestedError === 'object') {
      const errorRecord = nestedError as Record<string, unknown>;
      if (typeof errorRecord.Message === 'string' && errorRecord.Message.trim()) return errorRecord.Message;
      if (typeof errorRecord.Code === 'string' && errorRecord.Code.trim()) return errorRecord.Code;
    }

    if (typeof body.Message === 'string' && body.Message.trim()) return body.Message;
    if (typeof body.error === 'string' && body.error.trim()) return body.error;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.Error === 'string' && body.Error.trim()) return body.Error;
    if (typeof body.Title === 'string' && body.Title.trim()) return body.Title;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
    if (typeof body.Detail === 'string' && body.Detail.trim()) return body.Detail;
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
  }

  return fallback;
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  // Vite exposes env vars on import.meta.env (string | boolean | undefined)
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

async function postJson<TResponse>(path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError('Missing VITE_API_BASE_URL', 0, undefined);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
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

// SRS: API-AUTH-01
export const login = (request: LoginRequest) => postJson<LoginResponse>('/api/v1/auth/login', request);

// SRS: API-FPWD-01
export const requestPasswordReset = (request: ForgotPasswordRequest) =>
  postJson<ForgotPasswordResponse>('/api/v1/auth/forgot-password', request);

// SRS: API-FPWD-02
export const resetPassword = (request: ResetPasswordRequest) =>
  postJson<ResetPasswordResponse>('/api/v1/auth/reset-password', request);
