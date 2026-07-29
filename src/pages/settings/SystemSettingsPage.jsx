import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import LoadingButton from '@/components/ui/loading-button';
import { useGetAppSettingsQuery, useUpdateAppSettingsMutation } from '@/store/api/apiSlice';
import { ROLES, cn } from '@/lib/utils';

export default function SystemSettingsPage() {
  const { user } = useSelector((state) => state.auth);
  const canManageFeatures = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data, isLoading } = useGetAppSettingsQuery();
  const [updateAppSettings, { isLoading: saving }] = useUpdateAppSettingsMutation();
  const [adminRemarksEnabled, setAdminRemarksEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof data?.data?.adminRemarksEnabled === 'boolean') {
      setAdminRemarksEnabled(data.data.adminRemarksEnabled);
    }
  }, [data]);

  const saveFeatures = async () => {
    setMessage('');
    setError('');
    try {
      await updateAppSettings({ adminRemarksEnabled }).unwrap();
      setMessage('Feature settings saved.');
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save settings');
    }
  };

  return (
    <div>
      <Header title="System Settings" description="System configuration and feature toggles" />

      <div className="space-y-6 p-4 sm:p-6">
        {canManageFeatures && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Lead Features
                <InfoTooltip content="Toggle optional lead features. Disabled features stay in the database but are hidden from the UI until re-enabled." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading settings…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Admin Remarks</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        When enabled, admins can add instruction remarks on leads. When disabled,
                        Admin Remarks are hidden everywhere (existing data is kept).
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={adminRemarksEnabled}
                      onClick={() => setAdminRemarksEnabled((v) => !v)}
                      className={cn(
                        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                        adminRemarksEnabled ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                          adminRemarksEnabled ? 'left-5' : 'left-0.5'
                        )}
                      />
                    </button>
                  </div>
                  {message && <p className="text-sm text-emerald-600">{message}</p>}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <LoadingButton onClick={saveFeatures} loading={saving} loadingText="Saving…">
                    Save feature settings
                  </LoadingButton>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Security Settings
                <InfoTooltip content="Security thresholds are configured via environment variables (.env). OTP expiry, login limits, session timeout, and rate limiting are managed at deployment level." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">OTP Expiry</p>
                  <p className="text-2xl font-bold">5 min</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Max Login Attempts</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-2xl font-bold">7 days</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-2xl font-bold">100 req/15min</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                All integration and service configuration (email, database, cache, queues) is managed exclusively through environment variables.
              </p>
            </CardContent>
          </Card>
        )}

        {!canManageFeatures && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              You do not have permission to manage system settings.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
