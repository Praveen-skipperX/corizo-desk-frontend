import { ROLES } from '@/lib/utils';

export function getLeadCreatorId(lead) {
  return lead?.createdBy?._id?.toString() || lead?.createdBy?.toString() || null;
}

export function getUserId(user) {
  return user?._id?.toString() || user?.id?.toString() || null;
}

/** Admins may add remarks only on leads they personally created. */
export function canAddCreatorRemark(user, lead) {
  if (!user || !lead) return false;

  if (user.role === ROLES.EMPLOYEE) return true;

  if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    return getLeadCreatorId(lead) === getUserId(user);
  }

  return false;
}

/** Admin remarks — also requires the system feature flag to be enabled. */
export function canAddAdminRemark(user, { adminRemarksEnabled = false } = {}) {
  if (!adminRemarksEnabled) return false;
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
}