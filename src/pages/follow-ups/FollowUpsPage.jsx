import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FollowUpItemCard } from '@/components/ui/compact-cards';
import { CardSkeleton } from '@/components/ui/skeleton';
import LoadingState from '@/components/ui/loading-state';
import { useGetFollowUpDashboardQuery, useGetFollowUpsQuery } from '@/store/api/apiSlice';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Sun,
} from 'lucide-react';

const SECTION_CONFIG = {
  overdue: {
    shell: 'border-red-300 bg-white shadow-md ring-1 ring-red-100',
    header: 'border-b border-red-200 bg-red-50',
    accent: 'border-red-500',
    iconWrap: 'bg-red-600 text-white',
    badge: 'bg-red-600 text-white',
    title: 'text-red-950',
    empty: 'text-red-800',
    Icon: AlertTriangle,
    emptyIcon: Inbox,
  },
  today: {
    shell: 'border-primary/50 bg-white shadow-md ring-1 ring-primary/15',
    header: 'border-b border-primary/25 bg-primary/10',
    accent: 'border-primary',
    iconWrap: 'bg-secondary text-primary',
    badge: 'bg-secondary text-white',
    title: 'text-secondary',
    empty: 'text-amber-900',
    Icon: Sun,
    emptyIcon: CalendarCheck,
  },
  tomorrow: {
    shell: 'border-blue-300 bg-white shadow-md ring-1 ring-blue-100',
    header: 'border-b border-blue-200 bg-blue-50',
    accent: 'border-blue-500',
    iconWrap: 'bg-blue-600 text-white',
    badge: 'bg-blue-600 text-white',
    title: 'text-blue-950',
    empty: 'text-blue-800',
    Icon: CalendarDays,
    emptyIcon: CalendarClock,
  },
  upcoming: {
    shell: 'border-violet-300 bg-white shadow-md ring-1 ring-violet-100',
    header: 'border-b border-violet-200 bg-violet-50',
    accent: 'border-violet-500',
    iconWrap: 'bg-violet-600 text-white',
    badge: 'bg-violet-600 text-white',
    title: 'text-violet-950',
    empty: 'text-violet-800',
    Icon: CalendarClock,
    emptyIcon: CalendarDays,
  },
  completed: {
    shell: 'border-emerald-300 bg-white shadow-md ring-1 ring-emerald-100',
    header: 'border-b border-emerald-200 bg-emerald-50',
    accent: 'border-emerald-500',
    iconWrap: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-600 text-white',
    title: 'text-emerald-950',
    empty: 'text-emerald-800',
    Icon: CheckCircle2,
    emptyIcon: CalendarCheck,
  },
};

const TABS = [
  { id: 'today', label: 'Today', variant: 'today', countKey: 'today' },
  { id: 'tomorrow', label: 'Tomorrow', variant: 'tomorrow', countKey: 'tomorrow' },
  { id: 'upcoming', label: 'Upcoming', variant: 'upcoming', countKey: 'upcoming' },
  { id: 'overdue', label: 'Overdue', variant: 'overdue', countKey: 'overdue' },
  { id: 'completed', label: 'Completed', variant: 'completed', countKey: 'completed' },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function followUpToLeadShape(followUp) {
  const lead = followUp.lead || {};
  return {
    _id: lead._id || followUp._id,
    name: lead.name || 'Unknown',
    leadId: lead.leadId || '—',
    phone: lead.phone,
    priority: lead.priority,
    status: lead.status,
    nextFollowUpDate: followUp.scheduledDate,
    department: followUp.department,
  };
}

function bucketFollowUps(followUps) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = new Date(todayEnd);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = endOfDay(tomorrowStart);

  const completed = [];
  const upcoming = [];

  followUps.forEach((f) => {
    const scheduled = new Date(f.scheduledDate);
    if (f.status === 'completed') {
      completed.push(followUpToLeadShape(f));
      return;
    }
    if (f.status === 'cancelled') return;
    if (scheduled > tomorrowEnd) {
      upcoming.push(followUpToLeadShape(f));
    }
  });

  return { upcoming, completed };
}

