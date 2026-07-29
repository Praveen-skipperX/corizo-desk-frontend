import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { PrioritySelector } from '@/components/ui/priority-indicator';
import DateTimePicker from '@/components/ui/date-time-picker';
import {
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useGetLeadQuery,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  useGetCoursesQuery,
} from '@/store/api/apiSlice';
import { ROLES, LEAD_SOURCES, LEAD_STATUSES, formatCourseLabel } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { useSelector } from 'react-redux';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useToast } from '@/components/ui/toast';

const baseFields = {
  name: z.string().trim().min(2, 'Name is required'),
  phone: z.string().trim().min(10, 'Valid phone number required'),
  email: z.union([z.string().trim().email('Invalid email'), z.literal('')]).optional(),
  course: z.string().optional(),
  address: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  priority: z.enum(['red', 'yellow', 'green']).default('yellow'),
  source: z.string().optional(),
  department: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  followUpAt: z.any().optional().nullable(),
  adminRemark: z.string().optional(),
};

const createSchema = z.object({
  ...baseFields,
  creatorRemark: z.string().trim().min(1, 'Remark is required'),
});

const editSchema = z.object({
  ...baseFields,
  creatorRemark: z.string().optional(),
});

function FormSection({ title, children }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function emptyFormValues() {
  return {
    name: '',
    phone: '',
    email: '',
    course: '',
    address: { city: '', state: '', pincode: '' },
    priority: 'yellow',
    source: 'manual',
    department: '',
    assignedTo: '',
    status: 'new',
    followUpAt: null,
    creatorRemark: '',
    adminRemark: '',
  };
}

function leadToFormValues(lead) {
  if (!lead) return emptyFormValues();
  const followUp = lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate) : null;
  return {
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    course: formatCourseLabel(lead.course) || '',
    address: {
      city: lead.address?.city || '',
      state: lead.address?.state || '',
      pincode: lead.address?.pincode || '',
    },
    priority: lead.priority || 'yellow',
    source: lead.source || 'manual',
    department: lead.department?._id || lead.department || '',
    assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
    status: lead.status || 'new',
    followUpAt: followUp && !Number.isNaN(followUp.getTime()) ? followUp : null,
    creatorRemark: '',
    adminRemark: '',
  };
}

