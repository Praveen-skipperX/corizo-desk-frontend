import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  GraduationCap,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { formatCourseLabel, formatStatus, LEAD_SOURCES } from '@/lib/utils';

const COLORS = ['#6E25A4', '#8E3FD3', '#A855F7', '#C084FC', '#DDD6FE', '#6B7280', '#F97316', '#10B981'];

function ChartCard({ title, tooltip, icon: Icon, children, empty }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 border-b py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <CardTitle className="flex-1 text-[15px] font-semibold tracking-tight text-foreground">{title}</CardTitle>
        {tooltip && <InfoTooltip content={tooltip} />}
      </CardHeader>
      <CardContent className="pt-4">
        {empty ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function sourceLabel(value) {
  return LEAD_SOURCES.find((s) => s.value === value)?.label || formatStatus(value);
}

export function StatusChart({ data, tooltip }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    label: formatStatus(d.name),
  }));

  return (
    <ChartCard title="Lead Status Distribution" tooltip={tooltip} icon={PieChartIcon} empty={!chartData.length}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={88}
            label={{ fontSize: 11 }}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SourceChart({ data, tooltip }) {
  const chartData = (data || []).map((d) => ({
    name: sourceLabel(d.name),
    value: d.value,
  }));

  return (
    <ChartCard title="Lead Sources" tooltip={tooltip} icon={Megaphone} empty={!chartData.length}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [value, 'Leads']} />
          <Bar dataKey="value" fill="#6E25A4" radius={[0, 4, 4, 0]} name="Leads" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CourseEnrollmentsChart({ data, tooltip }) {
  const chartData = (data || []).map((d) => ({
    name: formatCourseLabel(d.name) || d.name || 'Unknown',
    value: d.value,
  }));

  return (
    <ChartCard
      title="Course-wise Enrollments"
      tooltip={tooltip}
      icon={GraduationCap}
      empty={!chartData.length}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ bottom: 48, left: 4, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={56}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [value, 'Enrollments']} />
          <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} name="Enrollments" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CourseInterestChart({ data, tooltip }) {
  const chartData = (data || []).map((d) => ({
    name: formatCourseLabel(d.name) || d.name || 'Unknown',
    value: d.value,
  }));

  return (
    <ChartCard
      title="Course-wise Lead Interest"
      tooltip={tooltip}
      icon={GraduationCap}
      empty={!chartData.length}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={120}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => (v?.length > 18 ? `${v.slice(0, 16)}…` : v)}
          />
          <Tooltip formatter={(value) => [value, 'Leads']} />
          <Bar dataKey="value" fill="#8E3FD3" radius={[0, 4, 4, 0]} name="Leads" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function LeadsTrendChart({ data, tooltip }) {
  const chartData = data || [];

  return (
    <ChartCard
      title="Last 14 Days (Sheet Date)"
      tooltip={tooltip}
      icon={LineChartIcon}
      empty={!chartData.length}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="leads"
            name="New leads"
            stroke="#6E25A4"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="enrollments"
            name="Enrollments"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueChart({ data, tooltip }) {
  return (
    <ChartCard title="Monthly Revenue Trends" tooltip={tooltip} icon={LineChartIcon} empty={!data?.length}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`₹${value?.toLocaleString('en-IN')}`, 'Revenue']} />
          <Line type="monotone" dataKey="revenue" stroke="#F5BB04" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DepartmentChart({ data, tooltip }) {
  const chartData = (data || []).map((d) => ({
    name: d.name,
    value: d.count ?? d.total ?? 0,
  }));

  return (
    <ChartCard title="Department Performance" tooltip={tooltip} icon={BarChart3} empty={!chartData.length}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#F5BB04" radius={[4, 4, 0, 0]} name="Leads" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
