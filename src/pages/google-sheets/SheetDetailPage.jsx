import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, RefreshCw, Eye, Pencil } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailGrid, KeyValue } from '@/components/ui/detail-grid';
import ImportPreviewModal from '@/components/google-sheets/ImportPreviewModal';
import LoadingState from '@/components/ui/loading-state';
import {
  useGetConnectorQuery,
  useGetConnectorHealthQuery,
  useSyncConnectorMutation,
  usePreviewConnectorImportMutation,
  useConfirmConnectorImportMutation,
} from '@/store/api/apiSlice';
import { trackSyncJobs } from '@/store/syncProgressSlice';
import {
  cn,
  formatDateTime,
  formatHealthStatus,
  HEALTH_STATUS_COLORS,
  CONNECTOR_STATUS_COLORS,
  formatStatus,
} from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';

function HealthItem({ label, value }) {
  const color = HEALTH_STATUS_COLORS[value] || HEALTH_STATUS_COLORS.unknown;
  return (
    <KeyValue label={label}>
      <span className={cn('capitalize', color)}>{formatHealthStatus(value)}</span>
    </KeyValue>
  );
}

export default function SheetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const { data, isLoading, refetch } = useGetConnectorQuery(id);
  const { data: healthData, refetch: refetchHealth, isFetching: healthLoading } = useGetConnectorHealthQuery(id);
  const [syncConnector, { isLoading: syncing }] = useSyncConnectorMutation();
  const [previewImport, { isLoading: previewing }] = usePreviewConnectorImportMutation();
  const [confirmImport, { isLoading: confirming }] = useConfirmConnectorImportMutation();

  const sheet = data?.data;
  const health = healthData?.data || sheet?.health || {};

  const handleRefreshHealth = () => refetchHealth();

  const handleSync = async () => {
    try {
      const res = await syncConnector(id).unwrap();
      if (res.data?.syncLogId) dispatch(trackSyncJobs([res.data.syncLogId]));
      refetch();
      refetchHealth();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync failed');
    }
  };

  const handlePreview = async () => {
    try {
      const res = await previewImport(id).unwrap();
      setPreviewData(res.data);
      setPreviewOpen(true);
    } catch (err) {
      alert(err?.data?.message || err.message || 'Preview failed');
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.previewId) return;
    try {
      await confirmImport({ id, previewId: previewData.previewId }).unwrap();
      setPreviewOpen(false);
      setPreviewData(null);
      refetch();
      refetchHealth();
      alert('Import completed successfully');
    } catch (err) {
      alert(err?.data?.message || err.message || 'Import failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col">
        <Header title="Sheet Details" description="Loading..." />
        <LoadingState message="Loading sheet details..." />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="flex min-h-full flex-col">
        <Header title="Sheet Not Found" />
        <div className="p-6">
          <Button asChild variant="outline">
            <Link to="/google-sheets">Back to sheets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header title={sheet.name} description="Health monitoring and import controls" />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/google-sheets">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <LoadingButton
              variant="outline"
              size="sm"
              loading={healthLoading}
              loadingText="Checking..."
              onClick={handleRefreshHealth}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Health
            </LoadingButton>
            <LoadingButton variant="outline" size="sm" loading={previewing} loadingText="Previewing..." onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" /> Preview Import
            </LoadingButton>
            <LoadingButton size="sm" loading={syncing} loadingText="Syncing..." onClick={handleSync} disabled={sheet.status === 'disabled'}>
              <RefreshCw className="mr-2 h-4 w-4" /> Sync Now
            </LoadingButton>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/google-sheets/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid columns={2}>
                <KeyValue label="Status">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      CONNECTOR_STATUS_COLORS[sheet.status]
                    )}
                  >
                    {formatStatus(sheet.status)}
                  </span>
                </KeyValue>
                {ENABLE_DEPARTMENTS && <KeyValue label="Department" value={sheet.department?.name} />}
                <KeyValue label="Worksheet" value={sheet.config?.worksheetName} />
                <KeyValue label="Spreadsheet" value={sheet.config?.spreadsheetTitle || '—'} />
              </DetailGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid columns={2}>
                <HealthItem label="Connection" value={health.connectionStatus} />
                <HealthItem label="API Status" value={health.apiStatus} />
                <HealthItem label="Permission" value={health.permissionStatus} />
                {health.message && (
                  <div className="col-span-full text-sm text-muted-foreground">{health.message}</div>
                )}
              </DetailGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid columns={2}>
                <KeyValue label="Last Sync" value={formatDateTime(health.lastSyncAt || sheet.lastSyncAt)} />
                <KeyValue label="Last Success" value={formatDateTime(health.lastSuccessAt || sheet.lastSuccessAt)} />
                <KeyValue label="Last Error" value={formatDateTime(health.lastErrorAt || sheet.lastErrorAt)} />
                <KeyValue
                  label="Error Message"
                  value={health.lastErrorMessage || sheet.lastErrorMessage || '—'}
                />
              </DetailGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid columns={3}>
                <KeyValue label="Total Imported" value={health.totalImported ?? 0} />
                <KeyValue label="Duplicates" value={health.totalDuplicates ?? 0} />
                <KeyValue label="Failed" value={health.totalFailed ?? 0} />
              </DetailGrid>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImportPreviewModal
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewData(null); }}
        preview={previewData}
        loading={previewing}
        confirming={confirming}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}
