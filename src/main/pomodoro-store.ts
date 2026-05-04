import { randomUUID } from 'crypto';

import type { PomodoroSessionKind, PomodoroState } from './ayah-types';

const MAX_POMODORO_HISTORY = 100;

function durationForKind(state: PomodoroState, kind: PomodoroSessionKind): number {
  if (kind === 'shortBreak') return state.settings.shortBreakMinutes;
  if (kind === 'longBreak') return state.settings.longBreakMinutes;
  return state.settings.focusMinutes;
}

function sanitizeDuration(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 240
    ? Math.round(value)
    : fallback;
}

export function startPomodoroSession(
  state: PomodoroState,
  input: {
    kind: PomodoroSessionKind;
    durationMinutes?: number;
    todoId?: string | null;
  },
  now: number = Date.now(),
): PomodoroState {
  if (state.activeSession?.status === 'running' || state.activeSession?.status === 'paused') {
    throw new Error('A focus session is already running.');
  }

  const durationMinutes = sanitizeDuration(input.durationMinutes, durationForKind(state, input.kind));
  return {
    ...state,
    activeSession: {
      id: randomUUID(),
      kind: input.kind,
      status: 'running',
      startedAt: now,
      pausedAt: null,
      accumulatedPausedMs: 0,
      durationMinutes,
      todoId: input.todoId ?? null,
      completedAt: null,
    },
  };
}

export function pausePomodoroSession(state: PomodoroState, now: number = Date.now()): PomodoroState {
  if (state.activeSession?.status !== 'running') return state;
  return {
    ...state,
    activeSession: { ...state.activeSession, status: 'paused', pausedAt: now },
  };
}

export function resumePomodoroSession(state: PomodoroState, now: number = Date.now()): PomodoroState {
  if (state.activeSession?.status !== 'paused' || !state.activeSession.pausedAt) return state;
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      status: 'running',
      accumulatedPausedMs: state.activeSession.accumulatedPausedMs + Math.max(0, now - state.activeSession.pausedAt),
      pausedAt: null,
    },
  };
}

export function cancelPomodoroSession(state: PomodoroState, now: number = Date.now()): PomodoroState {
  if (!state.activeSession || state.activeSession.status === 'completed') return state;
  return {
    ...state,
    activeSession: { ...state.activeSession, status: 'cancelled', completedAt: now },
  };
}

export function completePomodoroSession(state: PomodoroState, now: number = Date.now()): PomodoroState {
  if (!state.activeSession || state.activeSession.status === 'completed') return state;
  const completedSession = { ...state.activeSession, status: 'completed' as const, completedAt: now };
  return {
    ...state,
    activeSession: completedSession,
    completedFocusCount: completedSession.kind === 'focus' ? state.completedFocusCount + 1 : state.completedFocusCount,
    history: [{
      id: completedSession.id,
      kind: completedSession.kind,
      startedAt: completedSession.startedAt,
      completedAt: now,
      durationMinutes: completedSession.durationMinutes,
      todoId: completedSession.todoId,
    }, ...state.history].slice(0, MAX_POMODORO_HISTORY),
  };
}

export function getPomodoroRemainingMs(state: PomodoroState, now: number): number | null {
  const session = state.activeSession;
  if (!session || session.status === 'completed' || session.status === 'cancelled') return null;
  const elapsedEnd = session.status === 'paused' && session.pausedAt ? session.pausedAt : now;
  const elapsedMs = Math.max(0, elapsedEnd - session.startedAt - session.accumulatedPausedMs);
  return Math.max(0, session.durationMinutes * 60 * 1000 - elapsedMs);
}

export function getDuePomodoroCompletion(state: PomodoroState, now: number) {
  const remaining = getPomodoroRemainingMs(state, now);
  if (remaining !== 0 || state.activeSession?.status !== 'running') return null;
  return state.activeSession;
}

export function getNextPomodoroKind(state: PomodoroState): PomodoroSessionKind {
  const target = Math.max(1, state.settings.sessionsUntilLongBreak);
  return state.completedFocusCount > 0 && state.completedFocusCount % target === 0 ? 'longBreak' : 'shortBreak';
}