function FollowUpList({ title, items, variant, emptyMessage, description }) {
  const cfg = SECTION_CONFIG[variant] || SECTION_CONFIG.today;
  const { Icon, emptyIcon: EmptyIcon } = cfg;

  return (
    <Card className={cn('overflow-hidden rounded-xl', cfg.shell)}>
      <CardHeader className={cn('py-2.5 px-4', cfg.header)}>
        <CardTitle className={cn('flex items-center gap-2.5 font-sans text-[14px] font-semibold tracking-tight', cfg.title)}>
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md shadow-sm', cfg.iconWrap)}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          <span className="hidden text-[12px] font-normal text-muted-foreground sm:inline">{description}</span>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums', cfg.badge)}>
            {items?.length || 0}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 bg-slate-50/80 p-2">
        {items?.length > 0 ? (
          items.map((lead) => (
            <FollowUpItemCard key={lead._id} lead={lead} variant={variant} asLink />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border bg-white px-3 py-6 text-center">
            <EmptyIcon className={cn('mx-auto mb-1.5 h-6 w-6 opacity-60', cfg.title)} />
            <p className={cn('font-sans text-[13px] font-medium', cfg.empty)}>{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const { data, isLoading: dashboardLoading } = useGetFollowUpDashboardQuery();
  const { data: followUpsData, isLoading: followUpsLoading } = useGetFollowUpsQuery({ limit: 200, sortOrder: 'asc' });

  const dashboard = data?.data || {};
  const followUps = followUpsData?.data || [];
  const { upcoming, completed } = useMemo(() => bucketFollowUps(followUps), [followUps]);

  const buckets = {
    today: dashboard.today || [],
    tomorrow: dashboard.tomorrow || [],
    overdue: dashboard.overdue || [],
    upcoming,
    completed,
  };

  const isLoading = dashboardLoading || followUpsLoading;
  const activeConfig = TABS.find((t) => t.id === activeTab) || TABS[0];
  const activeItems = buckets[activeTab] || [];
  const totalCount = Object.values(buckets).reduce((sum, items) => sum + (items?.length || 0), 0);

  const tabDescriptions = {
    today: 'Due today',
    tomorrow: 'Up next',
    upcoming: 'Later this week and beyond',
    overdue: 'Past due',
    completed: 'Recently completed follow-ups',
  };

  const tabEmptyMessages = {
    today: 'Nothing scheduled for today',
    tomorrow: 'Tomorrow is clear',
    upcoming: 'No upcoming follow-ups scheduled',
    overdue: 'No overdue follow-ups',
    completed: 'No completed follow-ups yet',
  };

  return (
    <div className="flex min-h-full flex-col font-sans">
      <Header
        title="Follow-ups"
        description="Today, tomorrow, upcoming, overdue, and completed follow-ups"
      />

      <div className="flex-1 space-y-5 bg-muted/50 p-4 sm:p-6">
        {!isLoading && (
          <div className="flex flex-wrap gap-2 rounded-lg border border-primary/20 bg-white p-1.5 shadow-sm">
            {TABS.map((tab) => {
              const cfg = SECTION_CONFIG[tab.variant];
              const count = buckets[tab.countKey]?.length || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-secondary hover:bg-primary/10'
                  )}
                >
                  <cfg.Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      activeTab === tab.id ? 'bg-white/20 text-primary-foreground' : cfg.badge
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <LoadingState message="Loading follow-ups..." className="py-4" />
            {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : totalCount === 0 ? (
          <Card className="border border-dashed border-primary/40 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <CalendarCheck className="mx-auto mb-2 h-9 w-9 text-primary" strokeWidth={1.75} />
              <p className="font-sans text-[15px] font-semibold text-secondary">All clear for now</p>
              <p className="mt-0.5 font-sans text-[13px] text-muted-foreground">
                No follow-ups in any bucket.
              </p>
            </CardContent>
          </Card>
        ) : (
          <FollowUpList
            title={activeConfig.label}
            description={tabDescriptions[activeTab]}
            items={activeItems}
            variant={activeConfig.variant}
            emptyMessage={tabEmptyMessages[activeTab]}
          />
        )}
      </div>
    </div>
  );
}
