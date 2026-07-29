import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import GoogleSheetsTabs from '@/components/google-sheets/GoogleSheetsTabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useGetConnectorSyncLogsQuery } from '@/store/api/apiSlice';
import { cn, formatDateTime, formatDuration } from '@/lib/utils';

export default function SyncHistoryPage() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetConnectorSyncLogsQuery(
    { page, limit: 30 },
    { refetchOnMountOrArgChange: true }
  );

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const showLoading = isLoading || (isFetching && !data);
  const showError = isError && !data;

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
          if (log.status === 'failed') {
            return (
              <span className="line-clamp-2 text-xs text-destructive" title={log.errorSummary || 'Failed'}>
                {log.errorSummary || 'Failed'}
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
            status === 'completed' ? 'success' : status === 'failed' ? 'destructive' : 'default';
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
    ],
    []
  );

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Google Sheets" description="Sync history for connected spreadsheets" />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <GoogleSheetsTabs />

        {isError && data && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{error?.data?.message || error?.error || 'Failed to refresh sync history'}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {showLoading ? (
          <TableSkeleton rows={10} cols={8} />
        ) : showError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-card">
            <p className="text-sm font-medium text-foreground">Failed to load sync history</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error?.data?.message ||
                error?.error ||
                'Something went wrong while loading sync logs. Please try again.'}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={logs}
              isLoading={false}
              isFiltering={isFetching}
              filteringMessage="Refreshing sync history…"
              sorting={sorting}
              onSortingChange={setSorting}
              emptyMessage="No sync history yet."
              skeletonCols={8}
              maxHeight="calc(100vh - 260px)"
            />

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  className={cn('rounded-md border px-3 py-1 text-sm disabled:opacity-50')}
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                  disabled={page >= pagination.totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
