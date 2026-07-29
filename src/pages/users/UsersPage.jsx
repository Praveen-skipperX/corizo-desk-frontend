import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useGetUsersQuery, useGetDepartmentsQuery } from '@/store/api/apiSlice';
import { ROLE_LABELS, ROLES } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { Plus, UserCheck, UserX, Unlock, Pencil, Trash2, KeyRound } from 'lucide-react';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import AddUserModal from '@/components/users/AddUserModal';
import { UserItemCard } from '@/components/ui/compact-cards';
import LoadingState from '@/components/ui/loading-state';
import { DataTable, DataTableSelectCell } from '@/components/ui/data-table';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';

export default function UsersPage() {
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);

  const { data, isLoading, refetch } = useGetUsersQuery({ limit: 100 });
  const { data: deptData } = useGetDepartmentsQuery(undefined, { skip: !ENABLE_DEPARTMENTS });

  const users = data?.data || [];
  const departments = ENABLE_DEPARTMENTS ? (deptData?.data || []) : [];

  const openCreate = () => {
    setEditUser(null);
    setModalOpen(true);
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setModalOpen(true);
  };

  const toggleActive = async (u) => {
    try {
      if (u.isActive) await api.post(`/users/${u._id}/deactivate`);
      else await api.post(`/users/${u._id}/reactivate`);
      toast.success(u.isActive ? 'User deactivated' : 'User reactivated', u.name);
      refetch();
    } catch (err) {
      toast.error('Could not update user', err.message);
    }
  };

  const unlockUser = async (id) => {
    try {
      await api.post(`/users/${id}/unlock`);
      toast.success('Account unlocked');
      refetch();
    } catch (err) {
      toast.error('Could not unlock user', err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? Users with lead history will be deactivated instead.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      refetch();
    } catch (err) {
      toast.error('Could not delete user', err.message);
    }
  };

  const bulkDeactivate = async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (!ids.length || !confirm(`Deactivate ${ids.length} selected user(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => api.post(`/users/${id}/deactivate`)));
      setRowSelection({});
      toast.success('Users deactivated', `${ids.length} account${ids.length === 1 ? '' : 's'} deactivated`);
      refetch();
    } catch (err) {
      toast.error('Could not deactivate users', err.message);
    }
  };

  const columns = useMemo(() => [
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
      accessorKey: 'name',
      header: 'Name',
      size: 160,
      filterFn: 'includesString',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
      filterFn: 'includesString',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      size: 100,
      cell: ({ row }) => ROLE_LABELS[row.original.role] || row.original.role,
      filterFn: 'includesString',
    },
    ...(ENABLE_DEPARTMENTS
      ? [{
          id: 'department',
          accessorFn: (row) => row.department?.name || '—',
          header: 'Department',
          size: 130,
          filterFn: 'includesString',
        }]
      : []),
    {
      id: 'status',
      accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
      header: 'Status',
      size: 110,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-1">
            {u.isActive ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <UserCheck className="h-3.5 w-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <UserX className="h-3.5 w-3.5" /> Inactive
              </span>
            )}
            {u.isLocked && <span className="text-[10px] text-destructive">Locked</span>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 150,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(u)} title="Edit user">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setResetUser(u)} title="Reset password">
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Reactivate'}>
              {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            </Button>
            {u.isLocked && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => unlockUser(u._id)}>
                <Unlock className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteUser(u._id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Users" description="Manage users created by you" />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>

        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            sorting={sorting}
            onSortingChange={setSorting}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            enableColumnFilters
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            emptyMessage="No users found. Create your first user."
            bulkActions={(
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={bulkDeactivate}>
                Deactivate Selected
              </Button>
            )}
            skeletonCols={6}
            maxHeight="calc(100vh - 220px)"
          />
        </div>

        <div className="space-y-2 md:hidden">
          {isLoading ? (
            <LoadingState message="Loading users..." />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No users found.</p>
          ) : users.map((u) => (
            <UserItemCard
              key={u._id}
              user={u}
              roleLabel={ROLE_LABELS[u.role]}
              isActive={u.isActive}
              isLocked={u.isLocked}
              onEdit={() => handleEdit(u)}
              onResetPassword={() => setResetUser(u)}
              onToggleActive={() => toggleActive(u)}
              onUnlock={u.isLocked ? () => unlockUser(u._id) : undefined}
              onDelete={() => deleteUser(u._id)}
            />
          ))}
        </div>
      </div>

      <AddUserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(null); }}
        onSuccess={() => refetch()}
        user={user}
        editUser={editUser}
        departments={departments}
      />

      <ResetPasswordModal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        user={resetUser}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
