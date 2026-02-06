import { useState, useEffect, useCallback } from 'react';
import { store, ManagedUser } from '@/stores/mockStore';

const DELAY = 500;

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, DELAY));
    setUsers(store.getUsers());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { users, isLoading, refetch: fetch };
}

export function useUser(userId: string | undefined) {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const t = setTimeout(() => {
      setUser(store.getUser(userId) || null);
      setIsLoading(false);
    }, DELAY);
    return () => clearTimeout(t);
  }, [userId]);

  return { user, isLoading };
}

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);

  const createUser = useCallback(async (data: Omit<ManagedUser, 'id' | 'createdAt' | 'status'>) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const user = store.createUser(data);
    setIsLoading(false);
    return user;
  }, []);

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
