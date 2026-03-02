export type AuthChannel = 'WEB';

export interface LoginRequest {
  username: string;
  password: string;
  channel: AuthChannel;
  deviceInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
  };
}

export interface LoginPasswordChangeRequiredResponse {
  requiresPasswordChange: true;
  userId: string;
  userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER';
  message: string;
}

export interface LoginSuccessResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    fullName: string;
    userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER';
    roles: string[];
    scope: {
      scopeType: 'AFFILIATE_TENANT' | 'BANK_PORTFOLIO' | 'GLOBAL';
      tenantId?: string;
      bankId?: string;
    };
  };
}

export type LoginResponse = LoginPasswordChangeRequiredResponse | LoginSuccessResponse;

export interface ForgotPasswordRequest {
  username: string;
  channel: AuthChannel;
}

export interface ForgotPasswordResponse {
  resetRequestId: string;
  deliveryChannel: 'EMAIL' | 'SMS';
  expiresAt: string;
}

export interface ResetPasswordRequest {
  resetRequestId: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  status: 'PASSWORD_RESET_SUCCESS';
  updatedAt: string;
}
