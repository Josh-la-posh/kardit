import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginPasswordChangeRequiredResponse,
  LoginRequest,
  LoginResponse,
  LoginSuccessResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types/authContracts';
import {
  ApiError,
  login as apiLogin,
  requestPasswordReset as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
} from '@/services/authApi';

/**
 * Authentication Context for Kardit
 * 
 * Provides:
 * - isAuthenticated: boolean
 * - user: User object or null
 * - passwordMustChange: boolean (for first-time login)
 * - login, logout, forceSessionExpired functions
 * 
 * Demo users:
 * - demo@kardit.app / Demo123! - Normal login
 * - affiliate@kardit.app / Demo123! - Affiliate operator login
 * - bank@kardit.app / Demo123! - Bank portal login
 * - superadmin@kardit.app / Demo123! - Super Admin access
 * - firstlogin@kardit.app / Demo123! - Requires password change
 * - locked@kardit.app / any - Account locked
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  stakeholderType?: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER';
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  passwordMustChange: boolean;
  sessionExpired: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    emailOrRequest: string | LoginRequest,
    password?: string
  ) => Promise<
    | { success: true; response: LoginResponse }
    | { success: false; error: string; status?: 400 | 401 | 403 | 423; locked?: boolean }
  >;
  requestPasswordReset: (request: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
  resetPassword: (request: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
  logout: () => void;
  completePasswordChange: () => void;
  forceSessionExpired: () => void;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User; requiresPasswordChange?: boolean; locked?: boolean }> = {
  'demo@kardit.app': {
    password: 'Demo123!',
    user: {
      id: '1',
      email: 'demo@kardit.app',
      name: 'John Doe',
      role: 'Admin',
      stakeholderType: 'AFFILIATE',
      tenantId: 'tenant_alpha_affiliate',
      tenantName: 'Alpha Bank Affiliate',
    },
  },
  'affiliate@kardit.app': {
    password: 'Demo123!',
    user: {
      id: '5',
      email: 'affiliate@kardit.app',
      name: 'Affiliate User',
      role: 'User',
      stakeholderType: 'AFFILIATE',
      tenantId: 'tenant_alpha_affiliate',
      tenantName: 'Alpha Bank Affiliate',
    },
  },
  'bank@kardit.app': {
    password: 'Demo123!',
    user: {
      id: '4',
      email: 'bank@kardit.app',
      name: 'Alpha Bank User',
      role: 'User',
      stakeholderType: 'BANK',
      tenantId: 'tenant_alpha_bank',
      tenantName: 'Alpha Bank',
    },
  },
  'superadmin@kardit.app': {
    password: 'Demo123!',
    user: {
      id: '0',
      email: 'superadmin@kardit.app',
      name: 'Super Admin',
      role: 'Super Admin',
      stakeholderType: 'SERVICE_PROVIDER',
      tenantId: 'tenant_chamsswitch',
      tenantName: 'Chamsswitch',
    },
  },
  'firstlogin@kardit.app': {
    password: 'Demo123!',
    requiresPasswordChange: true,
    user: {
      id: '2',
      email: 'firstlogin@kardit.app',
      name: 'New User',
      role: 'User',
      stakeholderType: 'AFFILIATE',
      tenantId: 'tenant_alpha_affiliate',
      tenantName: 'Alpha Bank Affiliate',
    },
  },
  'locked@kardit.app': {
    password: 'any',
    locked: true,
    user: {
      id: '3',
      email: 'locked@kardit.app',
      name: 'Locked User',
      role: 'User',
      stakeholderType: 'AFFILIATE',
      tenantId: 'tenant_alpha_affiliate',
      tenantName: 'Alpha Bank Affiliate',
    },
  },
};

function randomId(prefix: string) {
  return `${prefix}-${Math.floor(Date.now() / 1000)}-${Math.random().toString(16).slice(2, 8)}`.toUpperCase();
}

function toUserType(user: User): 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' {
  return user.stakeholderType ?? 'AFFILIATE';
}

function toStakeholderType(userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER'): User['stakeholderType'] {
  return userType;
}

function shouldUseAuthApi(): boolean {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const flag = (import.meta as any).env?.VITE_USE_API_AUTH as string | undefined;
  return Boolean(baseUrl) && flag === 'true';
}

function apiUserToInternalUser(username: string, apiUser: LoginSuccessResponse['user']): User {
  const scope = apiUser.scope;
  const tenantId =
    scope.scopeType === 'AFFILIATE_TENANT'
      ? scope.tenantId || 'tenant_unknown'
      : scope.scopeType === 'BANK_PORTFOLIO'
        ? scope.bankId || 'tenant_unknown'
        : 'tenant_unknown';

  return {
    id: apiUser.userId,
    email: username,
    name: apiUser.fullName,
    role: apiUser.roles?.[0] ?? 'User',
    stakeholderType: toStakeholderType(apiUser.userType),
    tenantId,
    tenantName: tenantId === 'tenant_unknown' ? 'Unknown' : tenantId,
  };
}

function toScope(user: User): LoginSuccessResponse['user']['scope'] {
  const stakeholderType = user.stakeholderType;
  if (stakeholderType === 'BANK') {
    return { scopeType: 'BANK_PORTFOLIO', bankId: user.tenantId };
  }
  if (stakeholderType === 'SERVICE_PROVIDER') {
    return { scopeType: 'GLOBAL' };
  }
  return { scopeType: 'AFFILIATE_TENANT', tenantId: user.tenantId };
}

function toRoles(user: User): string[] {
  // Keep the app's existing `user.role` semantics, but wrap into an SRS-style array.
  const baseRole = user.role?.trim();
  if (!baseRole) return [];

  const stakeholderType = user.stakeholderType ?? 'AFFILIATE';
  if (stakeholderType === 'AFFILIATE') {
    if (baseRole === 'Admin') return ['AFFILIATE_ADMIN'];
    if (baseRole === 'User') return ['AFFILIATE_OPERATOR'];
    return [`AFFILIATE_${baseRole.toUpperCase().replace(/\s+/g, '_')}`];
  }

  if (stakeholderType === 'BANK') {
    if (baseRole === 'Admin') return ['BANK_ADMIN'];
    if (baseRole === 'User') return ['BANK_USER'];
    return [`BANK_${baseRole.toUpperCase().replace(/\s+/g, '_')}`];
  }

  // SERVICE_PROVIDER
  if (baseRole === 'Super Admin') return ['SUPER_ADMIN'];
  return [baseRole.toUpperCase().replace(/\s+/g, '_')];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    passwordMustChange: false,
    sessionExpired: false,
  });

  const login = useCallback(async (emailOrRequest: string | LoginRequest, password?: string) => {
    const request: LoginRequest =
      typeof emailOrRequest === 'string'
        ? {
            username: emailOrRequest,
            password: password ?? '',
            channel: 'WEB',
            deviceInfo: {
              userAgent: navigator.userAgent,
            },
          }
        : emailOrRequest;

    if (shouldUseAuthApi()) {
      try {
        const response = await apiLogin(request);

        if ('requiresPasswordChange' in response && response.requiresPasswordChange) {
          setState({
            isAuthenticated: true,
            user: {
              id: response.userId,
              email: request.username,
              name: request.username,
              role: 'User',
              stakeholderType: toStakeholderType(response.userType),
              tenantId: 'tenant_unknown',
              tenantName: 'Unknown',
            },
            passwordMustChange: true,
            sessionExpired: false,
          });

          return { success: true as const, response };
        }

        const internalUser = apiUserToInternalUser(request.username, response.user);
        setState({
          isAuthenticated: true,
          user: internalUser,
          passwordMustChange: false,
          sessionExpired: false,
        });

        return { success: true as const, response };
      } catch (err) {
        if (err instanceof ApiError && err.status) {
          if (err.status === 423) return { success: false as const, error: err.message, status: 423, locked: true };
          if (err.status === 403) return { success: false as const, error: err.message || 'User inactive', status: 403 };
          if (err.status === 401)
            return { success: false as const, error: err.message || 'Invalid username or password', status: 401 };
          if (err.status === 400) return { success: false as const, error: err.message || 'Missing credentials', status: 400 };
          return { success: false as const, error: err.message || 'Login failed' };
        }
        // If API is enabled but unreachable, fall through to mock behavior.
      }
    }

    // Simulate network delay for mock auth only
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!request.username || !request.password) {
      return { success: false as const, error: 'Missing credentials', status: 400 as const };
    }

    const email = request.username.toLowerCase();

    const mockUser = MOCK_USERS[email];

    // Check for locked account (also works for any email containing "locked")
    if (mockUser?.locked || email.includes('locked')) {
      return { success: false as const, error: 'Account is locked', status: 423 as const, locked: true };
    }

    // Check credentials
    if (!mockUser || mockUser.password !== request.password) {
      return { success: false as const, error: 'Invalid username or password', status: 401 as const };
    }

    const user = mockUser.user;
    const userType = toUserType(user);

    setState({
      isAuthenticated: true,
      user,
      passwordMustChange: mockUser.requiresPasswordChange || false,
      sessionExpired: false,
    });

    if (mockUser.requiresPasswordChange) {
      const response: LoginPasswordChangeRequiredResponse = {
        requiresPasswordChange: true,
        userId: user.id,
        userType,
        message: 'Password change required before access.',
      };
      return { success: true as const, response };
    }

    const response: LoginSuccessResponse = {
      accessToken: `mock.${randomId('AT')}`,
      refreshToken: `mock.${randomId('RT')}`,
      expiresIn: 3600,
      user: {
        userId: user.id,
        fullName: user.name,
        userType,
        roles: toRoles(user),
        scope: toScope(user),
      },
    };

    return { success: true as const, response };
  }, []);

  const requestPasswordReset = useCallback(async (request: ForgotPasswordRequest) => {
    if (shouldUseAuthApi()) {
      try {
        return await apiRequestPasswordReset(request);
      } catch (err) {
        // UX should not disclose account existence; callers already show generic success.
        if (err instanceof ApiError && err.status) throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!request.username) {
      // Keep it simple in the mock: emulate server-side 400 by throwing.
      throw new Error('Missing username');
    }
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    return {
      resetRequestId: randomId('RST'),
      deliveryChannel: 'EMAIL',
      expiresAt,
    };
  }, []);

  const resetPassword = useCallback(async (request: ResetPasswordRequest) => {
    if (shouldUseAuthApi()) {
      try {
        return await apiResetPassword(request);
      } catch (err) {
        if (err instanceof ApiError && err.status) throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!request.resetRequestId || !request.otp || !request.newPassword) {
      throw new Error('Missing reset payload');
    }

    // Mock behavior: treat otp "000000" as invalid.
    if (request.otp === '000000') {
      const err = new Error('Invalid OTP');
      (err as any).code = 400;
      throw err;
    }

    return {
      status: 'PASSWORD_RESET_SUCCESS',
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      passwordMustChange: false,
      sessionExpired: false,
    });
  }, []);

  const completePasswordChange = useCallback(() => {
    setState((prev) => ({
      ...prev,
      passwordMustChange: false,
    }));
  }, []);

  const forceSessionExpired = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionExpired: true,
    }));
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      passwordMustChange: false,
      sessionExpired: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        requestPasswordReset,
        resetPassword,
        logout,
        completePasswordChange,
        forceSessionExpired,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
