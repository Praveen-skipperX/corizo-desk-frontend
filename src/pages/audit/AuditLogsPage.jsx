import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGetActivityLogsQuery } from '@/store/api/apiSlice';
import { formatDateTime, formatStatus } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';

const ACTION_TYPES = [
  'create', 'update', 'delete', 'assign', 'reassign', 'status_change',
  'remark_add', 'follow_up_create', 'follow_up_complete', 'deal_close', 'deal_cancel',
  'call_initiated', 'email_initiated', 'login', 'logout', 'user_create',
];

const ENTITY_TYPES = ['user', 'department', 'lead', 'follow_up', 'remark', 'deal_closure'];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [expanded, setExpanded] = useState(null);
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    assignmentChanges: false,
    statusChanges: false,
  });

  const { data, isLoading } = useGetActivityLogsQuery({
    page,
    limit,
    search: filters.search || undefined,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    assignmentChanges: filters.assignmentChanges ? 'true' : undefined,
    statusChanges: filters.statusChanges ? 'true' : undefined,
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const expandedLog = logs.find((l) => l._id === expanded);

  const columns = useMemo(() => [
    {
      id: 'expand',
      size: 28,
      enableSorting: false,
      enableResizing: false,
      header: '',
      cell: ({ row }) => (
        expanded === row.original._id
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      size: 150,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: 'user',
      accessorFn: (row) => row.userName,
      header: 'User',
      size: 140,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.userName}</p>
          <p className="text-[10px] capitalize text-muted-foreground">
            {row.original.userRole?.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      size: 180,
      cell: ({ row }) => row.original.description || formatStatus(row.original.action),
    },
    {
      accessorKey: 'entityType',
      header: 'Entity',
      size: 100,
      cell: ({ row }) => formatStatus(row.original.entityType),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
      size: 110,
      cell: ({ row }) => row.original.ipAddress || '—',
    },
  ], [expanded]);

  return (
    <div>
      <Header title="Audit Logs" description="Complete activity trail with filters and search" />

      <div className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
          <Input
            placeholder="Search user, lead ID..."
            className="h-8 w-44 text-xs"
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          />
          <select className="h-8 rounded-md border bg-background px-2 text-xs" value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}>
            <option value="">All Actions</option>
            {ACTION_TYPES.map((a) => <option key={a} value={a}>{formatStatus(a)}</option>)}
          </select>
          <select className="h-8 rounded-md border bg-background px-2 text-xs" value={filters.entityType} onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setPage(1); }}>
            <option value="">All Entities</option>
            {ENTITY_TYPES.map((e) => <option key={e} value={e}>{formatStatus(e)}</option>)}
          </select>
          <Input type="date" className="h-8 w-32 text-xs" value={filters.dateFrom} onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1); }} />
          <Input type="date" className="h-8 w-32 text-xs" value={filters.dateTo} onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1); }} />
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={filters.assignmentChanges} onChange={(e) => { setFilters({ ...filters, assignmentChanges: e.target.checked }); setPage(1); }} />
            Assignments
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={filters.statusChanges} onChange={(e) => { setFilters({ ...filters, statusChanges: e.target.checked }); setPage(1); }} />
            Status
          </label>
          <select className="h-8 rounded-md border bg-background px-2 text-xs" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onRowClick={(log) => setExpanded(expanded === log._id ? null : log._id)}
          emptyMessage="No activity logs"
          skeletonCols={6}
          maxHeight="calc(100vh - 320px)"
        />

        {expandedLog && (
          <Card className="border-primary/20">
            <CardContent className="grid gap-3 p-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><span className="text-muted-foreground">IP Address:</span> {expandedLog.ipAddress || '—'}</div>
              <div><span className="text-muted-foreground">Entity ID:</span> {expandedLog.entityId || '—'}</div>
              {expandedLog.previousValues && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-muted-foreground">Previous:</span>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(expandedLog.previousValues, null, 2)}</pre>
                </div>
              )}
              {expandedLog.updatedValues && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-muted-foreground">New Value:</span>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(expandedLog.updatedValues, null, 2)}</pre>
                </div>
              )}
              {expandedLog.metadata && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-muted-foreground">Metadata:</span>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(expandedLog.metadata, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <p className="text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
