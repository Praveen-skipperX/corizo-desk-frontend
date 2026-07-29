import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Shield, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { ROLES } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import api from '@/lib/api';
import { useGetConnectorsQuery } from '@/store/api/apiSlice';
import { useToast } from '@/components/ui/toast';

const PASSWORD_MODES = [
  { value: 'hybrid', label: 'Temporary password (change on first login)', description: 'Recommended — admin sets password, user must change it' },
  { value: 'manual', label: 'Set permanent password now', description: 'Admin sets final password during creation' },
  { value: 'first_login', label: 'User creates password on first login', description: 'No password now — user sets it after OTP login' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'employee',
  department: '',
  passwordMode: 'hybrid',
  password: '',
  confirmPassword: '',
  isActive: true,
  requireMfaOnLogin: true,
  allowedConnectors: [],
};

export default function AddUserModal({
  open,
  onClose,
  onSuccess,
  user: currentUser,
  editUser = null,
  departments = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const isEdit = Boolean(editUser);
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const showSheetAccess = form.role === ROLES.EMPLOYEE || form.role === 'employee';

  const { data: connectorsData, isLoading: sheetsLoading } = useGetConnectorsQuery(
    { limit: 100 },
    { skip: !open || !showSheetAccess },
  );
  const sheets = useMemo(() => connectorsData?.data || [], [connectorsData]);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editUser) {
      const existingSheets = (editUser.allowedConnectors || []).map((c) => c?._id || c);
      setForm({
        ...EMPTY_FORM,
        name: editUser.name || '',
        email: editUser.email || '',
        phone: editUser.phone || '',
        role: editUser.role || 'employee',
        department: editUser.department?._id || '',
        isActive: editUser.isActive !== false,
        allowedConnectors: existingSheets.map(String),
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        department: currentUser?.role === ROLES.ADMIN
          ? (currentUser.department?._id || currentUser.department || '')
          : '',
      });
    }
  }, [open, editUser, currentUser]);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError('');
    onClose?.();
  };

  const toggleSheet = (id) => {
    const sid = String(id);
    setForm((prev) => {
      const has = prev.allowedConnectors.includes(sid);
      return {
        ...prev,
        allowedConnectors: has
          ? prev.allowedConnectors.filter((x) => x !== sid)
          : [...prev.allowedConnectors, sid],
      };
    });
  };

  const selectAllSheets = () => {
    setForm((prev) => ({
      ...prev,
      allowedConnectors: sheets.map((s) => String(s._id)),
    }));
  };

  const clearSheets = () => {
    setForm((prev) => ({ ...prev, allowedConnectors: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (showSheetAccess && !form.allowedConnectors.length) {
        setError('Select at least one sheet this employee can access');
        setLoading(false);
        return;
      }

      if (isEdit) {
        await api.patch(`/users/${editUser._id}`, {
          name: form.name,
          phone: form.phone,
          ...(ENABLE_DEPARTMENTS ? { department: form.department || undefined } : {}),
          role: form.role,
          isActive: form.isActive,
          ...(showSheetAccess ? { allowedConnectors: form.allowedConnectors } : { allowedConnectors: [] }),
        });
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          ...(ENABLE_DEPARTMENTS ? { department: form.department || undefined } : {}),
          passwordMode: form.passwordMode,
          isActive: form.isActive,
          ...(showSheetAccess ? { allowedConnectors: form.allowedConnectors } : {}),
        };
        if (form.passwordMode !== 'first_login') {
          payload.password = form.password;
          payload.confirmPassword = form.confirmPassword;
        }
        if (form.passwordMode === 'first_login') {
          payload.forcePasswordOnFirstLogin = true;
        }
        if (form.passwordMode === 'hybrid') {
          payload.forcePasswordChangeOnFirstLogin = true;
        }
        await api.post('/users', payload);
      }
      toast.success(
        isEdit ? 'User updated' : 'User created',
        form.name || form.email,
      );
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit User' : 'Add User'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update account details, sheet access, and status.'
              : 'Create a new user account with role, sheet access, and security settings.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DialogBody className="space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <section>
              <h3 className="mb-3 text-sm font-semibold text-secondary">Account Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name *</label>
                  <Input
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={isEdit}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                {isSuperAdmin && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Role *</label>
                    <select
                      className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.role}
                      onChange={(e) => setForm({
                        ...form,
                        role: e.target.value,
                        allowedConnectors: e.target.value === 'employee' ? form.allowedConnectors : [],
                      })}
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
                {ENABLE_DEPARTMENTS && isSuperAdmin && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Department *</label>
                    <select
                      className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {showSheetAccess && (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Sheet Access *
                  </h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllSheets} disabled={!sheets.length}>
                      Select all
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSheets} disabled={!form.allowedConnectors.length}>
                      Clear
                    </Button>
                  </div>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  This user can view leads from the selected Google Sheets, plus any leads assigned to them by someone else.
                </p>
                {sheetsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading sheets…</p>
                ) : !sheets.length ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    No connected sheets found. Connect a Google Sheet first, then assign access here.
                  </div>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                    {sheets.map((sheet) => {
                      const id = String(sheet._id);
                      const checked = form.allowedConnectors.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex cursor-pointer items-start gap-3 rounded-md border p-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSheet(id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{sheet.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {sheet.status || 'connected'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.allowedConnectors.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {form.allowedConnectors.length} sheet{form.allowedConnectors.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </section>
            )}

            <section>
              <h3 className="mb-3 text-sm font-semibold text-secondary">Account Status</h3>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Active account</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot sign in until reactivated.
                  </p>
                </div>
              </label>
            </section>

            {!isEdit && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-secondary">Password Options</h3>
                <div className="space-y-2">
                  {PASSWORD_MODES.map((mode) => (
                    <label
                      key={mode.value}
                      className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="passwordMode"
                        checked={form.passwordMode === mode.value}
                        onChange={() => setForm({ ...form, passwordMode: mode.value, password: '', confirmPassword: '' })}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">{mode.label}</p>
                        <p className="text-xs text-muted-foreground">{mode.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {form.passwordMode !== 'first_login' && (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <PasswordInput
                      placeholder={form.passwordMode === 'hybrid' ? 'Temporary password' : 'Password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <PasswordInput
                      placeholder="Confirm password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                )}
              </section>
            )}

            <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-secondary">
                <Shield className="h-4 w-4 text-primary" />
                Security Settings
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                New users sign in with email OTP and optional authenticator app (configured in Account Settings).
                {form.passwordMode === 'hybrid' && ' A temporary password is issued and must be changed on first login.'}
                {form.passwordMode === 'first_login' && ' The user will set their own password after first OTP verification.'}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3">
                <input
                  type="checkbox"
                  checked={form.requireMfaOnLogin}
                  onChange={(e) => setForm({ ...form, requireMfaOnLogin: e.target.checked })}
                  className="mt-0.5"
                  disabled
                />
                <div>
                  <p className="text-sm font-medium">Multi-factor authentication required</p>
                  <p className="text-xs text-muted-foreground">
                    Enforced by organization policy on every sign-in.
                  </p>
                </div>
              </label>
            </section>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText={isEdit ? 'Updating user...' : 'Creating user...'}
            >
              {isEdit ? 'Update User' : 'Create User'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
