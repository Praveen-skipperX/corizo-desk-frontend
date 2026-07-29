import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute, { RoleRoute, PermissionRoute, ROLES } from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SetupPasswordPage from './pages/auth/SetupPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LeadsPage from './pages/leads/LeadsPage';
import CreateLeadPage from './pages/leads/CreateLeadPage';
import LeadDetailPage from './pages/leads/LeadDetailPage';
import FollowUpsPage from './pages/follow-ups/FollowUpsPage';
import ConnectedSheetsPage from './pages/google-sheets/ConnectedSheetsPage';
import AddSheetPage from './pages/google-sheets/AddSheetPage';
import SyncHistoryPage from './pages/google-sheets/SyncHistoryPage';
import SheetSettingsPage from './pages/google-sheets/SheetSettingsPage';
import SheetDetailPage from './pages/google-sheets/SheetDetailPage';
import UsersPage from './pages/users/UsersPage';
import CoursesPage from './pages/courses/CoursesPage';
// Departments page — restore via ENABLE_DEPARTMENTS in src/lib/features.js
import DepartmentsPage from './pages/departments/DepartmentsPage';
import { ENABLE_DEPARTMENTS } from './lib/features';
import ReportsPage from './pages/reports/ReportsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import SecurityPage from './pages/security/SecurityPage';
import SettingsPage from './pages/settings/SettingsPage';
import SystemSettingsPage from './pages/settings/SystemSettingsPage';
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
      let token = api.getToken();
      if (!token) {
        const refreshed = await api.refreshToken();
        if (!refreshed) {
          dispatch(setLoading(false));
          return;
        }
        token = api.getToken();
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
              <AppRoutes />
            </AuthInitializer>
          </BrowserRouter>
        </ToastProvider>
      </TooltipProvider>
    </Provider>
  );
}
