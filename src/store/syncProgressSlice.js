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
      // Drop from seen so a re-synced id can show completion again
      state.seenCompletedIds = state.seenCompletedIds.filter((id) => !ids.includes(id));
      persistTrackedIds(next);
    },
    setSyncProgressSnapshot(state, action) {
      state.active = action.payload?.active || [];
      state.recent = action.payload?.recent || [];
      // Do not prune trackedIds here — a just-queued job can miss the first poll
      // while recent still has older cancelled/failed rows, which used to wipe the new id.
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
