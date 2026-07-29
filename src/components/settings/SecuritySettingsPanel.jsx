import { Shield, Mail, Smartphone, Lock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { cn, formatDateTime } from '@/lib/utils';
import ConfirmIdentityModal from '@/components/settings/ConfirmIdentityModal';
import TotpSetupModal from '@/components/settings/TotpSetupModal';

const MFA_OPTIONS = [
  {
    id: 'otp',
    label: 'Email OTP',
    description: 'Secure OTP verification through your registered email.',
    icon: Mail,
  },
  {
    id: 'totp',
    label: 'Authenticator App',
    description: 'Google Authenticator, Microsoft Authenticator, or Authy.',
    icon: Smartphone,
  },
  {
    id: 'both',
    label: 'High Security Mode',
    description: 'Require both email OTP and authenticator code. Recommended.',
    icon: Lock,
    recommended: true,
  },
];

const MFA_LABELS = {
  otp: 'Email OTP',
  totp: 'Authenticator App',
  both: 'Email OTP + Authenticator',
};

export default function SecuritySettingsPanel({
  security,
  secDash,
  mfaPreference,
  onMfaPreferenceChange,
  onSaveMfaPreference,
  onEnableTotp,
  onVerifyTotp,
  onDisableTotp,
  totpSetupData,
  totpModalOpen,
  totpSuccess,
  onCloseTotpModal,
  confirmOpen,
  confirmConfig,
  onConfirmClose,
  onConfirm,
  loading,
  isSuperAdmin,
}) {
  const totpEnabled = security?.totpEnabled || secDash?.totpEnabled;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Security Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground">MFA Status</p>
              <p className="mt-0.5 font-semibold text-secondary">
                {totpEnabled ? 'Enabled' : 'Email OTP Only'}
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground">Active Sessions</p>
              <p className="mt-0.5 font-semibold text-secondary">{secDash?.activeSessionCount ?? 0}</p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground">Authentication Method</p>
              <p className="mt-0.5 font-semibold text-secondary">{MFA_LABELS[mfaPreference] || 'Email OTP'}</p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground">Last Login</p>
              <p className="mt-0.5 text-sm font-semibold text-secondary">
                {secDash?.lastLoginAt ? formatDateTime(secDash.lastLoginAt) : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Authentication Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {MFA_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = mfaPreference === opt.id;
              const disabled = opt.id !== 'otp' && !totpEnabled;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onMfaPreferenceChange(opt.id)}
                  className={cn(
                    'relative rounded-xl border p-4 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:border-primary/40 hover:bg-muted/30',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {opt.recommended && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Recommended
                    </span>
                  )}
                  <Icon className={cn('mb-3 h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="font-semibold text-secondary">{opt.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
                  {disabled && opt.id !== 'otp' && (
                    <p className="mt-2 text-xs text-amber-600">Enable authenticator first</p>
                  )}
                </button>
              );
            })}
          </div>
          <LoadingButton
            onClick={onSaveMfaPreference}
            loading={loading === 'mfa'}
            loadingText="Updating settings..."
          >
            Save Authentication Method
          </LoadingButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Authenticator App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totpEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-secondary">Authenticator is enabled</p>
                  <p className="text-xs text-muted-foreground">Your account uses an authenticator app for verification.</p>
                </div>
              </div>
              {!isSuperAdmin && (
                <Button variant="outline" size="sm" onClick={onDisableTotp}>
                  Disable Authenticator
                </Button>
              )}
              {isSuperAdmin && (
                <p className="text-xs text-muted-foreground">Required for Super Admin accounts</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-secondary">Add an extra layer of security</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use an authenticator app to generate verification codes.
                </p>
              </div>
              <LoadingButton
                onClick={onEnableTotp}
                loading={loading === 'totp-setup'}
                loadingText="Preparing setup..."
              >
                <Shield className="mr-2 h-4 w-4" />
                Enable Authenticator
              </LoadingButton>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmIdentityModal
        open={confirmOpen}
        onClose={onConfirmClose}
        onConfirm={onConfirm}
        totpEnabled={totpEnabled}
        loading={loading === 'confirm'}
        {...confirmConfig}
      />

      <TotpSetupModal
        open={totpModalOpen}
        onClose={onCloseTotpModal}
        setupData={totpSetupData}
        onVerify={onVerifyTotp}
        loading={loading === 'totp-verify'}
        success={totpSuccess}
      />
    </div>
  );
}
