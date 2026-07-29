import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
};

export const PRIORITY_COLORS = {
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export const PRIORITY_CONFIG = {
  red: {
    label: 'High Priority',
    shortLabel: 'High',
    color: '#EF4444',
    softBg: '#FEE2E2',
    softText: '#991B1B',
    border: '#FECACA',
    description: 'Urgent lead requiring immediate attention.',
  },
  yellow: {
    label: 'Medium Priority',
    shortLabel: 'Medium',
    color: '#F59E0B',
    softBg: '#FEF3C7',
    softText: '#92400E',
    border: '#FDE68A',
    description: 'Standard priority — follow up within the normal schedule.',
  },
  green: {
    label: 'Low Priority',
    shortLabel: 'Low',
    color: '#22C55E',
    softBg: '#DCFCE7',
    softText: '#166534',
    border: '#BBF7D0',
    description: 'Low urgency — can be addressed when capacity allows.',
  },
};

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'manual', label: 'Manual Entry' },
];

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'connected', label: 'Connected' },
  { value: 'interested', label: 'Interested' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'spam', label: 'Spam' },
  { value: 'closed', label: 'Enrolled' },
];

export const STATUS_COLORS = {
  new: 'bg-brand-soft text-primary',
  assigned: 'bg-violet-50 text-violet-700',
  attempted: 'bg-indigo-50 text-indigo-700',
  connected: 'bg-sky-50 text-sky-700',
  interested: 'bg-emerald-50 text-emerald-700',
  follow_up: 'bg-orange-50 text-orange-700',
  not_interested: 'bg-gray-100 text-gray-600',
  duplicate: 'bg-amber-50 text-amber-700',
  spam: 'bg-red-50 text-red-700',
  closed: 'bg-emerald-50 text-emerald-700',
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/**
 * If course is a URL/path (e.g. https://corizo.in/explore-programs/corporate-law/),
 * show the last segment as a readable label: "Corporate Law".
 * Non-URL course values are returned unchanged.
 */
export function formatCourseLabel(course) {
  if (course == null) return '';
  const raw = String(course).trim();
  if (!raw) return '';

  let slug = null;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const parts = new URL(raw).pathname.split('/').filter(Boolean);
      slug = parts[parts.length - 1] || null;
    } else if (raw.includes('/') && !/\s/.test(raw)) {
      const parts = raw.split('/').filter(Boolean);
      slug = parts[parts.length - 1] || null;
    }
  } catch {
    slug = null;
  }

  if (!slug) return raw;

  return slug
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

/** Excel serial days since 1899-12-30 → JS Date (UTC midnight). */
export function excelSerialToDate(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n < 20000 || n > 100000) return null;
  return new Date(Math.round((n - 25569) * 86400 * 1000));
}

/** Parse sheet date: Excel serial, ISO, or common date strings. */
export function parseSheetDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const asExcel = excelSerialToDate(raw);
    if (asExcel) return asExcel;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // dd/mm/yyyy or dd-mm-yyyy
  const m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

const LEAD_DATE_FIELD_RE = /^(date|lead_?date|enquiry_?date|inquiry_?date|getting_?date|lead_?getting_?date|submission_?date|submitted_?on)$/i;
const LEAD_DATE_LABEL_RE = /^(date|lead date|enquiry date|inquiry date|getting date|lead getting date|submission date|submitted on)$/i;

/** Lead getting date from sheet custom fields / original row (falls back to createdAt). */
export function getLeadGettingDate(lead) {
  if (!lead) return null;

  if (lead.leadDate) {
    const d = new Date(lead.leadDate);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const custom = Array.isArray(lead.customFields)
    ? lead.customFields.find(
      (f) => LEAD_DATE_FIELD_RE.test(f?.key || '') || LEAD_DATE_LABEL_RE.test(f?.label || '')
    )
    : null;
  if (custom?.value != null && custom.value !== '') {
    const d = parseSheetDate(custom.value);
    if (d) return d;
  }

  const row = lead.importMeta?.originalRow;
  if (row && typeof row === 'object') {
    const entry = Object.entries(row).find(([k]) => LEAD_DATE_LABEL_RE.test(String(k).trim()));
    if (entry) {
      const d = parseSheetDate(entry[1]);
      if (d) return d;
    }
  }

  return lead.createdAt ? new Date(lead.createdAt) : null;
}

export function formatLeadGettingDate(lead) {
  const d = getLeadGettingDate(lead);
  return d ? formatDate(d) : '—';
}

export const formatStatus = (status) =>
  status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDateTime(date);
};

