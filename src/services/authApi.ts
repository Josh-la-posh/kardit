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
    const message =
      (typeof errorBody === 'object' && errorBody && 'message' in (errorBody as any)
        ? String((errorBody as any).message)
        : undefined) || `Request failed (${res.status})`;

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
