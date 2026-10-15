import { useEffect, useRef } from 'react';
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
import { toggleSidebar, setSidebarOpen } from '@/store/uiSlice';
import { logout as logoutAction } from '@/store/authSlice';
import api from '@/lib/api';

const navSections = [
  {
    id: 'leads',
    label: 'Workspace',
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
    label: 'Manage',
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
  if (Array.isArray(user.permissionKeys)) return user.permissionKeys.includes(key);
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
  const dispatch = useDispatch();
  return <NavLink to={item.path} aria-label={item.label} title={!sidebarOpen ? item.label : undefined}
    onClick={() => { if (window.innerWidth < 768) dispatch(setSidebarOpen(false)); }}
    className={({ isActive }) => cn('desk-nav-item', isActive && 'is-active', !sidebarOpen && 'is-collapsed')}>
    {({ isActive }) => <><item.icon className="h-[19px] w-[19px] shrink-0" strokeWidth={isActive ? 2 : 1.65} />{sidebarOpen && <span className="truncate">{item.label}</span>}</>}
  </NavLink>;
}

export default function Sidebar() {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const visibleSections = navSections.map((section) => ({ ...section, items: section.items.filter((item) => hasPermission(user, item.permission)) })).filter((section) => section.items.length > 0);
  const initials = (user?.name || 'Corizo').split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const closeOnMobile = (event) => { if (!event.matches) dispatch(setSidebarOpen(false)); };
    media.addEventListener('change', closeOnMobile);
    return () => media.removeEventListener('change', closeOnMobile);
  }, [dispatch]);

  useEffect(() => {
    if (!sidebarOpen || window.matchMedia('(min-width: 768px)').matches) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector('a, button')?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') dispatch(setSidebarOpen(false));
      if (event.key !== 'Tab') return;
      const elements = drawerRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [sidebarOpen, dispatch]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* existing logout remains available when offline */ }
    api.setToken(null);
    dispatch(logoutAction());
    navigate('/login');
  };

  return <aside id="workspace-navigation" ref={drawerRef} aria-label="Workspace navigation" className={cn('desk-sidebar fixed inset-y-0 left-0 z-40 flex-col transition-[width] duration-200', sidebarOpen ? 'flex w-64' : 'hidden w-20 md:flex')}>
    <div className={cn('flex h-20 shrink-0 items-center px-5', !sidebarOpen && 'justify-center px-0')}>
      {sidebarOpen ? <div className="flex items-center gap-3"><img src="/logo.jpg" alt="Corizo" className="h-8 w-auto max-w-[128px] mix-blend-multiply dark:mix-blend-normal" /><span className="border-l border-border pl-3 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">DESK</span></div> : <img src="/favicon.jpg" alt="Corizo" className="h-9 w-9 rounded-lg object-cover" />}
      <button type="button" className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden" aria-label="Close navigation" onClick={() => dispatch(setSidebarOpen(false))}><ChevronLeft size={18} /></button>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 pb-5 scrollbar-thin" aria-label="Main">
      {visibleSections.map((section, index) => <div key={section.id} className={cn(index > 0 && 'mt-7')}>
        {sidebarOpen ? <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/75">{section.label}</p> : index > 0 && <div className="mx-auto mb-4 h-px w-6 bg-border" />}
        <div className="space-y-1">{section.items.map((item) => <NavItem key={item.path} item={item} sidebarOpen={sidebarOpen} />)}</div>
      </div>)}
    </nav>
    <div className="shrink-0 space-y-2 border-t border-border/80 p-3">
      <button type="button" className={cn('desk-sidebar-control hidden w-full md:flex', !sidebarOpen && 'justify-center px-0')} onClick={() => dispatch(toggleSidebar())} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={sidebarOpen} aria-controls="workspace-navigation" title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}><ChevronLeft className={cn('h-[18px] w-[18px] shrink-0', !sidebarOpen && 'rotate-180')} />{sidebarOpen && <span>Collapse sidebar</span>}</button>
      <div className={cn('flex items-center gap-1 rounded-xl bg-card p-1.5 ring-1 ring-border/70', !sidebarOpen && 'flex-col gap-2 py-2')}>
        <button type="button" onClick={() => navigate('/settings')} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left" aria-label="Open account settings" title={user?.name || 'Account settings'}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-primary">{initials}</span>
          {sidebarOpen && <span className="min-w-0"><span className="block truncate text-[12px] font-semibold text-foreground">{user?.name || 'Your account'}</span><span className="block truncate text-[10px] text-muted-foreground">{ROLE_LABELS[user?.role] || 'Workspace member'}</span></span>}
        </button>
        <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"><LogOut size={16} /></button>
      </div>
    </div>
  </aside>;
}
