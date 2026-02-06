import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { StatusChangeModal } from '@/components/StatusChangeModal';
import { InviteErrorModal } from '@/components/InviteErrorModal';
import { ROLES } from '@/stores/mockStore';
import { Loader2, Save, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EXAMPLE_PERMISSIONS = [
  'users.create', 'users.delete', 'customers.export', 'reports.view', 'cards.freeze',
];

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useUser(userId);
  const { updateUser, isLoading: isSaving } = useUpdateUser();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [permOverrides, setPermOverrides] = useState<{ permission: string; action: 'GRANT' | 'REVOKE' }[]>([]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [inviteErrorOpen, setInviteErrorOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '' });
      setSelectedRoles(user.roles.map((r) => r.id));
      setPermOverrides(user.permissionOverrides || []);
    }
  }, [user]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]);
  };

  const togglePermission = (perm: string) => {
    setPermOverrides((prev) => {
      const existing = prev.find((p) => p.permission === perm);
      if (!existing) return [...prev, { permission: perm, action: 'GRANT' as const }];
      if (existing.action === 'GRANT') return prev.map((p) => p.permission === perm ? { ...p, action: 'REVOKE' as const } : p);
      return prev.filter((p) => p.permission !== perm);
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    const roles = ROLES.filter((r) => selectedRoles.includes(r.id));
    await updateUser(userId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      roles,
      permissionOverrides: permOverrides.length > 0 ? permOverrides : undefined,
    });
    toast.success('User updated successfully.');
  };

  const handleResendInvite = () => {
    if (user?.email === 'fail-invite@kardit.app') {
      setInviteErrorOpen(true);
    } else {
      toast.success('Invite email resent (mock).');
    }
  };

  const handleStatusChanged = async (newStatus: string) => {
    if (!userId) return;
    await updateUser(userId, { status: newStatus as any });
    toast.success('Status updated.');
    setStatusModalOpen(false);
    // Re-read by navigating to self
    navigate(`/users/${userId}`, { replace: true });
    window.location.reload();
  };

  if (isLoading) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout></ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute><AppLayout>
        <div className="text-center py-20 text-muted-foreground">User not found.</div>
      </AppLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in max-w-3xl">
          <PageHeader
            title={`${user.firstName} ${user.lastName}`}
            subtitle={user.email}
            actions={
              <div className="flex items-center gap-2">
                <StatusChip status={user.status as StatusType} />
              </div>
            }
          />

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="kardit-card p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField label="First Name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                  <TextField label="Last Name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
                <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                <TextField label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <div className="space-y-4">
                <div className="kardit-card p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.id} type="button" onClick={() => toggleRole(role.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selectedRoles.includes(role.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >{role.name}</button>
                    ))}
                  </div>
                </div>
                <div className="kardit-card p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Permission Overrides</h3>
                  <div className="space-y-2">
                    {EXAMPLE_PERMISSIONS.map((perm) => {
                      const o = permOverrides.find((p) => p.permission === perm);
                      return (
                        <button key={perm} type="button" onClick={() => togglePermission(perm)}
                          className="flex w-full items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm hover:border-primary/50 transition-colors">
                          <span className="font-mono text-foreground">{perm}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            o?.action === 'GRANT' ? 'bg-success/15 text-success' :
                            o?.action === 'REVOKE' ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground'
                          }`}>{o?.action || '—'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="kardit-card p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{format(new Date(user.createdAt), 'PPP p')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm">{user.lastLoginAt ? format(new Date(user.lastLoginAt), 'PPP p') : '—'}</p>
                  </div>
                </div>
                <Button variant="link" className="px-0 text-secondary" onClick={() => navigate('/audit-logs')}>
                  View audit logs for this user →
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setStatusModalOpen(true)}>
              <ShieldAlert className="h-4 w-4" /> Change Status
            </Button>
            <Button variant="outline" onClick={handleResendInvite}>
              <RefreshCw className="h-4 w-4" />
              {user.status === 'INVITED' ? 'Resend Invite' : 'Reset Password'}
            </Button>
          </div>
        </div>

        <StatusChangeModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          currentStatus={user.status}
          onConfirm={handleStatusChanged}
        />

        <InviteErrorModal
          open={inviteErrorOpen}
          onClose={() => setInviteErrorOpen(false)}
          onRetry={() => {
            setInviteErrorOpen(false);
            toast.success('Invite resent successfully on retry (mock).');
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
