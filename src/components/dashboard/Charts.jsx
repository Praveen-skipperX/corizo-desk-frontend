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
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';

const COLORS = ['#6E25A4', '#8E3FD3', '#A855F7', '#C084FC', '#DDD6FE', '#6B7280', '#F97316'];

function ChartCard({ title, tooltip, icon: Icon, children }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 border-b py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <CardTitle className="flex-1 text-[15px] font-semibold tracking-tight text-foreground">{title}</CardTitle>
        {tooltip && <InfoTooltip content={tooltip} />}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function StatusChart({ data, tooltip }) {
  return (
    <ChartCard title="Lead Status Distribution" tooltip={tooltip} icon={PieChartIcon}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label={{ fontSize: 11 }}>
            {data?.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name?.replace(/_/g, ' ')]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueChart({ data, tooltip }) {
  return (
    <ChartCard title="Monthly Revenue Trends" tooltip={tooltip} icon={LineChartIcon}>
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
  return (
    <ChartCard title="Department Performance" tooltip={tooltip} icon={BarChart3}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="total" fill="#F5BB04" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EmployeePerformanceChart({ data, tooltip }) {
  return (
    <ChartCard title="Employee Performance" tooltip={tooltip} icon={Users}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={96} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="won" fill="#F5BB04" name="Won" radius={[0, 4, 4, 0]} />
          <Bar dataKey="total" fill="#3B3F42" name="Total" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
