import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Upload, Download, Pencil, Phone, Mail, MessageSquare, CalendarClock, Filter, X, Eye, Trash2, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { PriorityIndicator } from '@/components/ui/priority-indicator';
import { AssigneeCell } from '@/components/leads/AssignLeadModal';
import LeadFormModal from '@/components/leads/LeadFormModal';
import QuickRemarkModal from '@/components/leads/QuickRemarkModal';
import QuickFollowUpModal from '@/components/leads/QuickFollowUpModal';
import ExportWizard from '@/components/exports/ExportWizard';
import SyncSheetsButton from '@/components/leads/SyncSheetsButton';
import { LeadSummaryCard } from '@/components/ui/compact-cards';
import LoadingState from '@/components/ui/loading-state';
import { DataTable, DataTableSelectCell } from '@/components/ui/data-table';
import {
  useGetLeadsQuery,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  useGetConnectorsQuery,
  useGetCoursesQuery,
  useBulkSoftDeleteLeadsMutation,
  useSoftDeleteAllLeadsMutation,
  useUpdateLeadMutation,
} from '@/store/api/apiSlice';
import { cn, formatDateTime, formatLeadGettingDate, formatCourseLabel, getLeadGettingDate, LEAD_STATUSES, LEAD_SOURCES, PRIORITY_CONFIG, ROLES } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { usePermission } from '@/hooks/usePermission';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const EMPLOYEE_TABS = [
  { id: 'all', label: 'All Leads' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'created', label: 'Created by Me' },
];

const EMPTY_FILTERS = {
  search: '',
  status: '',
  priority: '',
  source: '',
  course: '',
  department: '',
  assignedTo: '',
  connectorId: '',
  dateFrom: '',
  dateTo: '',
};

const PAGE_SIZE_OPTIONS = [30, 50, 100, 200, 500];

const selectClass = 'h-8 rounded-md border bg-background px-2 text-xs';

