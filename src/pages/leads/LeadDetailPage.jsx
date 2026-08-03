import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Shield, Clock, Activity, GraduationCap, Pencil, UserPlus, Phone, Mail, Link2, Trash2, Loader2, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateTimePicker from '@/components/ui/date-time-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FoldableCard from '@/components/ui/foldable-card';
import { StatusBadge } from '@/components/ui/badge';
import { PriorityIndicator } from '@/components/ui/priority-indicator';
import LeadFormModal from '@/components/leads/LeadFormModal';
import { DetailGrid, KeyValue, PropertyTable } from '@/components/ui/detail-grid';
import {
  Timeline,
  mapCreatorRemarks,
  mapAdminRemarks,
  mapFollowUps,
  mergeActivityTimeline,
} from '@/components/ui/timeline';
import { useGetLeadQuery, useUpdateLeadMutation, useSoftDeleteLeadMutation } from '@/store/api/apiSlice';
import { formatDateTime, formatLeadGettingDate, formatCourseLabel, parseSheetDate, formatDate, LEAD_STATUSES, LEAD_SOURCES, formatStatus } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { useSelector } from 'react-redux';
import AssignLeadModal, { AssigneeCell, AssignmentHistory } from '@/components/leads/AssignLeadModal';
import QuickFollowUpModal from '@/components/leads/QuickFollowUpModal';
import api from '@/lib/api';
import { DetailSkeleton } from '@/components/ui/skeleton';
import { canAddCreatorRemark, canAddAdminRemark } from '@/lib/remarkPermissions';
import { usePermission } from '@/hooks/usePermission';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useToast } from '@/components/ui/toast';
import FollowUpCountdown from '@/components/ui/follow-up-countdown';
const ACTIVITY_PREVIEW_LIMIT = 5;

function sourceLabel(value) {
  return LEAD_SOURCES.find((s) => s.value === value)?.label || formatStatus(value);
}

function connectorTypeLabel(type) {
  if (!type) return '—';
  if (type === 'google_sheets') return 'Google Sheets';
  return formatStatus(type);
}