export default function LeadFormModal({ open, onOpenChange, lead, onSuccess }) {
  const toast = useToast();
  const isEdit = Boolean(lead?._id);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const { adminRemarksEnabled } = useAppSettings();
  const showAdminRemark = isAdmin && adminRemarksEnabled;
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [createLead, { isLoading: creating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: updating }] = useUpdateLeadMutation();
  const { data: fullLeadData } = useGetLeadQuery(lead?._id, {
    skip: !isEdit || !open || !lead?._id,
  });
  const { data: deptData } = useGetDepartmentsQuery(undefined, {
    skip: !ENABLE_DEPARTMENTS || user?.role === ROLES.EMPLOYEE,
  });
  const { data: usersData } = useGetUsersQuery({ limit: 100 });
  const { data: coursesData } = useGetCoursesQuery({ activeOnly: true });
  const courses = coursesData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: emptyFormValues(),
  });

  const status = watch('status');
  const selectedCourse = watch('course');
  const courseOptions = (() => {
    const list = [...courses];
    if (selectedCourse && !list.some((c) => c.name === selectedCourse)) {
      list.unshift({ _id: `legacy-${selectedCourse}`, name: selectedCourse });
    }
    return list;
  })();
  const isLoading = creating || updating;

  useEffect(() => {
    if (!open) return;
    // Never reuse cached getLead data when creating — that caused edit values to stick.
    if (!isEdit) {
      reset(emptyFormValues());
      return;
    }
    reset(leadToFormValues(fullLeadData?.data || lead));
  }, [open, isEdit, lead, fullLeadData, reset]);

  const handleClose = (nextOpen) => {
    if (!nextOpen && isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      course: formatCourseLabel(data.course?.trim()) || undefined,
      priority: data.priority,
      source: data.source || 'manual',
      department: ENABLE_DEPARTMENTS ? (data.department || undefined) : undefined,
      assignedTo: data.assignedTo || undefined,
      status: data.status || 'new',
      address: data.address,
      nextFollowUpDate:
        data.followUpAt instanceof Date && !Number.isNaN(data.followUpAt.getTime())
          ? data.followUpAt.toISOString()
          : undefined,
    };

    if (showAdminRemark && data.adminRemark?.trim()) payload.adminRemark = data.adminRemark.trim();

    try {
      if (isEdit) {
        await updateLead({ id: lead._id, ...payload }).unwrap();
        toast.success('Lead updated', lead?.leadId || payload.name);
      } else {
        payload.creatorRemark = data.creatorRemark.trim();
        await createLead(payload).unwrap();
        toast.success('Lead created', payload.name);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(
        isEdit ? 'Could not update lead' : 'Could not create lead',
        err.data?.message || err.message || 'Failed to save lead',
      );
    }
  };

  const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
  const textareaClass = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent showClose={!isLoading} className="max-sm:h-full max-sm:max-h-full">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
            <DialogDescription>
              {isEdit ? `Update ${lead?.leadId || 'lead'} details` : 'Add a new lead to the pipeline'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-5">
              <FormSection title="Contact Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required error={errors.name?.message}>
                    <Input {...register('name')} placeholder="Full name" />
                  </Field>
                  <Field label="Phone Number" required error={errors.phone?.message}>
                    <Input {...register('phone')} placeholder="10-digit mobile" />
                  </Field>
                  <Field label="Email Address" error={errors.email?.message}>
                    <Input type="email" {...register('email')} placeholder="name@example.com" />
                  </Field>
                  <Field label="City">
                    <Input {...register('address.city')} />
                  </Field>
                  <Field label="State">
                    <Input {...register('address.state')} />
                  </Field>
                  <Field label="Pincode">
                    <Input {...register('address.pincode')} />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Lead Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Priority" className="sm:col-span-2">
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <PrioritySelector value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </Field>
                  <Field label="Lead Source">
                    <select className={selectClass} {...register('source')}>
                      {LEAD_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={selectClass} {...register('status')}>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                  {ENABLE_DEPARTMENTS && user?.role === ROLES.SUPER_ADMIN && (
                    <Field label="Department">
                      <select className={selectClass} {...register('department')}>
                        <option value="">Select department</option>
                        {deptData?.data?.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {user?.role !== ROLES.EMPLOYEE && (
                    <Field label="Assigned Counselor">
                      <select className={selectClass} {...register('assignedTo')}>
                        <option value="">Unassigned</option>
                        {usersData?.data?.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Course">
                    <select className={selectClass} {...register('course')}>
                      <option value="">Select course (optional)</option>
                      {courseOptions.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Follow-up Information">
                <Field label="Next Follow-up">
                  <Controller
                    name="followUpAt"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date & time"
                        minDate={new Date()}
                      />
                    )}
                  />
                </Field>
              </FormSection>

              <FormSection title="Remarks">
                {!isEdit && (
                  <Field label="Remark" required error={errors.creatorRemark?.message} className="mb-4">
                    <textarea
                      className={textareaClass}
                      placeholder="Describe the lead context, needs, or initial conversation..."
                      {...register('creatorRemark')}
                    />
                  </Field>
                )}
                {/* Admin Remark — gated by System Settings → Admin Remarks */}
                {showAdminRemark && (
                  <Field label="Admin Remark">
                    <textarea
                      className={textareaClass}
                      placeholder="Instructions or guidance for the assigned counselor..."
                      {...register('adminRemark')}
                    />
                  </Field>
                )}
                {isEdit && !showAdminRemark && (
                  <p className="text-sm text-muted-foreground">Add new remarks from the lead detail page.</p>
                )}
              </FormSection>

              {status === 'closed' && (
                <FormSection title="Enrollment">
                  <p className="text-sm text-secondary">
                    {watch('course')?.trim()
                      ? `This lead will be marked as enrolled in ${watch('course').trim()}.`
                      : 'This lead will be marked as enrolled. Add a course above if known.'}
                  </p>
                </FormSection>
              )}
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <LoadingButton type="submit" loading={isLoading} loadingText={isEdit ? 'Saving lead...' : 'Creating lead...'}>
                {isEdit ? 'Save Changes' : 'Create Lead'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>Your changes will be lost if you close this form.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>Keep editing</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