/**
 * Break down remaining (or overdue) time until a target date.
 * @returns {{ overdue: boolean, days: number, hours: number, minutes: number, ms: number } | null}
 */
export function getCountdownTo(date, now = Date.now()) {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  const ms = target - now;
  const abs = Math.abs(ms);
  const totalMins = Math.floor(abs / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const minutes = totalMins % 60;
  return { overdue: ms < 0, days, hours, minutes, ms };
}

/** Human label e.g. "2 days 5 hrs left" / "Overdue by 1 day 3 hrs". */
export function formatCountdownLabel(date, now = Date.now()) {
  const c = getCountdownTo(date, now);
  if (!c) return null;

  const parts = [];
  if (c.days > 0) parts.push(`${c.days} day${c.days === 1 ? '' : 's'}`);
  if (c.hours > 0) parts.push(`${c.hours} hr${c.hours === 1 ? '' : 's'}`);
  if (c.days === 0 && (c.hours === 0 || c.minutes > 0)) {
    parts.push(`${c.minutes} min${c.minutes === 1 ? '' : 's'}`);
  }
  if (!parts.length) parts.push('less than a minute');

  const span = parts.join(' ');
  return {
    text: c.overdue ? `Overdue by ${span}` : `${span} left`,
    short: c.overdue ? `Overdue · ${span}` : span,
    overdue: c.overdue,
    ...c,
  };
}

export const formatDuration = (ms) => {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem ? `${mins}m ${rem}s` : `${mins}m`;
};

export const GOOGLE_SHEETS_TYPE = 'google_sheets';

export const LEAD_TARGET_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'phone', label: 'Phone', required: true },
  { value: 'email', label: 'Email' },
  { value: 'course', label: 'Course' },
  { value: 'source', label: 'Source' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

/** Marker target for confirmed dynamic sheet columns stored on Lead.customFields */
export const CUSTOM_FIELD_TARGET = '__custom__';

export function sanitizeCustomFieldKey(input) {
  if (!input || typeof input !== 'string') return '';
  let key = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!key) key = 'field';
  if (/^[0-9]/.test(key)) key = `f_${key}`;
  return key.slice(0, 64);
}

export const SYNC_MODES = {
  INSERT_ONLY: 'insert_only',
  INSERT_UPDATE: 'insert_update',
  FULL_REPLACE: 'full_replace',
};

export const SYNC_MODE_OPTIONS = [
  { value: SYNC_MODES.INSERT_ONLY, label: 'Insert Only' },
  { value: SYNC_MODES.INSERT_UPDATE, label: 'Insert + Update' },
  { value: SYNC_MODES.FULL_REPLACE, label: 'Full Replace', superAdminOnly: true },
];

export const DUPLICATE_RULES = {
  PHONE: 'phone',
  EMAIL: 'email',
  PHONE_EMAIL: 'phone_email',
  CUSTOM_COLUMN: 'custom_column',
};

export const DUPLICATE_RULE_OPTIONS = [
  { value: DUPLICATE_RULES.PHONE, label: 'Phone' },
  { value: DUPLICATE_RULES.EMAIL, label: 'Email' },
  { value: DUPLICATE_RULES.PHONE_EMAIL, label: 'Phone + Email' },
  { value: DUPLICATE_RULES.CUSTOM_COLUMN, label: 'Custom Column' },
];

export const CONNECTOR_STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const HEALTH_STATUS_COLORS = {
  connected: 'text-emerald-600',
  ok: 'text-emerald-600',
  disconnected: 'text-red-600',
  denied: 'text-red-600',
  error: 'text-red-600',
  degraded: 'text-amber-600',
  unknown: 'text-muted-foreground',
  unconfigured: 'text-muted-foreground',
};

export const formatHealthStatus = (status) =>
  status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
