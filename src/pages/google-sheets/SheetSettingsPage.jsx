import { useState } from 'react';
import Header from '@/components/layout/Header';
import GoogleSheetsTabs from '@/components/google-sheets/GoogleSheetsTabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Mail, Share2, ShieldCheck, Trash2, AlertCircle } from 'lucide-react';
import LoadingState from '@/components/ui/loading-state';
import {
  useGetMappingTemplatesQuery,
  useGetGoogleSheetsSetupQuery,
  useDeleteMappingTemplateMutation,
} from '@/store/api/apiSlice';

export default function SheetSettingsPage() {
  const { data, isLoading, refetch } = useGetMappingTemplatesQuery();
  const { data: setupData, isLoading: setupLoading } = useGetGoogleSheetsSetupQuery();
  const [deleteTemplate] = useDeleteMappingTemplateMutation();
  const [deletingId, setDeletingId] = useState(null);
  const [copied, setCopied] = useState(false);

  const templates = data?.data || [];
  const setup = setupData?.data || {};
  const serviceEmail = setup.serviceAccountEmail || '';

  const handleCopyEmail = async () => {
    if (!serviceEmail) return;
    try {
      await navigator.clipboard.writeText(serviceEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mapping template?')) return;
    setDeletingId(id);
    try {
      await deleteTemplate(id).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <Header
        title="Google Sheets"
        description="Sharing access, sync guidance, and mapping templates"
      />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <GoogleSheetsTabs />

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg">Share access with Corizo</CardTitle>
                <CardDescription>
                  Before connecting a spreadsheet, share it with the Corizo Google account below.
                  Without this step, Corizo cannot read the sheet and sync will fail.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {setupLoading ? (
              <LoadingState message="Loading sharing details..." />
            ) : !setup.configured || !serviceEmail ? (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Service account is not configured</p>
                  <p className="mt-1 text-destructive/90">
                    Ask your system administrator to set{' '}
                    <code className="rounded bg-destructive/10 px-1 text-xs">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>{' '}
                    on the server, then refresh this page.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    Email to add in Google Sheets Share
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5">
                      <p className="truncate font-mono text-sm font-medium text-foreground" title={serviceEmail}>
                        {serviceEmail}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleCopyEmail}
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy email
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    This is Corizo’s Google service account. Paste it into the Share dialog of every
                    spreadsheet you want to sync.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Recommended access
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Grant <span className="font-medium text-foreground">Viewer</span> access for normal
                      sync and import. This is enough for Corizo to read rows securely.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Full Replace mode
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      If you use Full Replace (Super Admin), grant{' '}
                      <span className="font-medium text-foreground">Editor</span> access so Corizo can
                      process the sheet as configured.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">How to share a sheet</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                    <li>Open your Google Spreadsheet.</li>
                    <li>
                      Click <span className="font-medium text-foreground">Share</span> (top right).
                    </li>
                    <li>
                      Paste the email above and choose{' '}
                      <span className="font-medium text-foreground">Viewer</span> (or Editor if required).
                    </li>
                    <li>
                      Click <span className="font-medium text-foreground">Send</span> /{' '}
                      <span className="font-medium text-foreground">Share</span>. You can uncheck
                      “Notify people” — the service account does not need an email invite.
                    </li>
                    <li>Return to Corizo and add or sync the sheet connection.</li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync defaults</CardTitle>
            <CardDescription>
              Default lead source, assignee, status, and priority apply when a row does not supply those
              values. Duplicate rules decide how existing leads are matched during sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1.5">
              <li>Set defaults per sheet when you add or edit a connection.</li>
              <li>Auto sync runs on the interval configured for each active sheet.</li>
              <li>
                Full Replace is available to Super Admins only and can remove leads that are no longer in
                the sheet.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mapping templates</CardTitle>
            <CardDescription>
              Saved column mappings you can reuse when connecting similar spreadsheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading templates..." />
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No templates yet. Use “Save as template” when configuring a sheet connection.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {templates.map((t) => (
                  <div key={t._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.fieldMapping?.length || 0} field(s) mapped · Header row {t.headerRow || 1}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={deletingId === t._id}
                      onClick={() => handleDelete(t._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
