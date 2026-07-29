import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Loader2, X, RefreshCw, AlertTriangle, Pause, Ban } from 'lucide-react';
import {
  useGetSyncProgressQuery,
  usePauseSyncLogMutation,
  useCancelSyncLogMutation,
  useCancelActiveSyncsMutation,
  apiSlice,
} from '@/store/api/apiSlice';
import {
  setSyncProgressSnapshot,
  dismissSyncNotice,
  markCompletedSeen,
  clearAllTracked,
} from '@/store/syncProgressSlice';
import { useHasAnyPermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

function phaseLabel(phase, status) {
  if (status === 'paused') return 'Paused';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'pending' || phase === 'queued') return 'Queued';
  if (phase === 'fetching') return 'Downloading sheet…';
  if (phase === 'classifying') return 'Checking rows…';
  if (phase === 'importing') return 'Importing leads…';
  if (phase === 'finalizing') return 'Finalizing…';
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'Working…';
}

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '0s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return `${min}m ${rem}s`;
  const hours = Math.floor(min / 60);
  return `${hours}h ${min % 60}m`;
}

function formatEta(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const sec = Math.max(1, Math.ceil(ms / 1000));
  if (sec < 60) return `~${sec}s left`;
  const min = Math.ceil(sec / 60);
  if (min < 60) return `~${min} min left`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin ? `~${hours}h ${remMin}m left` : `~${hours}h left`;
}

function estimateRemainingMs(item) {
  const started = item.startedAt ? new Date(item.startedAt).getTime() : 0;
  const done = Number(item.processedCount) || 0;
  const total = Number(item.totalToProcess) || 0;
  if (!started || done < 3 || total <= done) return null;
  const elapsed = Date.now() - started;
  if (elapsed < 1500) return null;
  const rate = done / elapsed;
  if (rate <= 0) return null;
  return (total - done) / rate;
}

