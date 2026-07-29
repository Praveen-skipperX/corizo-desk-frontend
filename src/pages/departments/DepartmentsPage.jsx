import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useGetDepartmentsQuery } from '@/store/api/apiSlice';
import { Plus, Building2, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const { data, isLoading, refetch } = useGetDepartmentsQuery();

  const openCreate = () => {
    setEditDept(null);
    setForm({ name: '', code: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditDept(dept);
    setForm({ name: dept.name, code: dept.code, description: dept.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editDept) {
        await api.patch(`/users/departments/${editDept._id}`, form);
      } else {
        await api.post('/users/departments', form);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (dept) => {
    try {
      if (dept.isActive) await api.post(`/users/departments/${dept._id}/deactivate`);
      else await api.post(`/users/departments/${dept._id}/reactivate`);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (dept) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    try {
      await api.delete(`/users/departments/${dept._id}`);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const departments = data?.data || [];

  return (
    <div>
      <Header title="Departments" description="Manage organizational departments with strict data isolation" />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <InfoTooltip content="Each department has isolated data. Cannot delete departments with active users or leads." />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No departments yet</td></tr>
                ) : departments.map((dept) => (
                  <tr key={dept._id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{dept.code}</td>
                    <td className="px-4 py-3 text-sm">{dept.totalUsers ?? 0}</td>
                    <td className="px-4 py-3 text-sm">{dept.totalLeads ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${dept.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(dept.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dept)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(dept)} title={dept.isActive ? 'Deactivate' : 'Reactivate'}>
                          {dept.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(dept)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Department Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required disabled={!!editDept} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editDept ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
