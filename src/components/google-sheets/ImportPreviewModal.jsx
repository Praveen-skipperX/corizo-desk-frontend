import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { FileSpreadsheet, UserPlus, Copy, AlertTriangle, SkipForward } from 'lucide-react';

export default function ImportPreviewModal({
  open,
  onClose,
  preview,
  loading = false,
  confirming = false,
  onConfirm,
}) {
  if (!preview) return null;

  const stats = [
    { title: 'Rows Found', value: preview.rowsFound ?? 0, icon: FileSpreadsheet, variant: 'default' },
    { title: 'New', value: preview.newCount ?? 0, icon: UserPlus, variant: 'open' },
    { title: 'Duplicates', value: preview.duplicateCount ?? 0, icon: Copy, variant: 'followup' },
    { title: 'Invalid', value: preview.invalidCount ?? 0, icon: AlertTriangle, variant: 'alert' },
    { title: 'Skipped', value: preview.skippedCount ?? 0, icon: SkipForward, variant: 'default' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            Review the classification before confirming the import.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Generating preview...</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((s) => (
                  <StatCard key={s.title} {...s} />
                ))}
              </div>

              {preview.sampleNew?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Sample New Leads</h4>
                  <div className="max-h-32 overflow-y-auto rounded-md border text-xs">
                    {preview.sampleNew.map((row, i) => (
                      <div key={i} className="border-b px-3 py-2 last:border-0">
                        {[row.name, row.phone, row.email].filter(Boolean).join(' · ') || '—'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.sampleInvalid?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-destructive">Sample Invalid Rows</h4>
                  <div className="max-h-32 overflow-y-auto rounded-md border text-xs">
                    {preview.sampleInvalid.map((row, i) => (
                      <div key={i} className="border-b px-3 py-2 last:border-0">
                        {(row.errors || []).join('; ') || 'Validation failed'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <LoadingButton
            loading={confirming}
            loadingText="Importing..."
            onClick={onConfirm}
            disabled={loading || !preview.previewId}
          >
            Confirm Import
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