export default function LeadsPage() {
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canDeleteLeads = usePermission('leads.delete');

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  /** Draft values edited in the UI — not sent to API until Apply */
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  /** Applied filters used for server fetch */
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [employeeScope, setEmployeeScope] = useState('all');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [remarkLead, setRemarkLead] = useState(null);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [bulkSoftDeleteLeads] = useBulkSoftDeleteLeadsMutation();
  const [softDeleteAllLeads] = useSoftDeleteAllLeadsMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [cancellingFollowUpId, setCancellingFollowUpId] = useState('');

  const sortBy = sorting[0]?.id || 'createdAt';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const setDraftField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  /** Apply a single top-bar field immediately (status / priority). */
  const applyFieldNow = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setApplied((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setRowSelection({});
  };

  const buildQueryFilters = (filters) => ({
    search: filters.search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    source: filters.source || undefined,
    course: filters.course || undefined,
    department: ENABLE_DEPARTMENTS && isSuperAdmin && filters.department ? filters.department : undefined,
    assignedTo: isAdmin && filters.assignedTo ? filters.assignedTo : undefined,
    connectorId: isAdmin && filters.connectorId ? filters.connectorId : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    scope: isEmployee && employeeScope !== 'all' ? employeeScope : undefined,
  });

  const listFilters = useMemo(
    () => buildQueryFilters(applied),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applied, employeeScope, isAdmin, isSuperAdmin, isEmployee]
  );

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const trackCommunication = async (lead, type) => {
    try {
      await api.post(`/leads/${lead._id}/communication`, { type });
    } catch {
      /* non-blocking */
    }
  };

  const openRemark = (lead) => {
    setRemarkLead(lead);
    setRemarkOpen(true);
  };

  const openFollowUp = (lead) => {
    setFollowUpLead(lead);
    setFollowUpOpen(true);
  };

  const cancelNextFollowUp = async (lead) => {
    if (!lead?.nextFollowUpDate) return;
    if (!window.confirm(`Cancel next follow-up for ${lead.name || lead.leadId}?`)) return;
    setCancellingFollowUpId(String(lead._id));
    try {
      await updateLead({
        id: lead._id,
        nextFollowUpDate: null,
        status: lead.status === 'follow_up' ? 'connected' : lead.status,
      }).unwrap();
      toast.success('Next follow-up cancelled', lead.leadId || lead.name);
      refetch();
    } catch (err) {
      toast.error('Could not cancel follow-up', err?.data?.message || err?.message);
    } finally {
      setCancellingFollowUpId('');
    }
  };

  useEffect(() => {
    const courseFromUrl = searchParams.get('course');
    const createFromUrl = searchParams.get('create');

    if (courseFromUrl) {
      setDraft((prev) => ({ ...prev, course: courseFromUrl }));
      setApplied((prev) => ({ ...prev, course: courseFromUrl }));
      setShowFilters(true);
      setPage(1);
      setRowSelection({});
    }

    if (createFromUrl === '1') {
      setEditLead(null);
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    setRowSelection({});
    if (searchParams.has('course')) {
      const next = new URLSearchParams(searchParams);
      next.delete('course');
      setSearchParams(next, { replace: true });
    }
  };
  const { data, isLoading, isFetching, refetch } = useGetLeadsQuery({
    page,
    limit: pageSize,
    ...listFilters,
    sortBy,
    sortOrder,
  });

  const { data: deptData } = useGetDepartmentsQuery(undefined, {
    skip: !ENABLE_DEPARTMENTS || !isSuperAdmin,
  });
  const { data: usersData } = useGetUsersQuery({ limit: 100 }, { skip: !isAdmin });
  const { data: connectorsData } = useGetConnectorsQuery({ limit: 100 }, { skip: !isAdmin });
  const { data: coursesData } = useGetCoursesQuery({ activeOnly: true });

  const departments = deptData?.data || [];
  const counselors = usersData?.data || [];
  const connectors = connectorsData?.data || [];
  const courseOptions = coursesData?.data || [];

  const appliedFilterCount = [
    applied.search,
    applied.status,
    applied.priority,
    applied.source,
    applied.course,
    ENABLE_DEPARTMENTS ? applied.department : '',
    applied.assignedTo,
    applied.connectorId,
    applied.dateFrom,
    applied.dateTo,
  ].filter(Boolean).length;

  const applyFilters = (e) => {
    e?.preventDefault?.();
    const next = { ...draft };
    setApplied(next);
    if (
      next.source
      || next.course
      || next.department
      || next.assignedTo
      || next.connectorId
      || next.dateFrom
      || next.dateTo
    ) {
      setShowFilters(true);
    }
    setPage(1);
    setRowSelection({});
  };

  const leads = data?.data || [];
  const pagination = data?.pagination;

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Soft-delete ${selectedIds.length} selected lead(s)? They will be hidden from lists.`)) {
      return;
    }
    setDeleting(true);
    try {
      await bulkSoftDeleteLeads(selectedIds).unwrap();
      setRowSelection({});
      toast.success(
        selectedIds.length === 1 ? 'Lead deleted' : 'Leads deleted',
        `${selectedIds.length} lead${selectedIds.length === 1 ? '' : 's'} removed from lists`,
      );
      refetch();
    } catch (err) {
      toast.error('Could not delete leads', err?.data?.message || err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const total = pagination?.total ?? 0;
    if (!total) {
      toast.info('Nothing to delete', 'No leads match the current filters.');
      return;
    }
    const ok = window.confirm(
      `Soft-delete ALL ${total} lead(s) matching the current filters?\n\nThis cannot be undone from the UI.`
    );
    if (!ok) return;
    const typed = window.prompt('Type DELETE to confirm deleting all matching leads:');
    if (typed !== 'DELETE') return;

    setDeleting(true);
    try {
      await softDeleteAllLeads({ confirm: true, filters: listFilters }).unwrap();
      setRowSelection({});
      toast.success('Leads deleted', `${total} matching lead${total === 1 ? '' : 's'} removed`);
      refetch();
    } catch (err) {
      toast.error('Could not delete leads', err?.data?.message || err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditLead(null);
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setModalOpen(true);
  };

  const columns = useMemo(() => {
    const cols = [
      {
        id: 'select',
        size: 32,
        enableSorting: false,
        enableResizing: false,
        header: ({ table }) => (
          <DataTableSelectCell
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            ariaLabel="Select all"
          />
        ),
        cell: ({ row }) => (
          <DataTableSelectCell
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: 'srNo',
        header: 'Sr No',
        size: 56,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {(page - 1) * 30 + row.index + 1}
          </span>
        ),
      },
      {
        id: 'leadDate',
        accessorFn: (row) => getLeadGettingDate(row)?.getTime() || 0,
        header: 'Date',
        size: 120,
        cell: ({ row }) => (
          <Link
            to={`/leads/${row.original._id}`}
            className="font-medium tabular-nums text-foreground hover:text-primary"
            title={row.original.leadId}
          >
            {formatLeadGettingDate(row.original)}
          </Link>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        cell: ({ row }) => (
          <Link to={`/leads/${row.original._id}`} className="font-medium text-foreground hover:text-primary">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 120,
      },
      {
        accessorKey: 'course',
        header: 'Course',
        size: 160,
        cell: ({ row }) => (
          <span className="truncate text-xs" title={formatCourseLabel(row.original.course) || undefined}>
            {formatCourseLabel(row.original.course) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        minSize: 100,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 100,
        minSize: 90,
        cell: ({ row }) => <PriorityIndicator priority={row.original.priority} size="sm" />,
      },
    ];

    if (isAdmin) {
      cols.push({
        id: 'assignedTo',
        accessorFn: (row) => row.assignedTo?.name || '—',
        header: 'Counselor',
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <AssigneeCell user={row.original.assignedTo} department={row.original.department} />
        ),
      });
    }

    cols.push(
      {
        accessorKey: 'nextFollowUpDate',
        header: 'Next Follow-up',
        size: 160,
        cell: ({ row }) => {
          const lead = row.original;
          if (!lead.nextFollowUpDate) return '—';
          const busy = cancellingFollowUpId === String(lead._id);
          return (
            <span className="inline-flex items-center gap-1">
              <span className="tabular-nums">{formatDateTime(lead.nextFollowUpDate)}</span>
              <button
                type="button"
                title="Cancel next follow-up"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  cancelNextFollowUp(lead);
                }}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </button>
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 180,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex items-center justify-end gap-0.5">
              <Button variant="outline" size="icon" className="h-7 w-7" asChild title="View details">
                <Link to={`/leads/${lead._id}`}>
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  onClick={() => trackCommunication(lead, 'call')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  title="Call"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  onClick={() => trackCommunication(lead, 'email')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  title="Email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={() => openRemark(lead)}
                title="Add remark"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                onClick={() => openFollowUp(lead)}
                title="Schedule follow-up"
              >
                <CalendarClock className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)} title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      }
    );

    return cols;
  }, [isAdmin, page, cancellingFollowUpId]);

  const skeletonColCount = isAdmin ? 11 : 10;

  const handleSortingChange = (updater) => {
    setSorting(updater);
    setPage(1);
  };

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Leads" description="Manage leads across the complete lifecycle" />

      <div className="flex-1 space-y-3 p-4 sm:p-6">
        <form
          onSubmit={applyFilters}
          className="flex flex-col gap-3 rounded-lg border bg-card p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, email, ID..."
                  className="h-8 w-56 pl-8 text-xs"
                  value={draft.search}
                  onChange={(e) => setDraftField('search', e.target.value)}
                  disabled={isFetching}
                />
              </div>
              <select
                className={selectClass}
                value={draft.status}
                onChange={(e) => applyFieldNow('status', e.target.value)}
                disabled={isFetching}
              >
                <option value="">All Status</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                className={selectClass}
                value={draft.priority}
                onChange={(e) => applyFieldNow('priority', e.target.value)}
                disabled={isFetching}
              >
                <option value="">All Priority</option>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-8 text-xs', showFilters && 'border-primary bg-primary/5')}
                onClick={() => setShowFilters((v) => !v)}
                disabled={isFetching}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                More filters
                {appliedFilterCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {appliedFilterCount}
                  </span>
                )}
              </Button>
            </div>

            <div className={cn('flex flex-wrap gap-2', isFetching && 'pointer-events-none opacity-60')}>
              {isEmployee ? (
                <select
                  className={cn(selectClass, 'min-w-[10.5rem] border-primary/30 bg-primary/5 font-medium')}
                  value={employeeScope}
                  onChange={(e) => {
                    setEmployeeScope(e.target.value);
                    setPage(1);
                    setRowSelection({});
                  }}
                  disabled={isFetching}
                  aria-label="Lead scope"
                >
                  {EMPLOYEE_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              ) : (
                <>
                  <SyncSheetsButton onSynced={refetch} />
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={isFetching}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Import
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExportOpen(true)} disabled={isFetching}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                  </Button>
                </>
              )}
              {canDeleteLeads && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleting || isFetching || !(pagination?.total > 0)}
                  onClick={handleDeleteAll}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete All
                </Button>
              )}
              <Button type="button" size="sm" className="h-8 text-xs" onClick={openCreate} disabled={isFetching}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                <div className="min-w-0">
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Source</label>
                  <select
                    className={cn(selectClass, 'w-full')}
                    value={draft.source}
                    onChange={(e) => setDraftField('source', e.target.value)}
                    disabled={isFetching}
                  >
                    <option value="">All Sources</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Course</label>
                  <select
                    className={cn(selectClass, 'w-full')}
                    value={draft.course}
                    onChange={(e) => setDraftField('course', e.target.value)}
                    disabled={isFetching}
                  >
                    <option value="">All Courses</option>
                    {courseOptions.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {ENABLE_DEPARTMENTS && isSuperAdmin && (
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Department</label>
                    <select
                      className={cn(selectClass, 'w-full')}
                      value={draft.department}
                      onChange={(e) => setDraftField('department', e.target.value)}
                      disabled={isFetching}
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {isAdmin && (
                  <>
                    <div className="min-w-0">
                      <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Counselor</label>
                      <select
                        className={cn(selectClass, 'w-full')}
                        value={draft.assignedTo}
                        onChange={(e) => setDraftField('assignedTo', e.target.value)}
                        disabled={isFetching}
                      >
                        <option value="">All Counselors</option>
                        {counselors.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Google Sheet</label>
                      <select
                        className={cn(selectClass, 'w-full')}
                        value={draft.connectorId}
                        onChange={(e) => setDraftField('connectorId', e.target.value)}
                        disabled={isFetching}
                      >
                        <option value="">All Google Sheets</option>
                        {connectors.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="min-w-0">
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Date from</label>
                  <Input
                    type="date"
                    className="h-8 w-full text-xs"
                    value={draft.dateFrom}
                    onChange={(e) => setDraftField('dateFrom', e.target.value)}
                    disabled={isFetching}
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Date to</label>
                  <Input
                    type="date"
                    className="h-8 w-full text-xs"
                    value={draft.dateTo}
                    onChange={(e) => setDraftField('dateTo', e.target.value)}
                    disabled={isFetching}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                {appliedFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={clearFilters}
                    disabled={isFetching}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-8 min-w-[128px] text-xs" disabled={isFetching}>
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Applying…
                    </>
                  ) : (
                    'Apply filters'
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={leads}
            isLoading={isLoading}
            isFiltering={isFetching && !isLoading}
            filteringMessage="Filter processing…"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            emptyMessage={appliedFilterCount ? 'No leads match these filters' : 'No leads found'}
            bulkActions={(
              <>
                {!isEmployee && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setExportOpen(true)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Export Selected
                  </Button>
                )}
                {canDeleteLeads && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleting || !selectedIds.length}
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete Selected
                  </Button>
                )}
              </>
            )}
            skeletonCols={skeletonColCount}
            maxHeight="calc(100vh - 240px)"
          />
        </div>

        <div className="space-y-2 md:hidden">
          {isLoading ? (
            <LoadingState message="Loading leads..." />
          ) : leads.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              {appliedFilterCount ? 'No leads match these filters' : 'No leads found'}
            </p>
          ) : (
            leads.map((lead) => (
              <LeadSummaryCard
                key={lead._id}
                lead={lead}
                onEdit={openEdit}
                showAssignedTo={isAdmin}
              />
            ))
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                Rows
                <select
                  className={selectClass}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                    setRowSelection({});
                  }}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={!pagination.hasNext}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <QuickRemarkModal
        open={remarkOpen}
        onClose={() => setRemarkOpen(false)}
        lead={remarkLead}
        onSuccess={() => refetch()}
      />
      <QuickFollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        lead={followUpLead}
        onSuccess={() => refetch()}
      />
      <ExportWizard
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={listFilters}
      />
      <LeadFormModal
        key={editLead?._id || 'create'}
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next);
          if (!next) setEditLead(null);
        }}
        lead={editLead}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
