import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useCreateUser } from '@/hooks/useUsers';
import { ROLES } from '@/stores/mockStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EXAMPLE_PERMISSIONS = [
  'users.create', 'users.delete', 'customers.export', 'reports.view', 'cards.freeze',
];

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { createUser, isLoading } = useCreateUser();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [permOverrides, setPermOverrides] = useState<{ permission: string; action: 'GRANT' | 'REVOKE' }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const togglePermission = (perm: string) => {
    setPermOverrides((prev) => {
      const existing = prev.find((p) => p.permission === perm);
      if (!existing) return [...prev, { permission: perm, action: 'GRANT' as const }];
      if (existing.action === 'GRANT') return prev.map((p) => p.permission === perm ? { ...p, action: 'REVOKE' as const } : p);
      return prev.filter((p) => p.permission !== perm);
    });
  };

  const getPermState = (perm: string) => {
    const o = permOverrides.find((p) => p.permission === perm);
    return o?.action || null;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (selectedRoles.length === 0) e.roles = 'Select at least one role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const roles = ROLES.filter((r) => selectedRoles.includes(r.id));
    await createUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      roles,
      permissionOverrides: permOverrides.length > 0 ? permOverrides : undefined,
    });
    toast.success('User created and invite email sent (mock).');
    navigate('/users');
  };

  return (
    <ProtectedRoute requiredRoles={["Admin", "Super Admin"]}>
      <AppLayout>
        <div className="animate-fade-in max-w-2xl">
          <PageHeader title="Create User" subtitle="Add a new user to the system" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="First Name *" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
                <TextField label="Last Name *" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
              </div>
              <TextField label="Email *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
              <TextField label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>

            {/* Roles */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Roles</h2>
              {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedRoles.includes(role.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Permission Overrides */}
            <div className="kardit-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Permission Overrides</h2>
              <p className="text-xs text-muted-foreground">Click to cycle: none → GRANT → REVOKE → none</p>
              <div className="space-y-2">
                {EXAMPLE_PERMISSIONS.map((perm) => {
                  const state = getPermState(perm);
                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm hover:border-primary/50 transition-colors"
                    >
                      <span className="font-mono text-foreground">{perm}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        state === 'GRANT' ? 'bg-success/15 text-success' :
                        state === 'REVOKE' ? 'bg-destructive/15 text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {state || '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
