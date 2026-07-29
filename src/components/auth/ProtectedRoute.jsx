import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES } from '@/lib/utils';

/** Role fallback when permissionKeys are missing (pre-seed / stale session). */
const PERMISSION_ROLE_FALLBACK = {
  'dashboard.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  'leads.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  'leads.delete': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'follow_ups.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  'google_sheets.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.add': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.edit': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.delete': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.sync': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.sync_all': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.preview': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.import': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.history': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.templates': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.settings': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'google_sheets.full_replace': [ROLES.SUPER_ADMIN],
  'users.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'departments.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'reports.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  'audit.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  'security.view': [ROLES.SUPER_ADMIN],
  'settings.view': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE],
  'settings.system': [ROLES.SUPER_ADMIN],
};

function userHasPermission(user, permission) {
  if (!user || !permission) return false;

  // Super Admin always has full access
  if (user.role === ROLES.SUPER_ADMIN) return true;

  if (Array.isArray(user.permissionKeys) && user.permissionKeys.length > 0) {
    return user.permissionKeys.includes(permission);
  }

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.some((p) => (typeof p === 'string' ? p : p?.key) === permission);
  }

  // Stale session without permission payload — fall back by role
  return PERMISSION_ROLE_FALLBACK[permission]?.includes(user.role) || false;
}

export { userHasPermission, PERMISSION_ROLE_FALLBACK };

export default function ProtectedRoute({ children, roles, permission, permissions }) {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const needsPasswordSetup = user?.mustSetPasswordOnFirstLogin || user?.mustChangePassword;
  if (needsPasswordSetup && location.pathname !== '/setup-password') {
    return <Navigate to="/setup-password" replace />;
  }

  const requiredPermissions = [
    ...(permission ? [permission] : []),
    ...(Array.isArray(permissions) ? permissions : []),
  ];

  if (requiredPermissions.length) {
    const allowed = requiredPermissions.some((key) => userHasPermission(user, key));
    if (!allowed) {
      if (roles?.includes(user?.role)) {
        return children;
      }
      return <Navigate to="/dashboard" replace />;
    }
  } else if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RoleRoute({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export function PermissionRoute({ permission, permissions, roles, children }) {
  return (
    <ProtectedRoute
      permission={permission}
      permissions={permissions}
      roles={roles || [ROLES.SUPER_ADMIN, ROLES.ADMIN]}
    >
      {children}
    </ProtectedRoute>
  );
}

export { ROLES };
