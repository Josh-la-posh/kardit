import { useState, useEffect, useCallback } from 'react';
import { store, ManagedUser } from '@/stores/mockStore';
import { useAuth } from '@/hooks/useAuth';

const DELAY = 500;

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setUsers(store.getUsers(tenantScope));
    setIsLoading(false);
  }, [tenantScope]);

  useEffect(() => { fetch(); }, [fetch]);

  return { users, isLoading, refetch: fetch };
}

export function useUser(userId: string | undefined) {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser } = useAuth();

  const tenantScope = authUser?.role === 'Super Admin' ? undefined : authUser?.tenantId;

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const t = setTimeout(() => {
      setUser(store.getUser(userId, tenantScope) || null);
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, [userId, tenantScope]);

  return { user, isLoading };
}

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createUser = useCallback(async (data: Omit<ManagedUser, 'id' | 'createdAt' | 'status'>) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const tenantId = user?.tenantId || 'tenant_alpha_affiliate';
    const created = store.createUser({ ...data, tenantId });
    setIsLoading(false);
    return created;
  }, [user?.tenantId]);

  return { createUser, isLoading };
}

export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);

  const updateUser = useCallback(async (id: string, patch: Partial<ManagedUser>) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const user = store.updateUser(id, patch);
    setIsLoading(false);
    return user;
  }, []);

  return { updateUser, isLoading };
}
