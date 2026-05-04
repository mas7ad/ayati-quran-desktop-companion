import { describe, expect, it } from 'vitest';

import {
  cancelPomodoroSession,
  completePomodoroSession,
  getDuePomodoroCompletion,
  getNextPomodoroKind,
  getPomodoroRemainingMs,
  pausePomodoroSession,
  resumePomodoroSession,
  startPomodoroSession,
} from './pomodoro-store';
import { createDefaultAyahLensState } from './ayah-reflection-store';

const NOW = new Date('2026-05-02T12:00:00Z').getTime();

describe('pomodoro store', () => {
  it('starts default and custom focus sessions with optional task links', () => {
    const state = createDefaultAyahLensState().pomodoro;
    const started = startPomodoroSession(state, { kind: 'focus', todoId: 'todo-1' }, NOW);
    expect(started.activeSession).toMatchObject({ kind: 'focus', durationMinutes: 25, todoId: 'todo-1', status: 'running' });

    expect(() => startPomodoroSession(started, { kind: 'focus' }, NOW)).toThrow('A focus session is already running.');

    const cancelled = cancelPomodoroSession(started, NOW + 1);
    const custom = startPomodoroSession(cancelled, { kind: 'focus', durationMinutes: 10 }, NOW + 2);
    expect(custom.activeSession?.durationMinutes).toBe(10);
  });

  it('pauses, resumes, detects due completion, and logs completion', () => {
    const state = startPomodoroSession(createDefaultAyahLensState().pomodoro, { kind: 'focus', durationMinutes: 1 }, NOW);
    const paused = pausePomodoroSession(state, NOW + 10_000);
    expect(paused.activeSession?.status).toBe('paused');
    expect(getPomodoroRemainingMs(paused, NOW + 50_000)).toBe(50_000);

    const resumed = resumePomodoroSession(paused, NOW + 20_000);
    expect(resumed.activeSession?.accumulatedPausedMs).toBe(10_000);
    expect(getDuePomodoroCompletion(resumed, NOW + 70_000)?.kind).toBe('focus');

    const completed = completePomodoroSession(resumed, NOW + 70_000);
    expect(completed.activeSession?.status).toBe('completed');
    expect(completed.history).toHaveLength(1);
    expect(completed.completedFocusCount).toBe(1);
  });

  it('chooses a long break after the configured focus count', () => {
    const state = {
      ...createDefaultAyahLensState().pomodoro,
      completedFocusCount: 3,
    };
    expect(getNextPomodoroKind(state)).toBe('shortBreak');
    expect(getNextPomodoroKind({ ...state, completedFocusCount: 4 })).toBe('longBreak');
  });

  it('cancels without logging completion', () => {
    const started = startPomodoroSession(createDefaultAyahLensState().pomodoro, { kind: 'shortBreak' }, NOW);
    const cancelled = cancelPomodoroSession(started, NOW + 1);
    expect(cancelled.activeSession?.status).toBe('cancelled');
    expect(cancelled.history).toHaveLength(0);
  });
});