function formatExternalRef(externalRef) {
  if (!externalRef) return '—';
  const parts = [];
  if (externalRef.sheetTitle) parts.push(externalRef.sheetTitle);
  else if (externalRef.spreadsheetId) parts.push(externalRef.spreadsheetId);
  if (externalRef.worksheet) parts.push(`Sheet: ${externalRef.worksheet}`);
  return parts.length ? parts.join(' · ') : '—';
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { adminRemarksEnabled } = useAppSettings();
  const toast = useToast();
  const { data, isLoading, refetch } = useGetLeadQuery(id);
  const [updateLead] = useUpdateLeadMutation();
  const [softDeleteLead, { isLoading: isDeleting }] = useSoftDeleteLeadMutation();
  const canDeleteLeads = usePermission('leads.delete');
  const [adminRemark, setAdminRemark] = useState('');
  const [statusDraft, setStatusDraft] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [quickRemark, setQuickRemark] = useState('');
  const [quickRemarkType, setQuickRemarkType] = useState('creator');
  const [quickFollowUpDate, setQuickFollowUpDate] = useState(null);
  const [quickFollowUpNotes, setQuickFollowUpNotes] = useState('');
  const [followUpError, setFollowUpError] = useState('');
  const [discussFollowUpId, setDiscussFollowUpId] = useState(null);
  const [discussNotes, setDiscussNotes] = useState('');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const EDIT_WINDOW_MS = 15 * 60 * 1000;

  const lead = data?.data;
  const isAssigned = Boolean(lead?.assignedTo?.name || lead?.assignedTo?._id);
  const allowCreatorRemark = canAddCreatorRemark(user, lead);
  const allowAdminRemark = canAddAdminRemark(user, { adminRemarksEnabled });
  const showQuickRemarkToggle = allowCreatorRemark && allowAdminRemark;
  const selectedStatus = statusDraft ?? lead?.status;
  const statusChanged = Boolean(lead && selectedStatus && selectedStatus !== lead.status);
  const canSaveUpdate = Boolean(statusChanged || quickRemark.trim());

  const persistStatusUpdate = async (status, remarkText) => {
    setStatusError('');
    setActionLoading('save-update');
    const label = LEAD_STATUSES.find((s) => s.value === status)?.label || formatStatus(status);
    const loadingId = toast.loading('Saving update…', statusChanged ? `Status → ${label}` : 'Saving remark');
    try {
      const useAdmin = showQuickRemarkToggle
        ? quickRemarkType === 'admin'
        : allowAdminRemark && !allowCreatorRemark;
      const trimmed = remarkText?.trim() || '';

      if (useAdmin && trimmed) {
        if (statusChanged) {
          await updateLead({ id, status }).unwrap();
        }
        await api.post(`/leads/${id}/admin-remarks`, { content: trimmed });
      } else if (allowCreatorRemark && (statusChanged || trimmed)) {
        const payload = {};
        if (statusChanged) payload.status = status;
        if (trimmed) payload.creatorRemark = trimmed;
        await updateLead({ id, ...payload }).unwrap();
      } else if (statusChanged) {
        await updateLead({ id, status }).unwrap();
      }

      setStatusDraft(null);
      setQuickRemark('');
      await refetch();
      toast.dismiss(loadingId);
      toast.success(
        statusChanged ? 'Update saved' : 'Remark added',
        statusChanged ? `Status: ${label}` : undefined,
      );
    } catch (err) {
      toast.dismiss(loadingId);
      const message = err?.data?.message || err?.response?.data?.message || err.message || 'Failed to save update';
      setStatusError(message);
      toast.error('Could not save update', message);
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveUpdate = async () => {
    if (!canSaveUpdate || actionLoading === 'save-update') return;
    const status = selectedStatus;
    if (status === 'closed' && statusChanged) {
      setStatusDraft('closed');
      return;
    }
    await persistStatusUpdate(status, quickRemark);
  };

  const onStatusSelect = (status) => {
    if (actionLoading === 'save-update') return;
    setStatusError('');
    setStatusDraft(status === lead.status ? null : status);
  };

  const addAdminRemark = async () => {
    if (!adminRemark.trim()) return;
    setActionLoading('admin-remark');
    try {
      await api.post(`/leads/${id}/admin-remarks`, { content: adminRemark });
      setAdminRemark('');
      refetch();
    } finally {
      setActionLoading('');
    }
  };

  const trackCommunication = async (type) => {
    setActionLoading(type);
    try {
      await api.post(`/leads/${id}/communication`, { type });
      refetch();
    } finally {
      setActionLoading('');
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      trackCommunication('call');
      window.location.href = `tel:${lead.phone}`;
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      trackCommunication('email');
      window.location.href = `mailto:${lead.email}`;
    }
  };

  const canEditRemark = (remark) => {
    if (remark.createdBy?._id?.toString() !== user?._id && remark.createdBy?.toString() !== user?._id) return false;
    return Date.now() - new Date(remark.createdAt).getTime() <= EDIT_WINDOW_MS;
  };

  const saveRemarkEdit = async (remarkId) => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/leads/${id}/creator-remarks/${remarkId}`, { content: editContent });
      setEditingRemarkId(null);
      setEditContent('');
      toast.success('Remark updated');
      refetch();
    } catch (err) {
      toast.error('Could not update remark', err?.response?.data?.message || err.message);
    }
  };

  const saveFollowUpDiscussion = async (followUpId) => {
    if (!discussNotes.trim()) return;
    setActionLoading(`discuss-${followUpId}`);
    try {
      await api.post(`/follow-ups/${followUpId}/discussion`, { notes: discussNotes.trim() });
      setDiscussFollowUpId(null);
      setDiscussNotes('');
      toast.success('Discussion saved');
      refetch();
    } catch (err) {
      toast.error('Could not save discussion', err?.response?.data?.message || err.message);
    } finally {
      setActionLoading('');
    }
  };

  const scheduleQuickFollowUp = async () => {
    if (!(quickFollowUpDate instanceof Date) || Number.isNaN(quickFollowUpDate.getTime())) {
      setFollowUpError('Please select a date and time.');
      return;
    }
    if (quickFollowUpDate <= new Date()) {
      setFollowUpError('Follow-up must be scheduled in the future.');
      return;
    }
    setActionLoading('quick-follow-up');
    setFollowUpError('');
    try {
      await api.post(`/leads/${id}/next-follow-up`, {
        scheduledDate: quickFollowUpDate.toISOString(),
        notes: quickFollowUpNotes.trim() || undefined,
      });
      toast.success('Follow-up scheduled', formatDateTime(quickFollowUpDate));
      setQuickFollowUpDate(null);
      setQuickFollowUpNotes('');
      refetch();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to schedule follow-up';
      setFollowUpError(message);
      toast.error('Could not schedule follow-up', message);
    } finally {
      setActionLoading('');
    }
  };

  const cancelNextFollowUp = async () => {
    if (!lead?.nextFollowUpDate) return;
    if (!window.confirm('Cancel the next follow-up for this lead?')) return;
    setActionLoading('cancel-follow-up');
    try {
      await updateLead({
        id,
        nextFollowUpDate: null,
        status: lead.status === 'follow_up' ? 'connected' : lead.status,
      }).unwrap();
      toast.success('Next follow-up cancelled');
      refetch();
    } catch (err) {
      toast.error('Could not cancel follow-up', err?.data?.message || err.message);
    } finally {
      setActionLoading('');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Lead" description="Loading lead details..." />
        <div className="p-4 sm:p-6">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!lead) {
    return <div className="p-6 text-center text-destructive">Lead not found</div>;
  }

  const activityItems = mergeActivityTimeline(lead.activities, lead.timelineEvents);
  const visibleActivities = showAllActivities
    ? activityItems
    : activityItems.slice(0, ACTIVITY_PREVIEW_LIMIT);

  const hasImportMeta = Boolean(lead.importMeta?.connectorId || lead.importMeta?.connectorName);
  const showSourceTracking = hasImportMeta || Boolean(lead.source);

  return (
    <div className="flex min-h-full flex-col">
      <Header title={lead.leadId} description={lead.name} />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
          </Button>
          <Button variant="outline" size="sm" className="border-primary/30 bg-white" onClick={() => setEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Lead
          </Button>
          {canDeleteLeads && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 bg-white text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
              onClick={async () => {
                if (!window.confirm(`Soft-delete lead ${lead.leadId}? It will be hidden from lists.`)) return;
                try {
                  await softDeleteLead(id).unwrap();
                  toast.success('Lead deleted', lead.leadId);
                  navigate('/leads');
                } catch (err) {
                  toast.error('Could not delete lead', err?.data?.message || err?.message);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          {lead.phone && (
            <Button variant="outline" size="sm" className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" onClick={handleCall} disabled={actionLoading === 'call'}>
              <Phone className="mr-2 h-4 w-4" /> Call
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" size="sm" className="border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100" onClick={handleEmail} disabled={actionLoading === 'email'}>
              <Mail className="mr-2 h-4 w-4" /> Email
            </Button>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card>
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-base text-secondary">Lead Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-0">
                <PropertyTable
                  className="rounded-none border-0 border-t"
                  rows={[
                    { left: { label: 'Name', value: lead.name }, right: { label: 'Priority', children: <PriorityIndicator priority={lead.priority} size="md" /> } },
                    { left: { label: 'Phone', value: lead.phone }, right: { label: 'Status', children: <StatusBadge status={lead.status} /> } },
                    { left: { label: 'Email', value: lead.email || '—' }, right: { label: 'Assigned Counselor', children: isAssigned ? <AssigneeCell user={lead.assignedTo} department={lead.department} /> : <span className="text-muted-foreground">—</span> } },
                    ...(ENABLE_DEPARTMENTS
                      ? [{ left: { label: 'Department', value: lead.department?.name || '—' }, right: { label: 'Course', value: formatCourseLabel(lead.course) || '—' } }]
                      : [{ left: { label: 'Course', value: formatCourseLabel(lead.course) || '—' }, right: { label: 'Source', value: lead.source?.replace(/_/g, ' ') } }]),
                    ...(ENABLE_DEPARTMENTS
                      ? [{ left: { label: 'Source', value: lead.source?.replace(/_/g, ' ') }, right: { label: 'Lead ID', value: lead.leadId || '—' } }]
                      : [{ left: { label: 'Lead ID', value: lead.leadId || '—' }, right: { label: 'Lead Date', value: formatLeadGettingDate(lead) } }]),
                    ...(ENABLE_DEPARTMENTS
                      ? [{ left: { label: 'Lead Date', value: formatLeadGettingDate(lead) }, right: {
                        label: 'Follow-up',
                        children: lead.nextFollowUpDate ? (
                          <span className="inline-flex flex-wrap items-center gap-x-1.5">
                            <span className="tabular-nums">{formatDateTime(lead.nextFollowUpDate)}</span>
                            <FollowUpCountdown date={lead.nextFollowUpDate} />
                            <button
                              type="button"
                              title="Cancel next follow-up"
                              disabled={actionLoading === 'cancel-follow-up'}
                              onClick={cancelNextFollowUp}
                              className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              {actionLoading === 'cancel-follow-up'
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <X className="h-3 w-3" />}
                            </button>
                          </span>
                        ) : '—',
                      } }]
                      : [{ left: {
                        label: 'Follow-up',
                        children: lead.nextFollowUpDate ? (
                          <span className="inline-flex flex-wrap items-center gap-x-1.5">
                            <span className="tabular-nums">{formatDateTime(lead.nextFollowUpDate)}</span>
                            <FollowUpCountdown date={lead.nextFollowUpDate} />
                            <button
                              type="button"
                              title="Cancel next follow-up"
                              disabled={actionLoading === 'cancel-follow-up'}
                              onClick={cancelNextFollowUp}
                              className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              {actionLoading === 'cancel-follow-up'
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <X className="h-3 w-3" />}
                            </button>
                          </span>
                        ) : '—',
                      }, right: { label: 'Created By', value: lead.createdBy?.name || '—' } }]),
                    ...(ENABLE_DEPARTMENTS
                      ? [
                        { left: { label: 'Created By', value: lead.createdBy?.name || '—' }, right: { label: 'Created At', value: formatDateTime(lead.createdAt) } },
                        { left: { label: 'Last Activity', value: formatDateTime(lead.lastActivityAt) }, right: { label: 'Address', value: [lead.address?.city, lead.address?.state, lead.address?.pincode].filter(Boolean).join(', ') || '—' } },
                      ]
                      : [
                        { left: { label: 'Created At', value: formatDateTime(lead.createdAt) }, right: { label: 'Last Activity', value: formatDateTime(lead.lastActivityAt) } },
                        { left: { label: 'Address', value: [lead.address?.city, lead.address?.state, lead.address?.pincode].filter(Boolean).join(', ') || '—' }, right: null },
                      ]),
                  ]}
                />
              </CardContent>
            </Card>

            {Array.isArray(lead.customFields) && lead.customFields.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-secondary">Additional Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailGrid columns={2}>
                    {lead.customFields.map((field) => {
                      const isDateField = /date/i.test(field.key || '') || /date/i.test(field.label || '');
                      const parsed = isDateField ? parseSheetDate(field.value) : null;
                      return (
                        <KeyValue
                          key={field.key}
                          label={field.label || field.key}
                          value={parsed ? formatDate(parsed) : (field.value || '—')}
                        />
                      );
                    })}
                  </DetailGrid>
                </CardContent>
              </Card>
            )}

            {showSourceTracking && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Link2 className="h-5 w-5 text-primary" /> Source Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailGrid columns={2}>
                  <KeyValue label="Lead Source" value={sourceLabel(lead.source)} />
                  {hasImportMeta && (
                    <>
                      <KeyValue label="Imported From" value={connectorTypeLabel(lead.importMeta.connectorType)} />
                      <KeyValue label="Connector Name" value={lead.importMeta.connectorName || '—'} />
                      <KeyValue label="Spreadsheet / Worksheet" value={formatExternalRef(lead.importMeta.externalRef)} />
                      <KeyValue label="Imported On" value={lead.importMeta.importedAt ? formatDateTime(lead.importMeta.importedAt) : '—'} />
                      <KeyValue label="Last Sync" value={lead.importMeta.lastSyncedAt ? formatDateTime(lead.importMeta.lastSyncedAt) : '—'} />
                    </>
                  )}
                </DetailGrid>
              </CardContent>
            </Card>
            )}

            {isAssigned && lead.assignmentHistory?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <UserPlus className="h-5 w-5 text-primary" /> Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssignmentHistory history={lead.assignmentHistory} />
              </CardContent>
            </Card>
            )}

            <FoldableCard title="Follow-up Timeline" icon={Clock}>
              <Timeline
                section="followups"
                items={mapFollowUps(lead.followUps, user?._id)}
                emptyMessage="No follow-ups scheduled"
                renderExtra={(item) => {
                  if (item.canDiscuss && discussFollowUpId !== item._id) {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs"
                        onClick={() => {
                          setDiscussFollowUpId(item._id);
                          setDiscussNotes('');
                        }}
                      >
                        What discussed?
                      </Button>
                    );
                  }
                  if (discussFollowUpId === item._id) {
                    return (
                      <div className="mt-2 space-y-2 rounded-md border bg-muted/20 p-2.5">
                        <Input
                          placeholder="What was discussed on this follow-up?"
                          value={discussNotes}
                          onChange={(e) => setDiscussNotes(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <LoadingButton
                            size="sm"
                            className="h-7 text-xs"
                            loading={actionLoading === `discuss-${item._id}`}
                            loadingText="Saving..."
                            disabled={!discussNotes.trim()}
                            onClick={() => saveFollowUpDiscussion(item._id)}
                          >
                            Save discussion
                          </LoadingButton>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setDiscussFollowUpId(null); setDiscussNotes(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </FoldableCard>

            <FoldableCard title="Status Timeline" icon={MessageSquare}>
              <div className="space-y-4">
                <Timeline
                  section="remarks"
                  remarkKind="creator"
                  items={mapCreatorRemarks(lead.creatorRemarks, user?._id)}
                  emptyMessage="No status updates yet"
                  renderExtra={(item) => {
                    const remark = lead.creatorRemarks?.find((r) => r._id === item._id);
                    if (!remark || !canEditRemark(remark)) return null;
                    if (editingRemarkId === remark._id) {
                      return (
                        <div className="mt-2 flex gap-2">
                          <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                          <Button size="sm" onClick={() => saveRemarkEdit(remark._id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRemarkId(null)}>Cancel</Button>
                        </div>
                      );
                    }
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs"
                        onClick={() => { setEditingRemarkId(remark._id); setEditContent(remark.content); }}
                      >
                        <Pencil className="mr-1 h-3 w-3" /> Edit (15 min window)
                      </Button>
                    );
                  }}
                />
              </div>
            </FoldableCard>

            {/* Admin Remarks — shown only when enabled in System Settings */}
            {adminRemarksEnabled && (
            <FoldableCard title="Admin Remarks" icon={Shield}>
              <div className="space-y-4">
                {allowAdminRemark && (
                  <div className="flex gap-2">
                    <Input placeholder="Add instruction for counselor..." value={adminRemark} onChange={(e) => setAdminRemark(e.target.value)} />
                    <LoadingButton onClick={addAdminRemark} loading={actionLoading === 'admin-remark'} loadingText="Saving remark..." disabled={!adminRemark.trim()}>
                      Add
                    </LoadingButton>
                  </div>
                )}
                <Timeline section="remarks" remarkKind="admin" items={mapAdminRemarks(lead.adminRemarks, user?._id)} emptyMessage="No admin remarks yet" />
              </div>
            </FoldableCard>
            )}

            <FoldableCard
              title="Activity Timeline"
              icon={Activity}
              badge={
                activityItems.length > ACTIVITY_PREVIEW_LIMIT ? (
                  <span className="ml-auto text-[13px] font-normal text-muted-foreground">
                    {visibleActivities.length} of {activityItems.length}
                  </span>
                ) : null
              }
              contentClassName="space-y-3"
            >
              <Timeline section="activity" items={visibleActivities} emptyMessage="No activity recorded" />
              {activityItems.length > ACTIVITY_PREVIEW_LIMIT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30"
                  onClick={() => setShowAllActivities((prev) => !prev)}
                >
                  {showAllActivities ? 'Show recent activity' : 'View all activity'}
                </Button>
              )}
            </FoldableCard>

            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <GraduationCap className="h-5 w-5 text-primary" /> Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.status === 'closed' ? (
                  <p className="text-sm font-medium text-secondary">
                    {lead.course?.trim()
                      ? `Enrolled in course ${formatCourseLabel(lead.course)}`
                      : 'Enrolled (no course specified)'}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {lead.course?.trim()
                      ? `Interested in ${formatCourseLabel(lead.course)}. Mark status as Enrolled when the student joins.`
                      : 'No course listed yet. Add a course on the lead, then mark as Enrolled when the student joins.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-2 border-primary/25 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-secondary">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-secondary">Update Status</label>
                  <div className="relative">
                    <select
                      className="flex h-9 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      value={selectedStatus || ''}
                      onChange={(e) => onStatusSelect(e.target.value)}
                      disabled={actionLoading === 'save-update'}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {(allowCreatorRemark || allowAdminRemark) && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-secondary">
                        Remark {statusChanged ? '(for this update)' : '(optional)'}
                      </label>
                      {showQuickRemarkToggle && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickRemarkType('creator')}
                            className={`flex-1 rounded-md border px-2 py-1 text-xs ${quickRemarkType === 'creator' ? 'border-primary bg-primary/10' : ''}`}
                          >
                            Remark
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickRemarkType('admin')}
                            className={`flex-1 rounded-md border px-2 py-1 text-xs ${quickRemarkType === 'admin' ? 'border-primary bg-primary/10' : ''}`}
                          >
                            Admin
                          </button>
                        </div>
                      )}
                      <Input
                        placeholder={
                          (showQuickRemarkToggle && quickRemarkType === 'admin') || (!allowCreatorRemark && allowAdminRemark)
                            ? 'Add instruction for counselor...'
                            : statusChanged
                              ? 'Note about this status change…'
                              : 'Add a remark (same status is fine)…'
                        }
                        value={quickRemark}
                        onChange={(e) => setQuickRemark(e.target.value)}
                      />
                    </div>
                  )}

                  {statusDraft === 'closed' && statusChanged && (
                    <div className="space-y-3 rounded-md border border-primary/20 bg-white/80 p-3">
                      <p className="text-sm font-medium text-secondary">
                        {lead.course?.trim()
                          ? `Enrolled in course ${formatCourseLabel(lead.course)}`
                          : 'Mark as enrolled (no course on this lead yet)'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => persistStatusUpdate('closed', quickRemark)}
                          disabled={actionLoading === 'save-update'}
                        >
                          {actionLoading === 'save-update' ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            'Confirm Enrolled'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === 'save-update'}
                          onClick={() => { setStatusDraft(null); setStatusError(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!(statusDraft === 'closed' && statusChanged) && (
                    <LoadingButton
                      size="sm"
                      className="w-full"
                      onClick={handleSaveUpdate}
                      loading={actionLoading === 'save-update'}
                      loadingText="Saving..."
                      disabled={!canSaveUpdate}
                    >
                      Save Update
                    </LoadingButton>
                  )}
                  {statusError && <p className="text-xs text-destructive">{statusError}</p>}
                </div>

                <div className="space-y-2 border-t pt-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Next Follow-up
                  </label>
                  {lead.nextFollowUpDate && (
                    <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
                      <span className="font-medium tabular-nums text-foreground">
                        {formatDateTime(lead.nextFollowUpDate)}
                      </span>
                      <FollowUpCountdown date={lead.nextFollowUpDate} />
                      <button
                        type="button"
                        title="Cancel next follow-up"
                        disabled={actionLoading === 'cancel-follow-up'}
                        onClick={cancelNextFollowUp}
                        className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {actionLoading === 'cancel-follow-up'
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <X className="h-3 w-3" />}
                      </button>
                    </p>
                  )}
                  <DateTimePicker
                    value={quickFollowUpDate}
                    onChange={(date) => { setQuickFollowUpDate(date); setFollowUpError(''); }}
                    placeholder="Select date & time"
                    minDate={new Date()}
                  />
                  <Input
                    placeholder="Follow-up notes (optional)"
                    value={quickFollowUpNotes}
                    onChange={(e) => setQuickFollowUpNotes(e.target.value)}
                  />
                  {followUpError && <p className="text-xs text-destructive">{followUpError}</p>}
                  <LoadingButton
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={scheduleQuickFollowUp}
                    loading={actionLoading === 'quick-follow-up'}
                    loadingText="Scheduling..."
                    disabled={!quickFollowUpDate}
                  >
                    Schedule Follow-up
                  </LoadingButton>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => setFollowUpModalOpen(true)}
                  >
                    Open follow-up dialog
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 shadow-sm">
              <CardHeader><CardTitle className="text-base text-secondary">Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isAssigned && (
                  <AssigneeCell user={lead.assignedTo} department={lead.department} />
                )}
                <Button size="sm" className="w-full shadow-sm" onClick={() => setAssignModalOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isAssigned ? 'Reassign Lead' : 'Assign Lead'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AssignLeadModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        lead={lead}
        onSuccess={() => refetch()}
      />
      <QuickFollowUpModal
        open={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        lead={lead}
        onSuccess={() => refetch()}
      />
      <LeadFormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        lead={lead}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
