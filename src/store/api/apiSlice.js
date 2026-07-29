import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise = null;

const AUTH_NO_REFRESH = [
  '/auth/refresh',
  '/auth/employee/login',
  '/auth/super-admin/login',
  '/auth/otp/',
  '/auth/employee/verify-totp',
  '/auth/super-admin/verify-totp',
  '/auth/logout',
];

const shouldSkipRefresh = (url = '') =>
  AUTH_NO_REFRESH.some((path) => url.includes(path));

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const url = typeof args === 'string' ? args : args?.url || '';
    if (shouldSkipRefresh(url)) {
      return result;
    }
    if (!refreshPromise) {
      refreshPromise = baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions)
        .finally(() => {
          refreshPromise = null;
        });
    }
    const refreshResult = await refreshPromise;
    if (refreshResult.data?.data?.accessToken) {
      localStorage.setItem('accessToken', refreshResult.data.data.accessToken);
      result = await baseQuery(args, api, extraOptions);
    } else if (refreshResult.data?.accessToken) {
      localStorage.setItem('accessToken', refreshResult.data.accessToken);
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Lead', 'FollowUp', 'User', 'Department', 'Course', 'Dashboard', 'Activity', 'Settings', 'AppSettings', 'Connector', 'ConnectorSyncLog', 'MappingTemplate'],
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/dashboard/dashboard',
      providesTags: ['Dashboard'],
      keepUnusedDataFor: 0,
    }),
    getLeads: builder.query({
      query: (params) => ({ url: '/leads', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Lead', id: _id })), { type: 'Lead', id: 'LIST' }]
          : [{ type: 'Lead', id: 'LIST' }],
    }),
    getLead: builder.query({
      query: (id) => `/leads/${id}`,
      providesTags: (result, error, id) => [{ type: 'Lead', id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }, 'Dashboard', 'FollowUp'],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Lead', id }, 'Dashboard', 'FollowUp'],
    }),
    softDeleteLead: builder.mutation({
      query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Lead', id }, { type: 'Lead', id: 'LIST' }, 'Dashboard', 'FollowUp'],
    }),
    bulkSoftDeleteLeads: builder.mutation({
      query: (ids) => ({ url: '/leads/bulk-delete', method: 'POST', body: { ids } }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }, 'Dashboard', 'FollowUp'],
    }),
    softDeleteAllLeads: builder.mutation({
      query: (body) => ({ url: '/leads/delete-all', method: 'POST', body }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }, 'Dashboard', 'FollowUp'],
    }),
    getFollowUps: builder.query({
      query: (params) => ({ url: '/follow-ups', params }),
      providesTags: ['FollowUp'],
    }),
    getFollowUpSummary: builder.query({
      query: () => '/follow-ups/summary',
      providesTags: ['FollowUp'],
    }),
    getFollowUpDashboard: builder.query({
      query: () => '/leads/follow-ups/dashboard',
      providesTags: ['FollowUp', 'Dashboard'],
    }),
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    getDepartments: builder.query({
      query: () => '/users/departments',
      providesTags: ['Department'],
    }),
    getCourses: builder.query({
      query: (params) => ({ url: '/courses', params }),
      providesTags: ['Course'],
    }),
    getActivityLogs: builder.query({
      query: (params) => ({ url: '/dashboard/activity-logs', params }),
      providesTags: ['Activity'],
    }),
    globalSearch: builder.query({
      query: (q) => ({ url: '/dashboard/search', params: { q } }),
    }),
    getAccountSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    getAppSettings: builder.query({
      query: () => '/settings/app',
      providesTags: ['AppSettings'],
    }),
    updateAppSettings: builder.mutation({
      query: (body) => ({ url: '/settings/app', method: 'PATCH', body }),
      invalidatesTags: ['AppSettings', 'Lead'],
    }),
    getAccountActivity: builder.query({
      query: () => '/settings/activity',
      providesTags: ['Settings'],
    }),
    getActiveSessions: builder.query({
      query: () => '/settings/sessions',
      providesTags: ['Settings'],
    }),
    getSecurityDashboard: builder.query({
      query: () => '/settings/security',
      providesTags: ['Settings'],
    }),
    getExportConfig: builder.query({
      query: () => '/exports/config',
    }),
    getConnectors: builder.query({
      query: (params) => ({ url: '/connectors', params: { type: 'google_sheets', ...params } }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Connector', id: _id })), { type: 'Connector', id: 'LIST' }]
          : [{ type: 'Connector', id: 'LIST' }],
    }),
    getConnectorDashboard: builder.query({
      query: () => ({ url: '/connectors/dashboard', params: { type: 'google_sheets' } }),
      providesTags: ['Connector', 'ConnectorSyncLog'],
    }),
    getConnector: builder.query({
      query: (id) => `/connectors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Connector', id }],
    }),
    getConnectorHealth: builder.query({
      query: (id) => `/connectors/${id}/health`,
      providesTags: (result, error, id) => [{ type: 'Connector', id: `${id}-health` }],
    }),
    getConnectorSyncLogs: builder.query({
      query: (params) => ({ url: '/connectors/sync-logs', params: { type: 'google_sheets', ...params } }),
      providesTags: ['ConnectorSyncLog'],
    }),
    getSyncProgress: builder.query({
      query: () => ({ url: '/connectors/sync-progress' }),
      providesTags: ['ConnectorSyncLog'],
    }),
    getMappingTemplates: builder.query({
      query: () => ({ url: '/connectors/templates', params: { type: 'google_sheets' } }),
      providesTags: ['MappingTemplate'],
    }),
    getGoogleSheetsSetup: builder.query({
      query: () => '/connectors/setup',
    }),
    createConnector: builder.mutation({
      query: (body) => ({ url: '/connectors', method: 'POST', body: { type: 'google_sheets', ...body } }),
      invalidatesTags: [{ type: 'Connector', id: 'LIST' }, 'ConnectorSyncLog', 'MappingTemplate'],
    }),
    updateConnector: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/connectors/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Connector', id }, { type: 'Connector', id: 'LIST' }],
    }),
    disableConnector: builder.mutation({
      query: (id) => ({ url: `/connectors/${id}/disable`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'Connector', id }, { type: 'Connector', id: 'LIST' }],
    }),
    enableConnector: builder.mutation({
      query: (id) => ({ url: `/connectors/${id}/enable`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'Connector', id }, { type: 'Connector', id: 'LIST' }],
    }),
    deleteConnector: builder.mutation({
      query: (id) => ({ url: `/connectors/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Connector', id: 'LIST' }],
    }),
    syncConnector: builder.mutation({
      query: (id) => ({ url: `/connectors/${id}/sync`, method: 'POST', body: {} }),
      invalidatesTags: (result, error, id) => [
        { type: 'Connector', id },
        'ConnectorSyncLog',
        'Connector',
      ],
    }),
    syncAllConnectors: builder.mutation({
      query: () => ({ url: '/connectors/sync-all', method: 'POST', params: { type: 'google_sheets' } }),
      invalidatesTags: ['Connector', 'ConnectorSyncLog'],
    }),
    fetchConnectorHeaders: builder.mutation({
      query: (body) => ({ url: '/connectors/headers', method: 'POST', body }),
    }),
    previewConnectorImport: builder.mutation({
      query: (id) => ({ url: `/connectors/${id}/preview`, method: 'POST', body: {} }),
    }),
    confirmConnectorImport: builder.mutation({
      query: ({ id, previewId }) => ({ url: `/connectors/${id}/import`, method: 'POST', body: { previewId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Connector', id }, 'ConnectorSyncLog', 'Connector'],
    }),
    createMappingTemplate: builder.mutation({
      query: (body) => ({ url: '/connectors/templates', method: 'POST', body: { connectorType: 'google_sheets', ...body } }),
      invalidatesTags: ['MappingTemplate'],
    }),
    deleteMappingTemplate: builder.mutation({
      query: (id) => ({ url: `/connectors/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MappingTemplate'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useSoftDeleteLeadMutation,
  useBulkSoftDeleteLeadsMutation,
  useSoftDeleteAllLeadsMutation,
  useGetFollowUpsQuery,
  useGetFollowUpSummaryQuery,
  useGetFollowUpDashboardQuery,
  useGetUsersQuery,
  useGetDepartmentsQuery,
  useGetCoursesQuery,
  useGetActivityLogsQuery,
  useGlobalSearchQuery,
  useGetAccountSettingsQuery,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
  useGetAccountActivityQuery,
  useGetActiveSessionsQuery,
  useGetSecurityDashboardQuery,
  useGetExportConfigQuery,
  useGetConnectorsQuery,
  useGetConnectorDashboardQuery,
  useGetConnectorQuery,
  useGetConnectorHealthQuery,
  useGetConnectorSyncLogsQuery,
  useGetSyncProgressQuery,
  useGetMappingTemplatesQuery,
  useGetGoogleSheetsSetupQuery,
  useCreateConnectorMutation,
  useUpdateConnectorMutation,
  useDisableConnectorMutation,
  useEnableConnectorMutation,
  useDeleteConnectorMutation,
  useSyncConnectorMutation,
  useSyncAllConnectorsMutation,
  useFetchConnectorHeadersMutation,
  usePreviewConnectorImportMutation,
  useConfirmConnectorImportMutation,
  useCreateMappingTemplateMutation,
  useDeleteMappingTemplateMutation,
} = apiSlice;
