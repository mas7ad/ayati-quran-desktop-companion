/** Subset of pomodoro session fields used to compute remaining time (matches main `getPomodoroRemainingMs`). */
export interface PomodoroActiveSessionRemainingSlice {
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  startedAt: number;
  pausedAt: number | null;
  accumulatedPausedMs: number;
  durationMinutes: number;
}

export interface PomodoroStateRemainingSlice {
  activeSession: PomodoroActiveSessionRemainingSlice | null;
}

export function getClientPomodoroRemainingMs(state: PomodoroStateRemainingSlice | null, now: number): number | null {
  const session = state?.activeSession;
  if (!session || session.status === 'completed' || session.status === 'cancelled') return null;
  const elapsedEnd = session.status === 'paused' && session.pausedAt ? session.pausedAt : now;
  const elapsedMs = Math.max(0, elapsedEnd - session.startedAt - session.accumulatedPausedMs);
  return Math.max(0, session.durationMinutes * 60 * 1000 - elapsedMs);
}

export type PomodoroPetOverlayPayload = {
  remainingMs: number;
  kind: 'focus' | 'break';
  status: 'running' | 'paused';
};

export function formatPomodoroClock(remainingMs: number): string {
  const ms = Math.max(0, Math.floor(remainingMs));
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
