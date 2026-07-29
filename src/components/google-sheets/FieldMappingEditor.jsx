import { ArrowRight, Columns3 } from 'lucide-react';
import { cn, LEAD_TARGET_FIELDS, CUSTOM_FIELD_TARGET, sanitizeCustomFieldKey } from '@/lib/utils';

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40';

/**
 * Maps sheet headers → system lead fields and optional confirmed custom fields.
 * Custom columns are never auto-imported; user must enable + confirm label.
 */
export default function FieldMappingEditor({ headers = [], mapping = [], onChange }) {
  const systemMappedColumns = new Set(
    mapping
      .filter((m) => m.targetField && m.targetField !== CUSTOM_FIELD_TARGET && m.sourceColumn)
      .map((m) => m.sourceColumn)
  );

  const getSystemSource = (targetField) =>
    mapping.find((m) => m.targetField === targetField)?.sourceColumn || '';

  const getCustomEntry = (sourceColumn) =>
    mapping.find(
      (m) => m.targetField === CUSTOM_FIELD_TARGET && m.sourceColumn === sourceColumn
    );

  const upsertSystem = (targetField, sourceColumn, required = false) => {
    let next = mapping.filter((m) => m.targetField !== targetField);
    if (sourceColumn) {
      next = next.filter(
        (m) => !(m.targetField === CUSTOM_FIELD_TARGET && m.sourceColumn === sourceColumn)
      );
      next.push({ targetField, sourceColumn, required });
    }
    onChange(next);
  };

  const toggleCustom = (sourceColumn, enabled) => {
    let next = mapping.filter(
      (m) => !(m.targetField === CUSTOM_FIELD_TARGET && m.sourceColumn === sourceColumn)
    );
    if (enabled) {
      next.push({
        targetField: CUSTOM_FIELD_TARGET,
        sourceColumn,
        customKey: sanitizeCustomFieldKey(sourceColumn),
        customLabel: sourceColumn,
        required: false,
      });
    }
    onChange(next);
  };

  const updateCustomLabel = (sourceColumn, customLabel) => {
    onChange(
      mapping.map((m) => {
        if (m.targetField !== CUSTOM_FIELD_TARGET || m.sourceColumn !== sourceColumn) return m;
        return {
          ...m,
          customLabel,
          customKey: sanitizeCustomFieldKey(customLabel || sourceColumn),
        };
      })
    );
  };

  if (!headers.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Columns3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No columns loaded yet</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Fetch headers from your spreadsheet to map core lead fields and optionally import extra columns.
        </p>
      </div>
    );
  }

  const extraHeaders = [
    ...headers.filter((h) => !systemMappedColumns.has(h)),
    ...mapping
      .filter((m) => m.targetField === CUSTOM_FIELD_TARGET && m.sourceColumn && !headers.includes(m.sourceColumn))
      .map((m) => m.sourceColumn)
      .filter((h) => !systemMappedColumns.has(h)),
  ];
  const uniqueExtraHeaders = [...new Set(extraHeaders)];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/40 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Core lead fields
          </p>
        </div>
        <div className="divide-y divide-border">
          {LEAD_TARGET_FIELDS.map((field) => {
            const mapped = Boolean(getSystemSource(field.value));
            return (
              <div
                key={field.value}
                className={cn(
                  'grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] sm:items-center',
                  field.required && !mapped && 'bg-amber-50/40'
                )}
              >
                <div>
                  <p className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </p>
                  {field.required && !mapped && (
                    <p className="mt-0.5 text-[11px] text-amber-700">Required before saving</p>
                  )}
                </div>
                <ArrowRight className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:block" />
                <select
                  className={selectClass}
                  value={getSystemSource(field.value)}
                  onChange={(e) => upsertSystem(field.value, e.target.value, field.required)}
                >
                  <option value="">Not mapped</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/40 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Additional sheet columns
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enable a column to import it as a dynamic field. Confirm the display label before saving.
          </p>
        </div>

        {uniqueExtraHeaders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            All fetched columns are already mapped to core fields.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {uniqueExtraHeaders.map((header) => {
              const custom = getCustomEntry(header);
              const enabled = Boolean(custom);
              return (
                <div
                  key={header}
                  className={cn('px-4 py-3 transition-colors', enabled && 'bg-primary/[0.03]')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex min-w-0 cursor-pointer items-center gap-2.5 text-sm font-medium">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/40"
                        checked={enabled}
                        onChange={(e) => toggleCustom(header, e.target.checked)}
                      />
                      <span className="truncate">{header}</span>
                    </label>
                    {enabled && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                        {custom.customKey || sanitizeCustomFieldKey(header)}
                      </span>
                    )}
                  </div>
                  {enabled && (
                    <div className="mt-2.5 pl-6">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Display label on lead detail
                      </label>
                      <input
                        className={selectClass}
                        value={custom.customLabel || header}
                        onChange={(e) => updateCustomLabel(header, e.target.value)}
                        placeholder={header}
                        maxLength={100}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