function ProgressRow({ item, now, onPause, onCancel, busyId }) {
  const total = Number(item.totalToProcess) || 0;
  const done = Number(item.processedCount) || 0;
  const rowsFound = Number(item.rowsFound) || 0;
  const hasCounts = total > 0;
  const pct = hasCounts
    ? Math.min(100, Math.round((done / total) * 100))
    : item.phase === 'fetching'
      ? 8
      : 4;

  const startedMs = item.startedAt ? new Date(item.startedAt).getTime() : 0;
  const elapsed = startedMs ? now - startedMs : 0;
  const eta = formatEta(estimateRemainingMs(item));
  const stalled = startedMs && elapsed > 90_000 && done === 0 && !hasCounts;
  const id = String(item.syncLogId);
  const busy = busyId === id;

  const countLabel = hasCounts
    ? `${done.toLocaleString()} / ${total.toLocaleString()}`
    : rowsFound > 0
      ? `${rowsFound.toLocaleString()} rows found`
      : stalled
        ? 'Still starting…'
        : 'Preparing…';

  const detailParts = [phaseLabel(item.phase, item.status)];
  if (elapsed > 0) detailParts.push(`elapsed ${formatDuration(elapsed)}`);
  if (hasCounts) detailParts.push(`${pct}%`);
  if (eta) detailParts.push(eta);
  if (item.phase === 'importing' && (item.importedCount || item.updatedCount)) {
    const bits = [];
    if (item.importedCount) bits.push(`${Number(item.importedCount).toLocaleString()} new`);
    if (item.updatedCount) bits.push(`${Number(item.updatedCount).toLocaleString()} updated`);
    if (bits.length) detailParts.push(bits.join(' · '));
  }
  if (stalled) {
    detailParts.push('waiting for worker');
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.connectorName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.phase === 'classifying' && hasCounts
              ? 'Rows checked'
              : item.phase === 'importing' && hasCounts
                ? 'Leads processed'
                : item.phase === 'fetching'
                  ? 'Fetching from Google Sheets'
                  : 'Progress'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-primary">{countLabel}</p>
          {hasCounts && (
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
              {done.toLocaleString()} done · {Math.max(0, total - done).toLocaleString()} remaining
            </p>
          )}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
          {detailParts.join(' · ')}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => onPause(id)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="Pause sync"
          >
            <Pause className="h-3 w-3" />
            Pause
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(id)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            title="Cancel sync"
          >
            <Ban className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Global sheet-sync progress dock — stays visible across routes while jobs run.
 */
export default function SyncProgressDock() {
  const dispatch = useDispatch();
  const canView = useHasAnyPermission('google_sheets.sync', 'google_sheets.sync_all', 'google_sheets.view');
  const canControl = useHasAnyPermission('google_sheets.sync', 'google_sheets.sync_all');
  const { trackedIds, noticeDismissed, seenCompletedIds, active: storedActive } = useSelector(
    (s) => s.syncProgress
  );
  const invalidatedRef = useRef(new Set());
  const emptyPollsRef = useRef(0);
  const [now, setNow] = useState(Date.now());
  const [pollError, setPollError] = useState('');
  const [busyId, setBusyId] = useState('');

  const [pauseSync] = usePauseSyncLogMutation();
  const [cancelSync] = useCancelSyncLogMutation();
  const [cancelActive] = useCancelActiveSyncsMutation();

  const shouldPoll =
    canView && (trackedIds.length > 0 || (storedActive && storedActive.length > 0));

  const { data, isFetching, isError, error, refetch } = useGetSyncProgressQuery(undefined, {
    skip: !shouldPoll,
    pollingInterval: shouldPoll ? 2500 : 0,
    refetchOnMountOrArgChange: shouldPoll,
  });

  useEffect(() => {
    if (!shouldPoll) {
      emptyPollsRef.current = 0;
      return undefined;
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [shouldPoll]);

  useEffect(() => {
    if (!data?.data) return;
    dispatch(setSyncProgressSnapshot(data.data));
    setPollError('');

    const active = data.data.active || [];
    const recent = data.data.recent || [];
    if (active.length === 0 && recent.length === 0 && trackedIds.length > 0) {
      emptyPollsRef.current += 1;
      if (emptyPollsRef.current >= 3) {
        dispatch(clearAllTracked());
        emptyPollsRef.current = 0;
      }
    } else {
      emptyPollsRef.current = 0;
    }
  }, [data, dispatch, trackedIds.length]);

  useEffect(() => {
    if (!isError) return;
    const status = error?.status;
    if (status === 401 || status === 403 || status === 'FETCH_ERROR') {
      setPollError('');
      return;
    }
    if (!trackedIds.length && !(storedActive && storedActive.length)) {
      setPollError('');
      return;
    }
    const msg = error?.data?.message || error?.error || 'Could not refresh sync progress';
    setPollError(String(msg));
  }, [isError, error, trackedIds.length, storedActive]);

  const rawActive = data?.data?.active || storedActive || [];
  const activeItems = rawActive.filter((item) => {
    if (trackedIds.length > 0 && !trackedIds.includes(String(item.syncLogId))) return false;
    const startedMs = item.startedAt ? new Date(item.startedAt).getTime() : 0;
    const elapsed = startedMs ? Date.now() - startedMs : 0;
    const stuckInQueue =
      item.status === 'pending'
      && (item.phase === 'queued' || !item.phase)
      && elapsed > 90_000
      && !(Number(item.processedCount) > 0);
    return !stuckInQueue;
  });
  const recentItems = data?.data?.recent || [];
  const hasActive = activeItems.length > 0;

  const isAbandonedQueueFailure = (r) => {
    if (r.status !== 'failed' && r.status !== 'cancelled' && r.status !== 'paused') return false;
    if ((r.processedCount || 0) > 0 || r.importedCount || r.updatedCount) return false;
    return /never started|queue abandoned|timed out or stalled|waiting for worker/i.test(
      r.errorSummary || ''
    );
  };

  const finishedTracked = recentItems.filter((r) => {
    const id = String(r.syncLogId);
    if (!trackedIds.includes(id) || seenCompletedIds.includes(id)) return false;
    if (isAbandonedQueueFailure(r)) return false;
    return true;
  });

  useEffect(() => {
    recentItems.forEach((item) => {
      const id = String(item.syncLogId);
      if (!trackedIds.includes(id) || seenCompletedIds.includes(id)) return;
      if (isAbandonedQueueFailure(item)) {
        dispatch(markCompletedSeen(id));
      }
    });
  }, [recentItems, trackedIds, seenCompletedIds, dispatch]);

  useEffect(() => {
    finishedTracked.forEach((item) => {
      const id = String(item.syncLogId);
      if (invalidatedRef.current.has(id)) return;
      invalidatedRef.current.add(id);
      dispatch(
        apiSlice.util.invalidateTags(['Lead', 'Dashboard', 'FollowUp', 'Connector', 'ConnectorSyncLog'])
      );
    });
  }, [finishedTracked, dispatch]);

  const handlePause = async (id) => {
    if (!canControl) return;
    setBusyId(id);
    try {
      await pauseSync(id).unwrap();
      refetch();
    } catch (err) {
      setPollError(err?.data?.message || err?.message || 'Could not pause sync');
    } finally {
      setBusyId('');
    }
  };

  const handleCancel = async (id) => {
    if (!canControl) return;
    setBusyId(id);
    try {
      await cancelSync(id).unwrap();
      dispatch(markCompletedSeen(id));
      refetch();
    } catch (err) {
      setPollError(err?.data?.message || err?.message || 'Could not cancel sync');
    } finally {
      setBusyId('');
    }
  };

  const handleCancelAll = async () => {
    if (!canControl) return;
    setBusyId('all');
    try {
      await cancelActive().unwrap();
      dispatch(clearAllTracked());
      refetch();
    } catch (err) {
      setPollError(err?.data?.message || err?.message || 'Could not cancel syncs');
    } finally {
      setBusyId('');
    }
  };

  if (!canView) return null;
  if (!hasActive && finishedTracked.length === 0 && !pollError) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {pollError && (
        <div className="pointer-events-auto rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow-elevated">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Sync status unavailable</p>
              <p className="mt-0.5 text-xs">{pollError}</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-amber-100"
              onClick={() => setPollError('')}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {hasActive && !noticeDismissed && (
        <div className="pointer-events-auto rounded-xl border border-primary/25 bg-white p-3 shadow-elevated dark:bg-card">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <RefreshCw className={cn('h-4 w-4 text-primary', isFetching && 'animate-spin')} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Syncing in the background</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                You can pause or cancel anytime, then start a fresh sync.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => dispatch(dismissSyncNotice())}
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {(hasActive || finishedTracked.length > 0) && (
        <div className="pointer-events-auto overflow-hidden rounded-xl border border-border bg-white shadow-elevated dark:bg-card">
          <div className="flex items-center gap-2 border-b border-border/80 bg-muted/40 px-3 py-2">
            <Loader2 className={cn('h-3.5 w-3.5 text-primary', hasActive && 'animate-spin')} />
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
              {hasActive ? 'Live sheet sync' : 'Sync finished'}
            </span>
            {hasActive && canControl && (
              <button
                type="button"
                disabled={busyId === 'all'}
                onClick={handleCancelAll}
                className="ml-auto text-[11px] font-medium text-destructive hover:underline disabled:opacity-50"
              >
                Cancel all
              </button>
            )}
          </div>
          <div className="space-y-3 p-3">
            {activeItems.map((item) => (
              <ProgressRow
                key={item.syncLogId}
                item={item}
                now={now}
                busyId={busyId}
                onPause={handlePause}
                onCancel={handleCancel}
              />
            ))}
            {!hasActive &&
              finishedTracked.map((item) => (
                <div key={item.syncLogId} className="flex items-start gap-2 text-sm">
                  {item.status === 'failed' || item.status === 'cancelled' || item.status === 'paused' ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.connectorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === 'paused'
                        ? item.errorSummary || 'Sync paused'
                        : item.status === 'failed' || item.status === 'cancelled'
                          ? item.errorSummary || 'Sync failed'
                          : `Done · ${(item.importedCount || 0).toLocaleString()} imported${
                            item.updatedCount ? `, ${item.updatedCount.toLocaleString()} updated` : ''
                          }${item.rowsFound ? ` · ${item.rowsFound.toLocaleString()} rows scanned` : ''}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => dispatch(markCompletedSeen(item.syncLogId))}
                  >
                    Dismiss
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
