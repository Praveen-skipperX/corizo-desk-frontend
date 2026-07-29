import { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import {
  useGetConnectorsQuery,
  useSyncConnectorMutation,
  useSyncAllConnectorsMutation,
} from '@/store/api/apiSlice';
import { trackSyncJobs } from '@/store/syncProgressSlice';
import { useHasAnyPermission, usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

/**
 * Leads-page Sync Sheet control.
 * Queues background sync and tracks progress in the global SyncProgressDock.
 */
export default function SyncSheetsButton({ onSynced }) {
  const dispatch = useDispatch();
  const canSyncOne = usePermission('google_sheets.sync');
  const canSyncAll = usePermission('google_sheets.sync_all');
  const canSync = useHasAnyPermission('google_sheets.sync', 'google_sheets.sync_all');

  const [open, setOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const menuRef = useRef(null);

  const { data, isLoading: loadingSheets } = useGetConnectorsQuery(
    { limit: 100, status: 'active', type: 'google_sheets' },
    { skip: !canSync }
  );
  const [syncConnector] = useSyncConnectorMutation();
  const [syncAll, { isLoading: syncingAll }] = useSyncAllConnectorsMutation();

  const sheets = (data?.data || []).filter((s) => s.status === 'active');
  const busy = syncingAll || Boolean(syncingId);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!canSync) return null;

  const trackFromResponse = (payload) => {
    const ids = [];
    if (payload?.syncLogId) ids.push(payload.syncLogId);
    if (Array.isArray(payload?.jobs)) {
      payload.jobs.forEach((j) => {
        if (j.syncLogId) ids.push(j.syncLogId);
      });
    }
    if (ids.length) dispatch(trackSyncJobs(ids));
  };

  const handleSyncOne = async (id) => {
    if (!canSyncOne || busy) return;
    setSyncingId(id);
    try {
      const res = await syncConnector(id).unwrap();
      trackFromResponse(res.data);
      setOpen(false);
      onSynced?.();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    if (!canSyncAll || busy) return;
    if (
      !window.confirm(
        `Sync all ${sheets.length || ''} active Google Sheet(s)? This runs in the background so you can keep working.`
      )
    ) {
      return;
    }
    try {
      const res = await syncAll().unwrap();
      trackFromResponse(res.data);
      setOpen(false);
      onSynced?.();
    } catch (err) {
      alert(err?.data?.message || err.message || 'Sync-all failed');
    }
  };

  return (
    <div className={cn('relative', open && 'z-50')} ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', busy && 'animate-spin')} />
        Sync Sheet
        <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-border bg-white p-1 text-foreground shadow-elevated"
        >
          {canSyncAll && (
            <button
              type="button"
              role="menuitem"
              disabled={busy || sheets.length === 0}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              onClick={handleSyncAll}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-primary', syncingAll && 'animate-spin')} />
              Sync all active sheets
            </button>
          )}

          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Connected sheets
          </div>

          {loadingSheets && (
            <p className="px-2 py-2 text-xs text-muted-foreground">Loading sheets…</p>
          )}

          {!loadingSheets && sheets.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">No active sheets available.</p>
          )}

          {!loadingSheets &&
            sheets.map((sheet) => (
              <button
                key={sheet._id}
                type="button"
                role="menuitem"
                disabled={!canSyncOne || busy}
                title={!canSyncOne ? 'Missing google_sheets.sync permission' : undefined}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs text-foreground hover:bg-muted disabled:opacity-50"
                onClick={() => handleSyncOne(sheet._id)}
              >
                <span className="truncate font-medium">{sheet.name}</span>
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground',
                    syncingId === sheet._id && 'animate-spin text-primary'
                  )}
                />
              </button>
            ))}

          <p className="border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
            Sync runs in the background. Live progress appears at the bottom-right.
          </p>
        </div>
      )}
    </div>
  );
}
