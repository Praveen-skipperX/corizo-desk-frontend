import { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
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
import { TableSkeleton } from '@/components/ui/skeleton';
import { useGetCoursesQuery } from '@/store/api/apiSlice';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

const EMPTY_FORM = { name: '', category: '', description: '', sortOrder: '' };

export default function CoursesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { data, isLoading, refetch } = useGetCoursesQuery();

  const courses = data?.data || [];
  const categories = useMemo(
    () => [...new Set(courses.map((c) => c.category).filter(Boolean))],
    [courses]
  );

  const openCreate = () => {
    setEditCourse(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditCourse(course);
    setForm({
      name: course.name,
      category: course.category || '',
      description: course.description || '',
      sortOrder: course.sortOrder ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('Course name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
        sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
      };
      if (editCourse) {
        await api.patch(`/courses/${editCourse._id}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (course) => {
    try {
      if (course.isActive) await api.post(`/courses/${course._id}/deactivate`);
      else await api.post(`/courses/${course._id}/reactivate`);
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Delete course "${course.name}"?`)) return;
    try {
      await api.delete(`/courses/${course._id}`);
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message);
      refetch();
    }
  };

  return (
    <div>
      <Header title="Courses" description="Manage Corizo course catalog for lead enrollment" />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <InfoTooltip content="Courses appear in the lead form dropdown. Renaming a course updates matching leads." />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No courses yet. Add one or run seed:courses.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course._id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-[11px] text-muted-foreground">{course.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{course.category || '—'}</td>
                      <td className="px-4 py-3 text-sm">{course.totalLeads ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(course.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(course)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleActive(course)}
                            title={course.isActive ? 'Deactivate' : 'Reactivate'}
                          >
                            {course.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Course Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Web Development"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <Input
                list="course-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Technology"
              />
              <datalist id="course-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {editCourse ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
