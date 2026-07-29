import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  ContactRound,
  CalendarClock,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ClipboardList,
  Lock,
  Table2,
  BookOpen,
} from 'lucide-react';
import { cn, ROLES, ROLE_LABELS } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { toggleSidebar } from '@/store/uiSlice';
import { logout as logoutAction } from '@/store/authSlice';
import api from '@/lib/api';

const navSections = [
  {
    id: 'leads',
    label: 'Leads',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      { label: 'Leads', path: '/leads', icon: ContactRound, permission: 'leads.view' },
      { label: 'Follow-ups', path: '/follow-ups', icon: CalendarClock, permission: 'follow_ups.view' },
      { label: 'Google Sheets', path: '/google-sheets', icon: Table2, permission: 'google_sheets.view' },
      { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
    ],
  },
  {
    id: 'systems',
    label: 'Systems',
    items: [
      { label: 'Users', path: '/users', icon: Users, permission: 'users.view' },
      { label: 'Courses', path: '/courses', icon: BookOpen, permission: 'users.view' },
      // Departments hidden — restore via ENABLE_DEPARTMENTS in src/lib/features.js
      ...(ENABLE_DEPARTMENTS
        ? [{ label: 'Departments', path: '/departments', icon: Building2, permission: 'departments.view' }]
        : []),
      { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList, permission: 'audit.view' },
      { label: 'Security', path: '/security', icon: Lock, permission: 'security.view' },
      { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.view' },
    ],
  },
];

function hasPermission(user, key) {
  if (!user || !key) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (Array.isArray(user.permissionKeys) && user.permissionKeys.includes(key)) return true;
  if (Array.isArray(user.permissions)) {
    return user.permissions.some((p) => (typeof p === 'string' ? p : p.key) === key);
  }
  const legacy = {
    'dashboard.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
    'leads.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
    'follow_ups.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
    'google_sheets.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'users.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'departments.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'reports.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    'audit.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
    'security.view': [ROLES.SUPER_ADMIN],
    'settings.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  };
  return legacy[key]?.includes(user.role) || false;
}

function NavItem({ item, sidebarOpen }) {
  return (
    <NavLink
      to={item.path}
      title={!sidebarOpen ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'bg-brand-soft font-semibold text-primary shadow-sm ring-1 ring-inset ring-primary/15'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
            />
          )}
          <item.icon
            className={cn(
              'h-[18px] w-[18px] shrink-0',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}
            strokeWidth={isActive ? 2.25 : 1.75}
          />
          {sidebarOpen && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(user, item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    api.setToken(null);
    dispatch(logoutAction());
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-white text-foreground transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
        {sidebarOpen && (
          <div className="flex min-w-0 flex-col justify-center gap-0.5 px-1">
            <img
              src="/logo.jpg"
              alt="Corizo"
              className="h-8 w-auto max-w-[150px] object-contain object-left"
            />
            <p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">
              Corizo Desk
            </p>
          </div>
        )}
        {!sidebarOpen && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
            <img src="/favicon.jpg" alt="Corizo" className="h-9 w-9 object-cover" />
          </div>
        )}
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className={cn(
            'rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            !sidebarOpen && 'absolute right-2 top-[4.5rem]'
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5 scrollbar-thin" aria-label="Main">
        {visibleSections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className={cn('space-y-1', sectionIndex > 0 && (sidebarOpen ? 'mt-5' : 'mt-2'))}
          >
            {sidebarOpen ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                {section.label}
              </p>
            ) : (
              sectionIndex > 0 && (
                <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden />
              )
            )}
            {section.items.map((item) => (
              <NavItem key={item.path} item={item} sidebarOpen={sidebarOpen} />
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-2.5">
        {sidebarOpen && user && (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="mb-2 w-full rounded-xl bg-muted/70 p-3 text-left transition-colors hover:bg-muted"
          >
            <p className="truncate text-[13px] font-medium text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            {ENABLE_DEPARTMENTS && user.department && (
              <p className="truncate text-[11px] text-muted-foreground/80">{user.department.name}</p>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          {sidebarOpen && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
