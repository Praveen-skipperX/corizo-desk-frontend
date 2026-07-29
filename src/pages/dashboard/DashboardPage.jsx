import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Activity,
  Clock,
  ArrowRight,
  XCircle,
  CalendarClock,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import LoadingState from '@/components/ui/loading-state';
import { StatusChart, DepartmentChart, EmployeePerformanceChart } from '@/components/dashboard/Charts';
import FollowUpDashboardTables from '@/components/dashboard/FollowUpDashboardTables';
import LeadFormModal from '@/components/leads/LeadFormModal';
import { useGetDashboardQuery } from '@/store/api/apiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatRelativeTime, ROLES, formatStatus } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error } = useGetDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [editLead, setEditLead] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const dashboard = data?.data;
  const summary = dashboard?.summary || {};

  if (isLoading) {
    return (
      <div className="font-sans">
        <Header title="Dashboard" description="Loading dashboard data..." />
        <div className="space-y-5 bg-muted/50 p-4 sm:p-6">
          <LoadingState message="Loading dashboard data..." className="py-4" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-6 text-center font-sans text-destructive">Failed to load dashboard data</div>
      </div>
    );
  }

  const roleDescriptions = {
    [ROLES.SUPER_ADMIN]: 'Organization-wide lead and enrollment metrics',
    [ROLES.ADMIN]: ENABLE_DEPARTMENTS
      ? `Department analytics for ${user?.department?.name || 'your team'}`
      : 'Team analytics and counselor performance',
    [ROLES.EMPLOYEE]: 'Your personal lead and follow-up metrics',
  };

  return (
    <div className="flex min-h-full flex-col font-sans">
      <Header title="Dashboard" description={roleDescriptions[user?.role]} />

      <div className="flex-1 space-y-5 bg-muted/50 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Leads"
            value={summary.totalLeads?.toLocaleString() || '0'}
            icon={FileText}
            variant="default"
            tooltip="All leads visible in your scope."
          />
          <StatCard
            title="Follow-ups Today"
            value={summary.todayFollowUps || '0'}
            icon={Calendar}
            variant="followup"
            subtitle="Due today"
            tooltip="Leads with follow-up scheduled for today."
          />
          <StatCard
            title="Pending Follow-ups"
            value={((summary.todayFollowUps || 0) + (summary.overdueFollowUps || 0)).toLocaleString()}
            icon={CalendarClock}
            variant="open"
            subtitle={`${summary.overdueFollowUps || 0} overdue`}
            tooltip="Today's and overdue follow-ups combined."
          />
          <StatCard
            title="Enrolled Leads"
            value={summary.closedWon?.toLocaleString() || '0'}
            icon={CheckCircle2}
            variant="closed"
            subtitle="Course enrollments"
            tooltip="Leads marked as enrolled."
          />
          <StatCard
            title="Not Interested"
            value={summary.closedLost?.toLocaleString() || '0'}
            icon={XCircle}
            variant="default"
            tooltip="Leads marked as not interested."
          />
        </div>

        {user?.role === ROLES.SUPER_ADMIN && summary.lockedAccounts > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
              <Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[14px] font-semibold text-red-900">
                {summary.lockedAccounts} account(s) locked
              </p>
              <p className="font-sans text-[13px] text-red-700">
                Review and unlock accounts in Security settings
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          </div>
        )}

        <FollowUpDashboardTables
          onEditLead={(lead) => {
            setEditLead(lead);
            setEditModalOpen(true);
          }}
        />

        <div className={cn('grid gap-5', ENABLE_DEPARTMENTS && user?.role !== ROLES.EMPLOYEE ? 'lg:grid-cols-2' : '')}>
          <StatusChart
            data={dashboard?.charts?.statusDistribution || []}
            tooltip="Breakdown of leads by current status."
          />
          {ENABLE_DEPARTMENTS && user?.role !== ROLES.EMPLOYEE && (
            <DepartmentChart
              data={dashboard?.charts?.departmentDistribution || []}
              tooltip="Lead distribution by department."
            />
          )}
        </div>

        {user?.role !== ROLES.EMPLOYEE && (
          <EmployeePerformanceChart
            data={dashboard?.charts?.employeePerformance || []}
            tooltip="Top performing counselors by lead volume."
          />
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 border-b py-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
              <Activity className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <CardTitle className="flex-1 font-sans text-[15px] font-semibold tracking-tight text-secondary">
              Recent Activity
            </CardTitle>
            <Link to="/audit-logs" className="inline-flex items-center gap-1 font-sans text-[13px] font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/70">
              {dashboard?.recentActivities?.length > 0 ? (
                dashboard.recentActivities.map((activity) => (
                  <li key={activity._id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/25">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[14px] text-foreground">
                        {activity.description || formatStatus(activity.action)}
                      </p>
                      <p className="font-sans text-[12px] text-muted-foreground">{activity.userName}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 font-sans text-[12px] tabular-nums text-muted-foreground">
                      <Clock className="h-3 w-3 opacity-60" />
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-10 text-center font-sans text-[14px] text-muted-foreground">
                  No recent activity
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {editModalOpen && (
        <LeadFormModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          lead={editLead}
        />
      )}
    </div>
  );
}
