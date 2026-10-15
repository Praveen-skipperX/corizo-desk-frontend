import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute, { RoleRoute, PermissionRoute, ROLES } from './components/auth/ProtectedRoute';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SetupPasswordPage = lazy(() => import('./pages/auth/SetupPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const LeadsPage = lazy(() => import('./pages/leads/LeadsPage'));
const CreateLeadPage = lazy(() => import('./pages/leads/CreateLeadPage'));
const LeadDetailPage = lazy(() => import('./pages/leads/LeadDetailPage'));
const FollowUpsPage = lazy(() => import('./pages/follow-ups/FollowUpsPage'));
const ConnectedSheetsPage = lazy(() => import('./pages/google-sheets/ConnectedSheetsPage'));
const AddSheetPage = lazy(() => import('./pages/google-sheets/AddSheetPage'));
const SyncHistoryPage = lazy(() => import('./pages/google-sheets/SyncHistoryPage'));
const SheetSettingsPage = lazy(() => import('./pages/google-sheets/SheetSettingsPage'));
const SheetDetailPage = lazy(() => import('./pages/google-sheets/SheetDetailPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const CoursesPage = lazy(() => import('./pages/courses/CoursesPage'));
// Departments page — restore via ENABLE_DEPARTMENTS in src/lib/features.js
const DepartmentsPage = lazy(() => import('./pages/departments/DepartmentsPage'));
import { ENABLE_DEPARTMENTS } from './lib/features';
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage'));
const SecurityPage = lazy(() => import('./pages/security/SecurityPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const SystemSettingsPage = lazy(() => import('./pages/settings/SystemSettingsPage'));
import api from './lib/api';
import { setUser, setLoading, logout } from './store/authSlice';
import { setTheme } from './store/uiSlice';
import { TooltipProvider } from './components/ui/tooltip';
import { ToastProvider } from './components/ui/toast';

function LegacyInquiryRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/leads/${id}` : '/leads'} replace />;
}

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(theme));

    const initAuth = async () => {
      // Prefer restoring via refresh cookie when access token is missing or stale.
      // Stay signed in on this device until explicit logout.
      const token = api.getToken();
      if (!token) {
        const refreshed = await api.refreshToken();
        if (!refreshed) {
          dispatch(setLoading(false));
          return;
        }
      }

      const loadMe = async () => {
        const res = await api.get('/auth/me');
        dispatch(setUser(res.data));
      };

      try {
        await loadMe();
      } catch {
        // Access token may be expired/invalid while refresh cookie is still valid
        // (common on page refresh after JWT access expiry or Redis restart).
        const refreshed = await api.refreshToken();
        if (refreshed) {
          try {
            await loadMe();
            return;
          } catch {
            /* fall through to logout */
          }
        }
        api.setToken(null);
        dispatch(logout());
      }
    };
    initAuth();
  }, [dispatch]);

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-password" element={<ProtectedRoute><SetupPasswordPage /></ProtectedRoute>} />
      <Route path="/super-admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/super-admin/*" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/new" element={<CreateLeadPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="inquiries" element={<Navigate to="/leads" replace />} />
        <Route path="inquiries/new" element={<Navigate to="/leads/new" replace />} />
        <Route path="inquiries/:id" element={<LegacyInquiryRedirect />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="google-sheets" element={<PermissionRoute permission="google_sheets.view" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><ConnectedSheetsPage /></PermissionRoute>} />
        <Route path="google-sheets/new" element={<PermissionRoute permission="google_sheets.add" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AddSheetPage /></PermissionRoute>} />
        <Route path="google-sheets/history" element={<PermissionRoute permission="google_sheets.history" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><SyncHistoryPage /></PermissionRoute>} />
        <Route path="google-sheets/settings" element={<PermissionRoute permission="google_sheets.settings" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><SheetSettingsPage /></PermissionRoute>} />
        <Route path="google-sheets/:id/edit" element={<PermissionRoute permission="google_sheets.edit" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AddSheetPage /></PermissionRoute>} />
        <Route path="google-sheets/:id" element={<PermissionRoute permission="google_sheets.view" roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><SheetDetailPage /></PermissionRoute>} />
        <Route path="users" element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><UsersPage /></RoleRoute>} />
        <Route path="courses" element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><CoursesPage /></RoleRoute>} />
        {ENABLE_DEPARTMENTS && (
          <Route path="departments" element={<RoleRoute roles={[ROLES.SUPER_ADMIN]}><DepartmentsPage /></RoleRoute>} />
        )}
        <Route path="reports" element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><ReportsPage /></RoleRoute>} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="security" element={<RoleRoute roles={[ROLES.SUPER_ADMIN]}><SecurityPage /></RoleRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/system" element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><SystemSettingsPage /></RoleRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <TooltipProvider delayDuration={200}>
        <ToastProvider>
          <BrowserRouter>
            <AuthInitializer>
              <Suspense fallback={<div role="status" className="p-6 text-sm text-muted-foreground">Loading page...</div>}><AppRoutes /></Suspense>
            </AuthInitializer>
          </BrowserRouter>
        </ToastProvider>
      </TooltipProvider>
    </Provider>
  );
}
