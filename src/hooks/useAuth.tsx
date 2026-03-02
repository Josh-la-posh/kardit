import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

export type ComplianceStatus = 'not_started' | 'pending' | 'rejected' | 'approved';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  stakeholderType?: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER';
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
  complianceStatus?: ComplianceStatus;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  passwordMustChange: boolean;
  sessionExpired: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; locked?: boolean; complianceStatus?: ComplianceStatus, stakeholderType?: string }>;
  logout: () => void;
  completePasswordChange: () => void;
  forceSessionExpired: () => void;
  dismissSessionExpired: () => void;
  updateComplianceStatus: (status: ComplianceStatus) => void;
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
      complianceStatus: 'approved',
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
      complianceStatus: 'pending',
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
      complianceStatus: 'not_started',
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
      complianceStatus: 'rejected',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    passwordMustChange: false,
    sessionExpired: false,
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email.toLowerCase()];

    // Check for locked account (also works for any email containing "locked")
    if (mockUser?.locked || email.toLowerCase().includes('locked')) {
      return { success: false, error: 'Account is locked', locked: true };
    }

    // Check credentials
    if (!mockUser || mockUser.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    setState({
      isAuthenticated: true,
      user: mockUser.user,
      passwordMustChange: mockUser.requiresPasswordChange || false,
      sessionExpired: false,
    });

    return { success: true };
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

  const updateComplianceStatus = useCallback((status: ComplianceStatus) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, complianceStatus: status } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        completePasswordChange,
        forceSessionExpired,
        dismissSessionExpired,
        updateComplianceStatus
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
