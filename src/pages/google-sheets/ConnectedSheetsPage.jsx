import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import GoogleSheetsTabs from '@/components/google-sheets/GoogleSheetsTabs';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import {
  useGetConnectorsQuery,
  useGetConnectorDashboardQuery,
  useSyncConnectorMutation,
  useSyncAllConnectorsMutation,
  useDisableConnectorMutation,
  useEnableConnectorMutation,
  useDeleteConnectorMutation,
} from '@/store/api/apiSlice';
import { trackSyncJobs } from '@/store/syncProgressSlice';
import {
  cn,
  formatRelativeTime,
  CONNECTOR_STATUS_COLORS,
  formatStatus,
} from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        CONNECTOR_STATUS_COLORS[status] || CONNECTOR_STATUS_COLORS.disabled
      )}
    >
      {formatStatus(status)}
    </span>
  );
}

export default function ConnectedSheetsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [syncingId, setSyncingId] = useState(null);

  const {
    data,
    isLoading: sheetsLoading,
    isFetching: sheetsFetching,
    isError: sheetsError,
    error: sheetsErr,
    refetch,
  } = useGetConnectorsQuery({ limit: 100 }, { refetchOnMountOrArgChange: 60 });
  const {
    data: dashData,
    isLoading: dashLoading,
    isFetching: dashFetching,
    isError: dashError,
    error: dashErr,
    refetch: refetchDash,
  } = useGetConnectorDashboardQuery(undefined, { refetchOnMountOrArgChange: 60 });
  const [syncConnector] = useSyncConnectorMutation();
  const [syncAll, { isLoading: syncingAll }] = useSyncAllConnectorsMutation();
  const [disableConnector] = useDisableConnectorMutation();
  const [enableConnector] = useEnableConnectorMutation();
  const [deleteConnector] = useDeleteConnectorMutation();

  const sheets = data?.data || [];
  const dashboard = dashData?.data;
  const statsLoading = dashLoading || (dashFetching && !dashData);
  const tableLoading = sheetsLoading || (sheetsFetching && !data);

  const refetchAll = () => {
    refetch();
    refetchDash();
  };

  const trackFromResponse = (payload) => {
    const ids = [];
    if (payload?.syncLogId) ids.push(String(payload.syncLogId));
    if (Array.isArray(payload?.jobs)) {
      payload.jobs.forEach((j) => {
        if (j.syncLogId) ids.push(String(j.syncLogId));
      });
    }
    if (ids.length) dispatch(trackSyncJobs(ids));
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const res = await syncConnector(id).unwrap();
      trackFromResponse(res?.data || res);
      refetchAll();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      const res = await syncAll().unwrap();
      trackFromResponse(res?.data || res);
      refetchAll();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync-all failed');
    }
  };

  const handleToggleStatus = async (sheet) => {
    try {
      if (sheet.status === 'active') {
        await disableConnector(sheet._id).unwrap();
      } else {
        await enableConnector(sheet._id).unwrap();
      }
      refetchAll();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sheet connection? This cannot be undone.')) return;
    try {
      await deleteConnector(id).unwrap();
      refetchAll();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Delete failed');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      ...(ENABLE_DEPARTMENTS
        ? [{
            id: 'department',
            accessorFn: (row) => row.department?.name || '—',
            header: 'Department',
            size: 130,
          }]
        : []),
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'autoSync',
        accessorFn: (row) => (row.autoSyncEnabled ? 'yes' : 'no'),
        header: 'Auto Sync',
        size: 100,
        cell: ({ row }) =>
          row.original.autoSyncEnabled
            ? `Every ${row.original.syncIntervalMinutes || 60}m`
            : 'Off',
      },
      {
        id: 'lastSync',
        accessorFn: (row) => row.lastSyncAt || '',
        header: 'Last Sync',
        size: 140,
        cell: ({ row }) =>
          row.original.lastSyncAt
            ? formatRelativeTime(row.original.lastSyncAt)
            : 'Never',
      },
      {
        id: 'imported',
        accessorFn: (row) => row.health?.totalImported ?? 0,
        header: 'Imported Leads',
        size: 120,
        cell: ({ row }) => row.original.health?.totalImported ?? 0,
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 180,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => {
          const sheet = row.original;
          const isSyncing = syncingId === sheet._id;
          return (
            <div className="flex justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="View"
                onClick={() => navigate(`/google-sheets/${sheet._id}`)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Sync"
                disabled={isSyncing || sheet.status === 'disabled'}
                onClick={() => handleSync(sheet._id)}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Edit"
                onClick={() => navigate(`/google-sheets/${sheet._id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={sheet.status === 'active' ? 'Disable' : 'Enable'}
                onClick={() => handleToggleStatus(sheet)}
              >
                {sheet.status === 'active' ? (
                  <PowerOff className="h-3.5 w-3.5" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                title="Delete"
                onClick={() => handleDelete(sheet._id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, syncingId]
  );

  return (
    <div className="flex min-h-full flex-col">
      <Header
        title="Google Sheets"
        description="Import and sync leads from connected spreadsheets"
      />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <GoogleSheetsTabs />

        {(dashError && dashboard) || (sheetsError && data) ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>
              {dashErr?.data?.message ||
                sheetsErr?.data?.message ||
                dashErr?.error ||
                sheetsErr?.error ||
                'Failed to refresh Google Sheets data'}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={refetchAll}>
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : dashError && !dashboard ? (
            <div className="col-span-full flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-white px-6 py-8 text-center shadow-card sm:col-span-2 lg:col-span-4">
              <p className="text-sm font-medium text-foreground">Couldn’t load sheet stats</p>
              <p className="text-sm text-muted-foreground">
                {dashErr?.data?.message || dashErr?.error || 'Please try again.'}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetchDash()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <StatCard
                title="Connected Sheets"
                value={dashboard?.connectedSheets ?? 0}
                subtitle={`${dashboard?.activeSheets ?? 0} active`}
              />
              <StatCard
                title="Imported Today"
                value={dashboard?.importedToday ?? 0}
                variant="open"
              />
              <StatCard
                title="Failed Syncs Today"
                value={dashboard?.failedSyncs ?? 0}
                variant="alert"
              />
              <StatCard
                title="Last Sync"
                value={
                  dashboard?.lastSync?.completedAt
                    ? formatRelativeTime(dashboard.lastSync.completedAt)
                    : '—'
                }
                subtitle={dashboard?.lastSync?.connector?.name}
              />
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <LoadingButton
            variant="outline"
            loading={syncingAll}
            loadingText="Queuing..."
            onClick={handleSyncAll}
            disabled={tableLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Sync All
          </LoadingButton>
          <Button asChild>
            <Link to="/google-sheets/new">
              <Plus className="mr-2 h-4 w-4" /> Add Sheet
            </Link>
          </Button>
        </div>

        {sheetsError && !tableLoading && !data ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-card">
            <p className="text-sm font-medium text-foreground">Couldn’t load connected sheets</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {sheetsErr?.data?.message || sheetsErr?.error || 'Something went wrong. Please try again.'}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sheets}
            isLoading={tableLoading}
            isFiltering={sheetsFetching && !tableLoading}
            filteringMessage="Refreshing sheets…"
            sorting={sorting}
            onSortingChange={setSorting}
            emptyMessage="No sheets connected yet. Add your first Google Sheet."
            skeletonCols={6}
            maxHeight="calc(100vh - 380px)"
          />
        )}
      </div>
    </div>
  );
}
