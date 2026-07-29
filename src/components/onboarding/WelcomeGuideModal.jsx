import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  ContactRound,
  CalendarClock,
  Table2,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { ROLES, ROLE_LABELS } from '@/lib/utils';
import { setUser } from '@/store/authSlice';
import api from '@/lib/api';

const GUIDE_BY_ROLE = {
  [ROLES.EMPLOYEE]: {
    headline: 'Your counselor workspace',
    intro: 'Work your assigned and sheet-access leads, keep follow-ups on track, and record status updates in one place.',
    capabilities: [
      {
        icon: LayoutDashboard,
        title: 'Dashboard',
        detail: 'See today’s priorities, follow-ups, and recent activity at a glance.',
      },
      {
        icon: ContactRound,
        title: 'Leads',
        detail: 'Open leads, update status with remarks, call or email, and assign follow-ups.',
      },
      {
        icon: CalendarClock,
        title: 'Follow-ups',
        detail: 'Track due and upcoming callbacks. When time is due, log what was discussed.',
      },
      {
        icon: Settings,
        title: 'Account settings',
        detail: 'Manage your profile, password, and MFA from Settings anytime.',
      },
    ],
    steps: [
      'Start on Dashboard to see what needs attention today.',
      'Open Leads, pick a record, then use Quick Actions to update status and add a remark.',
      'Schedule the next follow-up so nothing falls through.',
    ],
  },
  [ROLES.ADMIN]: {
    headline: 'Your team operations panel',
    intro: 'Manage department leads, sync Google Sheets, coach your counselors, and keep the pipeline healthy.',
    capabilities: [
      {
        icon: ContactRound,
        title: 'Leads & follow-ups',
        detail: 'Oversee department leads, assign counselors, and monitor follow-up discipline.',
      },
      {
        icon: Table2,
        title: 'Google Sheets',
        detail: 'Connect sheets, map fields, and sync new inquiries into the CRM.',
      },
      {
        icon: Users,
        title: 'Users',
        detail: 'Create counselor accounts and control which sheets each person can access.',
      },
      {
        icon: BarChart3,
        title: 'Reports',
        detail: 'Export performance and pipeline reports for your department.',
      },
    ],
    steps: [
      'Connect or sync Google Sheets so new leads keep flowing in.',
      'Assign leads to counselors and review Status Timeline updates.',
      'Use Users to grant sheet access when you add a new counselor.',
    ],
  },
  [ROLES.SUPER_ADMIN]: {
    headline: 'Full system control',
    intro: 'Configure Corizo Desk end-to-end — people, sheets, security, and organization-wide lead operations.',
    capabilities: [
      {
        icon: Users,
        title: 'Users & access',
        detail: 'Create admins and employees, set sheet access, and unlock accounts.',
      },
      {
        icon: Table2,
        title: 'Google Sheets',
        detail: 'Own all connectors, sync modes, and import history across departments.',
      },
      {
        icon: ContactRound,
        title: 'Leads & reports',
        detail: 'View org-wide pipeline health and export audit-ready reports.',
      },
      {
        icon: Settings,
        title: 'System settings',
        detail: 'Toggle product features (like admin remarks) and harden security.',
      },
    ],
    steps: [
      'Confirm departments, courses, and user roles are set up.',
      'Connect Google Sheets and verify a successful sync.',
      'Create an admin/employee and verify their lead scope works as expected.',
    ],
  },
};

/**
 * First-login welcome guide — shown once until the user completes it.
 */
export default function WelcomeGuideModal() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsPasswordSetup = Boolean(
    user?.mustSetPasswordOnFirstLogin || user?.mustChangePassword
  );

  const guide = useMemo(() => {
    const role = user?.role || ROLES.EMPLOYEE;
    return GUIDE_BY_ROLE[role] || GUIDE_BY_ROLE[ROLES.EMPLOYEE];
  }, [user?.role]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || needsPasswordSetup) {
      setOpen(false);
      return;
    }
    setOpen(user.hasSeenWelcomeGuide !== true);
  }, [isLoading, isAuthenticated, user, needsPasswordSetup]);

  const completeGuide = async () => {
    setSaving(true);
    try {
      const res = await api.post('/settings/welcome-guide/complete');
      const next = res.data || { ...user, hasSeenWelcomeGuide: true };
      dispatch(setUser({ ...user, ...next, hasSeenWelcomeGuide: true }));
      setOpen(false);
    } catch {
      // Still dismiss locally so the user is not blocked if the API fails.
      dispatch(setUser({ ...user, hasSeenWelcomeGuide: true }));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) completeGuide(); }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0" showClose={false}>
        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background px-6 pb-5 pt-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Welcome to Corizo Desk
                </p>
                <DialogTitle className="mt-1 text-xl text-secondary">
                  {user.name ? `Hi ${user.name.split(' ')[0]}` : 'Welcome'}, {guide.headline}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Signed in as {ROLE_LABELS[user.role] || user.role}. {guide.intro}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <DialogBody className="space-y-6 px-6 py-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you can do
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {guide.capabilities.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-border/80 bg-card p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-secondary">
                      <item.icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
              How to get started
            </h3>
            <ol className="space-y-2.5">
              {guide.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="leading-snug text-secondary">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </DialogBody>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            You can revisit Settings anytime for account preferences.
          </p>
          <LoadingButton
            loading={saving}
            loadingText="Opening workspace…"
            onClick={completeGuide}
            className="min-w-[11rem]"
          >
            Got it — start working
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
