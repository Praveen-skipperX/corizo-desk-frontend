import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import GoogleSheetsTabs from '@/components/google-sheets/GoogleSheetsTabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  useGetConnectorSyncLogsQuery,
  useCancelSyncLogMutation,
  useCancelActiveSyncsMutation,
} from '@/store/api/apiSlice';
import { cn, formatDateTime, formatDuration } from '@/lib/utils';

export default function SyncHistoryPage() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [busyId, setBusyId] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetConnectorSyncLogsQuery(
    { page, limit: 30 },
    { refetchOnMountOrArgChange: true }
  );
  const [cancelSync] = useCancelSyncLogMutation();
  const [cancelActive, { isLoading: cancellingAll }] = useCancelActiveSyncsMutation();

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const showLoading = isLoading || (isFetching && !data);
  const showError = isError && !data;
  const hasActive = logs.some((l) => l.status === 'pending' || l.status === 'running');

  const handleCancel = async (id) => {
    setBusyId(String(id));
    try {
      await cancelSync(id).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Cancel failed');
    } finally {
      setBusyId('');
    }
  };

  const handleCancelAll = async () => {
    try {
      await cancelActive().unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Cancel failed');
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'date',
        accessorFn: (row) => row.completedAt || row.createdAt,
        header: 'Date',
        size: 160,
        cell: ({ row }) =>
          formatDateTime(row.original.completedAt || row.original.createdAt),
      },
      {
        id: 'sheet',
        accessorFn: (row) => row.connector?.name || row.connectorName || '—',
        header: 'Sheet',
        size: 180,
        cell: ({ row }) => {
          const name = row.original.connector?.name || row.original.connectorName || '—';
          const deleted = row.original.sheetDeleted || row.original.connector?.isDeleted;
          return (
            <div className="min-w-0">
              <p className="truncate font-medium">{name}</p>
              {deleted && (
                <p className="text-[11px] text-muted-foreground">Connection removed</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'importedCount',
        header: 'Imported',
        size: 90,
        cell: ({ row }) => row.original.importedCount ?? 0,
      },
      {
        accessorKey: 'updatedCount',
        header: 'Updated',
        size: 90,
        cell: ({ row }) => row.original.updatedCount ?? 0,
      },
      {
        accessorKey: 'duplicateCount',
        header: 'Duplicates',
        size: 90,
        cell: ({ row }) => row.original.duplicateCount ?? 0,
      },
      {
        id: 'failed',
        accessorFn: (row) => (row.invalidCount ?? 0) + (row.status === 'failed' ? 1 : 0),
        header: 'Failed',
        size: 100,
        cell: ({ row }) => {
          const log = row.original;
          if (log.status === 'failed' || log.status === 'cancelled' || log.status === 'paused') {
            return (
              <span className="line-clamp-2 text-xs text-destructive" title={log.errorSummary || log.status}>
                {log.errorSummary || log.status}
              </span>
            );
          }
          return log.invalidCount ?? 0;
        },
      },
      {
        accessorKey: 'durationMs',
        header: 'Duration',
        size: 90,
        cell: ({ row }) => formatDuration(row.original.durationMs),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === 'completed'
              ? 'success'
              : status === 'failed' || status === 'cancelled'
                ? 'destructive'
                : 'default';
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const log = row.original;
          if (log.status !== 'pending' && log.status !== 'running') return null;
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive"
              disabled={busyId === String(log._id)}
              onClick={() => handleCancel(log._id)}
            >
              Cancel
            </Button>
          );
        },
      },
    ],
    [busyId]
  );

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Google Sheets" description="Sync history for connected spreadsheets" />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <GoogleSheetsTabs />

        {hasActive && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span>Active sync(s) in progress. You can cancel and start a fresh sync.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive"
              disabled={cancellingAll}
              onClick={handleCancelAll}
            >
              Cancel all
            </Button>
          </div>
        )}

        {isError && data && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{error?.data?.message || error?.error || 'Failed to refresh sync history'}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {showError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
            <p>{error?.data?.message || error?.error || 'Failed to load sync history'}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : showLoading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : (
          <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
            <DataTable
              columns={columns}
              data={logs}
              sorting={sorting}
              onSortingChange={setSorting}
              pageCount={pagination?.pages || 1}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
              emptyMessage="No sync history yet"
            />
          </div>
        )}
      </div>
    </div>
  );
}
