import { useGetAppSettingsQuery } from '@/store/api/apiSlice';

/**
 * App-wide feature flags from system settings.
 * adminRemarksEnabled defaults to false until an admin turns it on.
 */
export function useAppSettings() {
  const { data, isLoading, isFetching, refetch } = useGetAppSettingsQuery();
  const settings = data?.data || {};

  return {
    adminRemarksEnabled: Boolean(settings.adminRemarksEnabled),
    isLoading,
    isFetching,
    refetch,
    updatedAt: settings.updatedAt,
  };
}
