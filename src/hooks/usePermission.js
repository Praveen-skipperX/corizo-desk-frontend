import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { userHasPermission } from '@/components/auth/ProtectedRoute';

/**
 * Check if the current user has a permission key.
 * Super Admin always returns true. Falls back by role if keys are missing.
 */
export function usePermission(permissionKey) {
  const user = useSelector((state) => state.auth.user);

  return useMemo(() => userHasPermission(user, permissionKey), [user, permissionKey]);
}

export function usePermissions() {
  const user = useSelector((state) => state.auth.user);

  return useMemo(() => {
    if (Array.isArray(user?.permissionKeys) && user.permissionKeys.length) {
      return user.permissionKeys;
    }
    if (Array.isArray(user?.permissions) && user.permissions.length) {
      return user.permissions.map((p) => (typeof p === 'string' ? p : p.key));
    }
    return [];
  }, [user]);
}

export function useHasAnyPermission(...keys) {
  const user = useSelector((state) => state.auth.user);
  return useMemo(
    () => keys.some((k) => userHasPermission(user, k)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, keys.join(',')]
  );
}

export default usePermission;
