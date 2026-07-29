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

  const { data, isLoading, refetch } = useGetConnectorsQuery({ limit: 100 });
  const { data: dashData } = useGetConnectorDashboardQuery();
  const [syncConnector] = useSyncConnectorMutation();
  const [syncAll, { isLoading: syncingAll }] = useSyncAllConnectorsMutation();
  const [disableConnector] = useDisableConnectorMutation();
  const [enableConnector] = useEnableConnectorMutation();
  const [deleteConnector] = useDeleteConnectorMutation();

  const sheets = data?.data || [];
  const dashboard = dashData?.data || {};

  const trackFromResponse = (payload) => {
    const ids = [];
    if (payload?.syncLogId) ids.push(payload.syncLogId);
    if (Array.isArray(payload?.jobs)) {
      payload.jobs.forEach((j) => {
        if (j.syncLogId) ids.push(j.syncLogId);
      });
    }
    if (ids.length) dispatch(trackSyncJobs(ids));
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const res = await syncConnector(id).unwrap();
      trackFromResponse(res.data);
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      const res = await syncAll().unwrap();
      trackFromResponse(res.data);
      refetch();
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
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sheet connection? This cannot be undone.')) return;
    try {
      await deleteConnector(id).unwrap();
      refetch();
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Connected Sheets"
            value={dashboard.connectedSheets ?? 0}
            subtitle={`${dashboard.activeSheets ?? 0} active`}
          />
          <StatCard
            title="Imported Today"
            value={dashboard.importedToday ?? 0}
            variant="open"
          />
          <StatCard
            title="Failed Syncs Today"
            value={dashboard.failedSyncs ?? 0}
            variant="alert"
          />
          <StatCard
            title="Last Sync"
            value={
              dashboard.lastSync?.completedAt
                ? formatRelativeTime(dashboard.lastSync.completedAt)
                : '—'
            }
            subtitle={dashboard.lastSync?.connector?.name}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <LoadingButton
            variant="outline"
            loading={syncingAll}
            loadingText="Queuing..."
            onClick={handleSyncAll}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Sync All
          </LoadingButton>
          <Button asChild>
            <Link to="/google-sheets/new">
              <Plus className="mr-2 h-4 w-4" /> Add Sheet
            </Link>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={sheets}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={setSorting}
          emptyMessage="No sheets connected yet. Add your first Google Sheet."
          skeletonCols={6}
          maxHeight="calc(100vh - 380px)"
        />
      </div>
    </div>
  );
}
