import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'corizo_active_sync_ids';

function loadTrackedIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function persistTrackedIds(ids) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

const syncProgressSlice = createSlice({
  name: 'syncProgress',
  initialState: {
    /** Sync log IDs started in this browser session (for notice + completion) */
    trackedIds: typeof window !== 'undefined' ? loadTrackedIds() : [],
    /** Last polled payload */
    active: [],
    recent: [],
    /** Soft notice dismissed by user while sync still running */
    noticeDismissed: false,
    /** Completed items already acknowledged in UI */
    seenCompletedIds: [],
  },
  reducers: {
    trackSyncJobs(state, action) {
      const ids = (action.payload || []).map(String).filter(Boolean);
      const next = [...new Set([...state.trackedIds, ...ids])];
      state.trackedIds = next;
      state.noticeDismissed = false;
      persistTrackedIds(next);
    },
    setSyncProgressSnapshot(state, action) {
      const active = action.payload?.active || [];
      const recent = action.payload?.recent || [];
      state.active = active;
      state.recent = recent;

      // When the API reports real activity/completions, drop IDs that are no longer
      // in either list (finished outside the recent window). Skip when both lists
      // are empty — a just-queued job may not appear on the first poll yet.
      const keep = new Set([
        ...active.map((a) => String(a.syncLogId)),
        ...recent.map((r) => String(r.syncLogId)),
      ]);
      if (keep.size > 0) {
        const nextTracked = state.trackedIds.filter((id) => keep.has(id));
        if (nextTracked.length !== state.trackedIds.length) {
          state.trackedIds = nextTracked;
          persistTrackedIds(nextTracked);
        }
      }
    },
    dismissSyncNotice(state) {
      state.noticeDismissed = true;
    },
    markCompletedSeen(state, action) {
      const id = String(action.payload);
      if (!state.seenCompletedIds.includes(id)) {
        state.seenCompletedIds.push(id);
      }
      state.trackedIds = state.trackedIds.filter((x) => x !== id);
      persistTrackedIds(state.trackedIds);
    },
    clearAllTracked(state) {
      state.trackedIds = [];
      state.active = [];
      state.recent = [];
      persistTrackedIds([]);
    },
    clearFinishedTracked(state) {
      const activeIds = new Set((state.active || []).map((a) => String(a.syncLogId)));
      state.trackedIds = state.trackedIds.filter((id) => activeIds.has(id));
      persistTrackedIds(state.trackedIds);
    },
  },
});

export const {
  trackSyncJobs,
  setSyncProgressSnapshot,
  dismissSyncNotice,
  markCompletedSeen,
  clearFinishedTracked,
  clearAllTracked,
} = syncProgressSlice.actions;

export default syncProgressSlice.reducer;
