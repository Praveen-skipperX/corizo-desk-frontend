import { useState, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';

import { User, Shield, Activity, Monitor, Bell, LifeBuoy, Mail, Phone } from 'lucide-react';

import Header from '@/components/layout/Header';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import LoadingButton from '@/components/ui/loading-button';

import { Input } from '@/components/ui/input';

import PasswordInput from '@/components/ui/password-input';

import OtpInput from '@/components/ui/OtpInput';

import ConfirmIdentityModal from '@/components/settings/ConfirmIdentityModal';

import SecuritySettingsPanel from '@/components/settings/SecuritySettingsPanel';

import { cn, ROLES, formatDateTime } from '@/lib/utils';

import api from '@/lib/api';

import { setUser } from '@/store/authSlice';

import {

  useGetAccountSettingsQuery,

  useGetAccountActivityQuery,

  useGetActiveSessionsQuery,

  useGetSecurityDashboardQuery,

} from '@/store/api/apiSlice';



const TABS = [

  { id: 'account', label: 'Profile', icon: User },

  { id: 'security', label: 'Security', icon: Shield },

  { id: 'notifications', label: 'Notifications', icon: Bell },

  { id: 'activity', label: 'Activity', icon: Activity },

  { id: 'sessions', label: 'Sessions', icon: Monitor },

  { id: 'support', label: 'Support', icon: LifeBuoy },

];



const CONFIRM_DESCRIPTIONS = {

  'email-request': 'Please confirm your identity before changing your email address.',

  'mfa-preference': 'Please confirm your identity before changing authentication settings.',

  'totp-setup': 'Please confirm your identity to set up an authenticator app.',

  'totp-disable': 'Please confirm your identity before disabling the authenticator app.',

  'revoke-sessions': 'Please confirm your identity before signing out other devices.',

  notifications: 'Please confirm your identity before saving notification preferences.',

};



export default function UserSettingsPage() {

  const { user } = useSelector((state) => state.auth);

  const [tab, setTab] = useState('account');

  const dispatch = useDispatch();

  const { data: settingsData, refetch: refetchSettings } = useGetAccountSettingsQuery();

  const { data: activityData } = useGetAccountActivityQuery(undefined, { skip: tab !== 'activity' });

  const { data: sessionsData, refetch: refetchSessions } = useGetActiveSessionsQuery(undefined, { skip: tab !== 'sessions' });

  const { data: securityData, refetch: refetchSecurity } = useGetSecurityDashboardQuery(undefined, { skip: tab !== 'security' });



  const profile = settingsData?.data?.profile;

  const security = settingsData?.data?.security;



  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [emailForm, setEmailForm] = useState({ newEmail: '' });

  const [emailOtp, setEmailOtp] = useState('');

  const [emailStep, setEmailStep] = useState('idle');

  const [mfaPreference, setMfaPreference] = useState('otp');

  const [notifications, setNotifications] = useState({ email: true, followUp: true, assignment: true, security: true });

  const [loading, setLoading] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });



  const [confirmOpen, setConfirmOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  const [totpModalOpen, setTotpModalOpen] = useState(false);

  const [totpSetupData, setTotpSetupData] = useState(null);

  const [totpSuccess, setTotpSuccess] = useState(false);



  const showMsg = (type, text) => {

    setMessage({ type, text });

    setTimeout(() => setMessage({ type: '', text: '' }), 4000);

  };



  useEffect(() => {

    if (profile) {

      setProfileForm({

        name: profile.name || '',

        phone: profile.phone || '',

        avatar: profile.avatar || '',

      });

      setMfaPreference(security?.mfaPreference || 'otp');

      if (settingsData?.data?.notifications) {

        setNotifications(settingsData.data.notifications);

      }

    }

  }, [profile, security?.mfaPreference, settingsData?.data?.notifications]);



  const openConfirm = (action) => {

    setConfirmAction({ action });

    setConfirmOpen(true);

  };



  const handleConfirm = async (credentials) => {

    if (!confirmAction) return;

    setLoading('confirm');



    try {

      switch (confirmAction.action) {

        case 'email-request':

          await api.post('/settings/email/request', { newEmail: emailForm.newEmail, ...credentials });

          setEmailStep('verify');

          showMsg('success', 'Verification code sent to new email');

          setConfirmOpen(false);

          break;

        case 'mfa-preference':

          await api.patch('/settings/mfa/preference', { mfaPreference, ...credentials });

          showMsg('success', 'Authentication method updated');

          refetchSettings();

          refetchSecurity();

          setConfirmOpen(false);

          break;

        case 'totp-setup': {

          const res = await api.post('/settings/mfa/totp/setup', credentials);

          setTotpSetupData(res.data);

          setTotpModalOpen(true);

          setConfirmOpen(false);

          break;

        }

        case 'totp-disable':

          await api.post('/settings/mfa/totp/disable', credentials);

          showMsg('success', 'Authenticator disabled');

          refetchSettings();

          refetchSecurity();

          setConfirmOpen(false);

          break;

        case 'revoke-sessions':

          await api.delete('/settings/sessions/others', { data: credentials });

          refetchSessions();

          showMsg('success', 'Other sessions terminated');

          setConfirmOpen(false);

          break;

        case 'notifications':

          await api.patch('/settings/notifications', notifications);

          showMsg('success', 'Notification preferences saved');

          refetchSettings();

          setConfirmOpen(false);

          break;

        default:

          break;

      }

    } catch (err) {

      throw err;

    } finally {

      setLoading('');

    }

  };



  const saveProfile = async () => {

    setLoading('profile');

    try {

      const res = await api.patch('/settings/profile', profileForm);

      dispatch(setUser(res.data?.data || res.data));

      showMsg('success', 'Profile updated');

      refetchSettings();

    } catch (err) {

      showMsg('error', err.message || 'Failed to update profile');

    } finally {

      setLoading('');

    }

  };



  const savePassword = async () => {

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {

      showMsg('error', 'Passwords do not match');

      return;

    }

    setLoading('password');

    try {

      await api.post('/settings/change-password', {

        currentPassword: passwordForm.currentPassword,

        newPassword: passwordForm.newPassword,

        password: passwordForm.currentPassword,

      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      showMsg('success', 'Password updated');

    } catch (err) {

      showMsg('error', err.message || 'Failed to change password');

    } finally {

      setLoading('');

    }

  };



  const verifyEmailChange = async () => {

    setLoading('email-verify');

    try {

      const res = await api.post('/settings/email/verify', { otp: emailOtp });

      dispatch(setUser(res.data?.data || res.data));

      setEmailStep('idle');

      setEmailForm({ newEmail: '' });

      setEmailOtp('');

      showMsg('success', 'Email updated');

      refetchSettings();

    } catch (err) {

      showMsg('error', err.message || 'Invalid verification code');

    } finally {

      setLoading('');

    }

  };



  const verifyTotpSetup = async (totpCode) => {

    setLoading('totp-verify');

    try {

      await api.post('/settings/mfa/totp/verify', { totpCode });

      setTotpSuccess(true);

      refetchSettings();

      refetchSecurity();

    } catch (err) {

      showMsg('error', err.message || 'Invalid code');

    } finally {

      setLoading('');

    }

  };



  const closeTotpModal = () => {

    setTotpModalOpen(false);

    setTotpSetupData(null);

    setTotpSuccess(false);

  };



  const revokeSession = async (sessionId) => {

    setLoading(`revoke-${sessionId}`);

    try {

      await api.delete(`/settings/sessions/${sessionId}`);

      refetchSessions();

      showMsg('success', 'Session terminated');

    } catch (err) {

      showMsg('error', err.message || 'Failed to revoke session');

    } finally {

      setLoading('');

    }

  };



  const activities = activityData?.data || [];

  const sessions = sessionsData?.data || [];

  const secDash = securityData?.data;



  return (

    <div>

      <Header title="Account Settings" description="Manage your profile, security, notifications, and preferences" />



      <div className="p-4 sm:p-6">

        {message.text && (

          <div className={cn(

            'mb-4 rounded-lg px-4 py-2 text-sm',

            message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'

          )}>

            {message.text}

          </div>

        )}



        <div className="mb-6 flex flex-wrap gap-2">

          {TABS.map((t) => (

            <button

              key={t.id}

              type="button"

              onClick={() => setTab(t.id)}

              className={cn(

                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',

                tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'

              )}

            >

              <t.icon className="h-4 w-4" />

              {t.label}

            </button>

          ))}

          {[ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(profile?.role) && (

            <Link to="/settings/system" className="ml-auto flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">

              System Settings

            </Link>

          )}

        </div>



        {tab === 'account' && (

          <div className="grid gap-6 lg:grid-cols-2">

            <Card>

              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>

              <CardContent className="space-y-4">

                <div>

                  <label className="mb-1 block text-sm font-medium">Name</label>

                  <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">Phone</label>

                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">Avatar URL</label>

                  <Input value={profileForm.avatar} onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} placeholder="https://..." />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">Email</label>

                  <Input value={profile?.email || ''} disabled />

                </div>

                <LoadingButton onClick={saveProfile} loading={loading === 'profile'} loadingText="Updating profile...">

                  Save Profile

                </LoadingButton>

              </CardContent>

            </Card>



            <Card>

              <CardHeader><CardTitle>Change Email</CardTitle></CardHeader>

              <CardContent className="space-y-4">

                {emailStep === 'idle' ? (

                  <>

                    <Input placeholder="New email address" value={emailForm.newEmail} onChange={(e) => setEmailForm({ newEmail: e.target.value })} />

                    <LoadingButton onClick={() => openConfirm('email-request')} disabled={!emailForm.newEmail} loadingText="Sending verification...">

                      Send Verification Code

                    </LoadingButton>

                  </>

                ) : (

                  <>

                    <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {emailForm.newEmail}</p>

                    <OtpInput value={emailOtp} onChange={setEmailOtp} />

                    <LoadingButton onClick={verifyEmailChange} loading={loading === 'email-verify'} loadingText="Updating email..." disabled={emailOtp.length !== 6}>

                      Verify & Update Email

                    </LoadingButton>

                  </>

                )}

              </CardContent>

            </Card>



            <Card className="lg:col-span-2">

              <CardHeader><CardTitle>Password Management</CardTitle></CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-3">

                <PasswordInput placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />

                <PasswordInput placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />

                <PasswordInput placeholder="Confirm password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />

                <LoadingButton className="sm:col-span-3 sm:w-auto" onClick={savePassword} loading={loading === 'password'} loadingText="Updating password...">

                  Change Password

                </LoadingButton>

              </CardContent>

            </Card>

          </div>

        )}



        {tab === 'security' && (

          <SecuritySettingsPanel

            security={security}

            secDash={secDash}

            mfaPreference={mfaPreference}

            onMfaPreferenceChange={setMfaPreference}

            onSaveMfaPreference={() => openConfirm('mfa-preference')}

            onEnableTotp={() => openConfirm('totp-setup')}

            onVerifyTotp={verifyTotpSetup}

            onDisableTotp={() => openConfirm('totp-disable')}

            totpSetupData={totpSetupData}

            totpModalOpen={totpModalOpen}

            totpSuccess={totpSuccess}

            onCloseTotpModal={closeTotpModal}

            confirmOpen={confirmOpen}

            confirmConfig={{ description: CONFIRM_DESCRIPTIONS[confirmAction?.action] }}

            onConfirmClose={() => setConfirmOpen(false)}

            onConfirm={handleConfirm}

            loading={loading}

            isSuperAdmin={user?.role === ROLES.SUPER_ADMIN}

          />

        )}



        {tab === 'notifications' && (

          <Card>

            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>

            <CardContent className="space-y-4">

              {[

                { key: 'email', label: 'Email Notifications', desc: 'General email alerts and updates' },

                { key: 'followUp', label: 'Follow-up Notifications', desc: 'Reminders for scheduled follow-ups' },

                { key: 'assignment', label: 'Assignment Notifications', desc: 'When leads are assigned to you' },

                { key: 'security', label: 'Security Alerts', desc: 'Login alerts and account security events' },

              ].map((item) => (

                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-lg border p-4">

                  <div>

                    <p className="font-medium">{item.label}</p>

                    <p className="text-xs text-muted-foreground">{item.desc}</p>

                  </div>

                  <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} className="h-4 w-4" />

                </label>

              ))}

              <LoadingButton onClick={() => openConfirm('notifications')} loading={loading === 'confirm' && confirmAction?.action === 'notifications'} loadingText="Updating settings...">

                Save Preferences

              </LoadingButton>

            </CardContent>

          </Card>

        )}



        {tab === 'activity' && (

          <Card>

            <CardHeader><CardTitle>Account Activity</CardTitle></CardHeader>

            <CardContent>

              <div className="space-y-2">

                {activities.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}

                {activities.map((a) => (

                  <div key={a._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">

                    <div>

                      <span className={cn('font-medium', a.success ? 'text-emerald-600' : 'text-red-600')}>

                        {a.success ? 'Successful login' : 'Failed login attempt'}

                      </span>

                      <span className="mx-2 text-muted-foreground">via {a.method?.toUpperCase()}</span>

                    </div>

                    <div className="text-xs text-muted-foreground">

                      {a.ipAddress && <span className="mr-3">IP: {a.ipAddress}</span>}

                      {formatDateTime(a.createdAt)}

                    </div>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        )}



        {tab === 'sessions' && (

          <Card>

            <CardHeader className="flex flex-row items-center justify-between">

              <CardTitle>Active Sessions</CardTitle>

              <LoadingButton size="sm" variant="outline" onClick={() => openConfirm('revoke-sessions')} loading={loading === 'confirm' && confirmAction?.action === 'revoke-sessions'} loadingText="Signing out devices...">

                Logout Other Devices

              </LoadingButton>

            </CardHeader>

            <CardContent className="space-y-2">

              {sessions.map((s) => (

                <div key={s.sessionId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">

                  <div>

                    <p className="font-medium">{s.device?.userAgent?.slice(0, 60) || 'Unknown device'}</p>

                    <p className="text-xs text-muted-foreground">IP: {s.ip || '—'} · {formatDateTime(s.createdAt)}</p>

                  </div>

                  <div className="flex items-center gap-2">

                    {s.isCurrent && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Current</span>}

                    {!s.isCurrent && (

                      <LoadingButton size="sm" variant="ghost" onClick={() => revokeSession(s.sessionId)} loading={loading === `revoke-${s.sessionId}`} loadingText="Terminating...">

                        Terminate

                      </LoadingButton>

                    )}

                  </div>

                </div>

              ))}

            </CardContent>

          </Card>

        )}



        {tab === 'support' && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary" />
                Developer Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-white p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Corizo Desk is built and maintained by{' '}
                  <strong className="text-secondary">Abbas Haider</strong>, developer for Corizo —
                  managing the apps, website, and all technical work.
                  If something breaks, behaves oddly, or needs a change, reach out directly.
                </p>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  Pro tip: describing what you clicked right before the issue helps fix it faster than
                  &quot;it&apos;s not working.&quot;
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-xl border-2 border-violet-200 bg-violet-50 p-4">
                  <User className="h-5 w-5 text-violet-700" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Developer</span>
                  <span className="text-sm font-medium text-violet-900">Abbas Haider</span>
                </div>

                <a
                  href="mailto:abbashaider14@proton.me"
                  className="flex flex-col gap-2 rounded-xl border-2 border-primary/25 bg-primary/5 p-4 transition-colors hover:border-primary hover:bg-primary/10"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Email</span>
                  <span className="text-sm font-medium text-primary">abbashaider14@proton.me</span>
                </a>

                <a
                  href="tel:9517771770"
                  className="flex flex-col gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 transition-colors hover:border-emerald-400 hover:bg-emerald-100"
                >
                  <Phone className="h-5 w-5 text-emerald-700" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Mobile</span>
                  <span className="text-sm font-medium text-emerald-800">9517771770</span>
                </a>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Developed &amp; maintained by Abbas Haider · Corizo apps, website &amp; tech.
              </p>
            </CardContent>
          </Card>
        )}



        {tab !== 'security' && (

          <ConfirmIdentityModal

            open={confirmOpen}

            onClose={() => setConfirmOpen(false)}

            onConfirm={handleConfirm}

            totpEnabled={security?.totpEnabled}

            loading={loading === 'confirm'}

            description={CONFIRM_DESCRIPTIONS[confirmAction?.action]}

          />

        )}

      </div>

    </div>

  );

}


