import { useState } from 'react';
import Header from '@/components/layout/Header';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import LoadingState from '@/components/ui/loading-state';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

const reportTypes = [
  { id: 'lead', label: 'Lead Report', description: 'All leads with status, priority, assignment, source, and dates.' },
  { id: 'employee', label: 'Counselor Report', description: 'Counselor workload, assignments, and conversion metrics.' },
  { id: 'lead', label: 'Source Report', description: 'Leads grouped by acquisition source channel.', reportKey: 'source' },
  { id: 'lead', label: 'Course Report', description: 'Leads grouped by course interest.', reportKey: 'course' },
];

export default function ReportsPage() {
  const [type, setType] = useState('lead');
  const [selectedLabel, setSelectedLabel] = useState('Lead Report');
  const [format, setFormat] = useState('excel');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleSelectReport = (rt) => {
    setType(rt.id);
    setSelectedLabel(rt.label);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type, format });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const ext = format === 'excel' ? 'xlsx' : format;
      const slug = selectedLabel.toLowerCase().replace(/\s+/g, '-');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Header title="Reports" description="Generate and export lead reports with date filtering" />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generate Report
              <InfoTooltip content="Export reports in Excel (.xlsx), CSV, or PDF format. Apply date filters to narrow results." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {reportTypes.map((rt) => (
                <button
                  key={rt.reportKey || rt.id}
                  onClick={() => handleSelectReport(rt)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedLabel === rt.label ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium">{rt.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rt.description}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">From Date</label>
                <input type="date" className="h-10 rounded-md border px-3 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">To Date</label>
                <input type="date" className="h-10 rounded-md border px-3 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Format</label>
                <div className="flex gap-2">
                  {['excel', 'csv', 'pdf'].map((f) => (
                    <Button key={f} variant={format === f ? 'default' : 'outline'} size="sm" onClick={() => setFormat(f)}>
                      {f === 'excel' && <FileSpreadsheet className="mr-1 h-4 w-4" />}
                      {f === 'csv' && <FileText className="mr-1 h-4 w-4" />}
                      {f === 'pdf' && <Download className="mr-1 h-4 w-4" />}
                      {f.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <LoadingButton onClick={handleExport} loading={exporting} loadingText="Preparing export..." disabled={exporting}>
                <Download className="mr-2 h-4 w-4" /> Export {selectedLabel}
              </LoadingButton>
            </div>
            {exporting && <LoadingState message="Generating report..." className="py-8" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
