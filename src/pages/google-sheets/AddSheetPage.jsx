import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  CheckCircle2,
  Columns3,
  Link2,
  RefreshCw,
  Settings2,
  Sheet,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingButton from '@/components/ui/loading-button';
import FieldMappingEditor from '@/components/google-sheets/FieldMappingEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useGetConnectorQuery,
  useCreateConnectorMutation,
  useUpdateConnectorMutation,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  useGetMappingTemplatesQuery,
  useFetchConnectorHeadersMutation,
} from '@/store/api/apiSlice';
import {
  cn,
  ROLES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TARGET_FIELDS,
  CUSTOM_FIELD_TARGET,
  SYNC_MODE_OPTIONS,
  DUPLICATE_RULE_OPTIONS,
  SYNC_MODES,
  DUPLICATE_RULES,
} from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import LoadingState from '@/components/ui/loading-state';

const selectClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50';

function FormField({ label, required, children, hint, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionCard({ step, icon: Icon, title, description, action, children, className }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/70 bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {Icon ? <Icon className="h-4 w-4" /> : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {step && (
                  <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
                    Step {step}
                  </span>
                )}
                <CardTitle>{title}</CardTitle>
              </div>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

const defaultForm = {
  name: '',
  spreadsheetUrl: '',
  worksheetName: '',
  department: '',
  defaultLeadSource: 'website',
  defaultAssignedUser: '',
  defaultLeadStatus: 'new',
  defaultPriority: 'yellow',
  uniqueKeyColumn: '',
  headerRow: 1,
  autoSyncEnabled: false,
  syncIntervalMinutes: 60,
  syncMode: SYNC_MODES.INSERT_ONLY,
  duplicateRuleType: DUPLICATE_RULES.PHONE_EMAIL,
  duplicateCustomField: '',
  fieldMapping: [],
  mappingTemplateId: '',
  saveAsTemplate: false,
  templateName: '',
};

export default function AddSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isEdit = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: existing, isLoading: loadingExisting } = useGetConnectorQuery(id, { skip: !isEdit });
  const { data: deptData } = useGetDepartmentsQuery(undefined, {
    skip: !ENABLE_DEPARTMENTS || !isSuperAdmin,
  });
  const { data: usersData } = useGetUsersQuery({ limit: 200 });
  const { data: templatesData } = useGetMappingTemplatesQuery();

  const [createConnector, { isLoading: creating }] = useCreateConnectorMutation();
  const [updateConnector, { isLoading: updating }] = useUpdateConnectorMutation();
  const [fetchHeaders, { isLoading: fetchingHeaders }] = useFetchConnectorHeadersMutation();

  const departments = deptData?.data || [];
  const users = usersData?.data || [];
  const templates = templatesData?.data || [];

  useEffect(() => {
    if (!isEdit || !existing?.data) return;
    const c = existing.data;
    setForm({
      name: c.name || '',
      spreadsheetUrl: c.config?.spreadsheetUrl || '',
      worksheetName: c.config?.worksheetName || '',
      department: c.department?._id || c.department || '',
      defaultLeadSource: c.defaultLeadSource || 'website',
      defaultAssignedUser: c.defaultAssignedUser?._id || c.defaultAssignedUser || '',
      defaultLeadStatus: c.defaultLeadStatus || 'new',
      defaultPriority: c.defaultPriority || 'yellow',
      uniqueKeyColumn: c.uniqueKeyColumn || '',
      headerRow: c.headerRow || 1,
      autoSyncEnabled: Boolean(c.autoSyncEnabled),
      syncIntervalMinutes: c.syncIntervalMinutes || 60,
      syncMode: c.syncMode || SYNC_MODES.INSERT_ONLY,
      duplicateRuleType: c.duplicateRule?.type || DUPLICATE_RULES.PHONE_EMAIL,
      duplicateCustomField: c.duplicateRule?.customField || '',
      fieldMapping: c.fieldMapping || [],
      mappingTemplateId: c.mappingTemplate?._id || c.mappingTemplate || '',
      saveAsTemplate: false,
      templateName: '',
    });
    const mappedHeaders = (c.fieldMapping || [])
      .map((m) => m.sourceColumn)
      .filter(Boolean);
    if (mappedHeaders.length) setHeaders((prev) => [...new Set([...prev, ...mappedHeaders])]);
  }, [isEdit, existing]);

  useEffect(() => {
    if (ENABLE_DEPARTMENTS && !isSuperAdmin && user?.department) {
      const deptId = user.department._id || user.department;
      setForm((f) => ({ ...f, department: deptId }));
    }
  }, [isSuperAdmin, user]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleLoadTemplate = (templateId) => {
    set('mappingTemplateId', templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setForm((f) => ({
        ...f,
        mappingTemplateId: templateId,
        fieldMapping: template.fieldMapping || [],
        uniqueKeyColumn: template.uniqueKeyColumn || f.uniqueKeyColumn,
        headerRow: template.headerRow || f.headerRow,
      }));
    }
  };

  const handleFetchHeaders = async () => {
    setError('');
    if (!form.spreadsheetUrl.trim() || !form.worksheetName.trim()) {
      setError('Enter the spreadsheet URL and worksheet name before fetching headers');
      return;
    }
    try {
      const body = {
        spreadsheetUrl: form.spreadsheetUrl,
        worksheetName: form.worksheetName,
        headerRow: Number(form.headerRow) || 1,
      };
      if (isEdit) body.connectorId = id;
      const res = await fetchHeaders(body).unwrap();
      setHeaders(res.data?.headers || []);
    } catch (err) {
      setError(err?.data?.message || err.message || 'Failed to fetch headers');
    }
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    spreadsheetUrl: form.spreadsheetUrl.trim(),
    worksheetName: form.worksheetName.trim(),
    department: ENABLE_DEPARTMENTS ? (form.department || undefined) : undefined,
    defaultLeadSource: form.defaultLeadSource,
    defaultAssignedUser: form.defaultAssignedUser || undefined,
    defaultLeadStatus: form.defaultLeadStatus,
    defaultPriority: form.defaultPriority,
    uniqueKeyColumn: form.uniqueKeyColumn || undefined,
    headerRow: Number(form.headerRow) || 1,
    autoSyncEnabled: form.autoSyncEnabled,
    syncIntervalMinutes: Number(form.syncIntervalMinutes) || 60,
    syncMode: form.syncMode,
    duplicateRule: {
      type: form.duplicateRuleType,
      ...(form.duplicateRuleType === DUPLICATE_RULES.CUSTOM_COLUMN
        ? { customField: form.duplicateCustomField }
        : {}),
    },
    fieldMapping: form.fieldMapping,
    mappingTemplateId: form.mappingTemplateId || undefined,
    saveAsTemplate: form.saveAsTemplate,
    templateName: form.saveAsTemplate ? form.templateName.trim() : undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Sheet name is required');
      return;
    }
    if (!form.spreadsheetUrl.trim() || !form.worksheetName.trim()) {
      setError('Spreadsheet URL and worksheet name are required');
      return;
    }
    if (!form.fieldMapping.some((m) => m.targetField === 'name' && m.sourceColumn)) {
      setError('Name field mapping is required');
      return;
    }
    if (!form.fieldMapping.some((m) => m.targetField === 'phone' && m.sourceColumn)) {
      setError('Phone field mapping is required');
      return;
    }

    const customMaps = form.fieldMapping.filter((m) => m.targetField === CUSTOM_FIELD_TARGET);
    const blankLabel = customMaps.find((m) => !String(m.customLabel || '').trim());
    if (blankLabel) {
      setError(`Confirm a display label for column “${blankLabel.sourceColumn}”`);
      return;
    }

    setConfirmOpen(true);
  };

  const saveConnector = async () => {
    setError('');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateConnector({ id, ...payload }).unwrap();
      } else {
        await createConnector(payload).unwrap();
      }
      setConfirmOpen(false);
      navigate('/google-sheets');
    } catch (err) {
      setConfirmOpen(false);
      setError(err?.data?.message || err.message || 'Failed to save sheet');
    }
  };

  const syncModeOptions = SYNC_MODE_OPTIONS.filter(
    (o) => !o.superAdminOnly || isSuperAdmin
  );

  const coreMappings = form.fieldMapping.filter(
    (m) => m.targetField && m.targetField !== CUSTOM_FIELD_TARGET && m.sourceColumn
  );
  const customMappings = form.fieldMapping.filter(
    (m) => m.targetField === CUSTOM_FIELD_TARGET && m.sourceColumn
  );
  const coreLabel = (value) => LEAD_TARGET_FIELDS.find((f) => f.value === value)?.label || value;

  const mappingReady = useMemo(() => {
    const required = LEAD_TARGET_FIELDS.filter((f) => f.required).map((f) => f.value);
    const mapped = new Set(
      form.fieldMapping
        .filter((m) => m.targetField && m.targetField !== CUSTOM_FIELD_TARGET && m.sourceColumn)
        .map((m) => m.targetField)
    );
    return {
      requiredDone: required.every((k) => mapped.has(k)),
      mappedCount: mapped.size,
      customCount: customMappings.length,
      headersLoaded: headers.length > 0,
    };
  }, [form.fieldMapping, customMappings.length, headers.length]);

  if (isEdit && loadingExisting) {
    return (
      <div className="flex min-h-full flex-col">
        <Header title="Edit Sheet" description="Loading..." />
        <LoadingState message="Loading sheet configuration..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <Header
        title={isEdit ? 'Edit Sheet' : 'Add Google Sheet'}
        description="Connect a spreadsheet, set defaults, and map columns to lead fields"
      />

      <div className="flex-1 p-4 pb-28 sm:p-6 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground" asChild>
            <Link to="/google-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to sheets
            </Link>
          </Button>

          <form id="sheet-connector-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <SectionCard
              step={1}
              icon={Link2}
              title="Sheet connection"
              description="Link the Google Spreadsheet that should sync into Corizo Desk."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Connection name" required className="sm:col-span-2" hint="Shown in your sheets list and sync history.">
                  <Input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Website Leads — March"
                  />
                </FormField>
                <FormField
                  label="Spreadsheet URL"
                  required
                  className="sm:col-span-2"
                  hint="Paste the full Google Sheets link. Share the sheet with your service account if needed."
                >
                  <Input
                    value={form.spreadsheetUrl}
                    onChange={(e) => set('spreadsheetUrl', e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </FormField>
                <FormField label="Worksheet name" required hint="Exact tab name in the spreadsheet.">
                  <Input
                    value={form.worksheetName}
                    onChange={(e) => set('worksheetName', e.target.value)}
                    placeholder="Sheet1"
                  />
                </FormField>
                <FormField label="Header row" required hint="Row number that contains column titles.">
                  <Input
                    type="number"
                    min={1}
                    value={form.headerRow}
                    onChange={(e) => set('headerRow', e.target.value)}
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              step={2}
              icon={Settings2}
              title="Lead defaults"
              description="Values applied to every lead created from this sheet when the column is empty or unmapped."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {ENABLE_DEPARTMENTS && (
                  <FormField label="Department" required>
                    {isSuperAdmin ? (
                      <select
                        className={selectClass}
                        value={form.department}
                        onChange={(e) => set('department', e.target.value)}
                      >
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Input value={user?.department?.name || 'Your department'} disabled />
                    )}
                  </FormField>
                )}
                <FormField label="Default lead source">
                  <select
                    className={selectClass}
                    value={form.defaultLeadSource}
                    onChange={(e) => set('defaultLeadSource', e.target.value)}
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Default assignee">
                  <select
                    className={selectClass}
                    value={form.defaultAssignedUser}
                    onChange={(e) => set('defaultAssignedUser', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Default status">
                  <select
                    className={selectClass}
                    value={form.defaultLeadStatus}
                    onChange={(e) => set('defaultLeadStatus', e.target.value)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Default priority">
                  <select
                    className={selectClass}
                    value={form.defaultPriority}
                    onChange={(e) => set('defaultPriority', e.target.value)}
                  >
                    <option value="red">High</option>
                    <option value="yellow">Medium</option>
                    <option value="green">Low</option>
                  </select>
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              step={3}
              icon={RefreshCw}
              title="Sync behaviour"
              description="Control how often the sheet syncs and how duplicates are handled."
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Automatic sync</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Periodically pull new or updated rows from this sheet.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={form.autoSyncEnabled}
                      onChange={(e) => set('autoSyncEnabled', e.target.checked)}
                    />
                    <span className="h-6 w-11 rounded-full bg-muted-foreground/25 transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Sync interval (minutes)"
                    hint={form.autoSyncEnabled ? 'Minimum 5 minutes.' : 'Enable automatic sync to set an interval.'}
                  >
                    <Input
                      type="number"
                      min={5}
                      value={form.syncIntervalMinutes}
                      onChange={(e) => set('syncIntervalMinutes', e.target.value)}
                      disabled={!form.autoSyncEnabled}
                    />
                  </FormField>
                  <FormField label="Duplicate rule" hint="Used when deciding whether a row is already a lead.">
                    <select
                      className={selectClass}
                      value={form.duplicateRuleType}
                      onChange={(e) => set('duplicateRuleType', e.target.value)}
                    >
                      {DUPLICATE_RULE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Sync mode" className="sm:col-span-2">
                    <select
                      className={selectClass}
                      value={form.syncMode}
                      onChange={(e) => set('syncMode', e.target.value)}
                    >
                      {syncModeOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                  {form.duplicateRuleType === DUPLICATE_RULES.CUSTOM_COLUMN && (
                    <FormField label="Custom duplicate column" className="sm:col-span-2">
                      <Input
                        value={form.duplicateCustomField}
                        onChange={(e) => set('duplicateCustomField', e.target.value)}
                        placeholder="Column name used for duplicate checks"
                      />
                    </FormField>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              step={4}
              icon={Columns3}
              title="Column mapping"
              description="Map spreadsheet columns to lead fields. Required: Name and Phone."
              action={(
                <LoadingButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  loading={fetchingHeaders}
                  loadingText="Fetching..."
                  onClick={handleFetchHeaders}
                >
                  <Sheet className="mr-2 h-4 w-4" />
                  {headers.length ? 'Refresh headers' : 'Fetch headers'}
                </LoadingButton>
              )}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {mappingReady.headersLoaded ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {headers.length} columns loaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                      Fetch headers to start mapping
                    </span>
                  )}
                  {mappingReady.requiredDone ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Required fields mapped
                    </span>
                  ) : mappingReady.headersLoaded ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                      Map Name & Phone to continue
                    </span>
                  ) : null}
                  {mappingReady.customCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                      {mappingReady.customCount} additional field{mappingReady.customCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <FormField label="Load mapping template" hint="Optional. Apply a saved mapping, then adjust as needed.">
                  <select
                    className={selectClass}
                    value={form.mappingTemplateId}
                    onChange={(e) => handleLoadTemplate(e.target.value)}
                  >
                    <option value="">No template</option>
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </FormField>

                <FieldMappingEditor
                  headers={headers}
                  mapping={form.fieldMapping}
                  onChange={(mapping) => set('fieldMapping', mapping)}
                />

                <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.saveAsTemplate}
                      onChange={(e) => set('saveAsTemplate', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/40"
                    />
                    <span>
                      <span className="block text-sm font-medium">Save this mapping as a template</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Reuse these column mappings when connecting similar sheets later.
                      </span>
                    </span>
                  </label>
                  {form.saveAsTemplate && (
                    <Input
                      className="mt-3"
                      value={form.templateName}
                      onChange={(e) => set('templateName', e.target.value)}
                      placeholder="Template name"
                    />
                  )}
                </div>
              </div>
            </SectionCard>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isEdit ? 'Changes apply on the next sync.' : 'You’ll confirm field mapping before creating the connection.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/google-sheets')}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              form="sheet-connector-form"
              loading={creating || updating}
              loadingText="Saving..."
            >
              {isEdit ? 'Update sheet' : 'Continue'}
            </LoadingButton>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg" showClose={!creating && !updating}>
          <DialogHeader>
            <DialogTitle>Confirm field mapping</DialogTitle>
            <DialogDescription>
              Review core and additional columns before {isEdit ? 'updating' : 'creating'} this sheet connection.
              Only confirmed additional columns will appear on lead details.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core fields</p>
              <ul className="space-y-1 rounded-md border bg-muted/20 p-3">
                {coreMappings.map((m) => (
                  <li key={m.targetField} className="flex justify-between gap-2">
                    <span className="font-medium">{coreLabel(m.targetField)}</span>
                    <span className="truncate text-muted-foreground">← {m.sourceColumn}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Additional fields ({customMappings.length})
              </p>
              {customMappings.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-muted-foreground">
                  No extra sheet columns selected. Unmapped columns will be ignored.
                </p>
              ) : (
                <ul className="space-y-1 rounded-md border bg-muted/20 p-3">
                  {customMappings.map((m) => (
                    <li key={m.sourceColumn} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                      <span className="font-medium">{m.customLabel || m.sourceColumn}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        sheet: {m.sourceColumn} · key: {m.customKey}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={creating || updating} onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <LoadingButton
              type="button"
              loading={creating || updating}
              loadingText="Saving..."
              onClick={saveConnector}
            >
              Confirm & {isEdit ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
