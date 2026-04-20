import { describe, expect, it, vi } from 'vitest';
import { enforceSingleInstanceApp } from './single-instance';

function createWindow() {
  return {
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    show: vi.fn(),
  };
}

function createApp(hasLock: boolean) {
  const listeners = new Map<string, () => void>();

  return {
    app: {
      on: vi.fn((eventName: string, listener: () => void) => {
        listeners.set(eventName, listener);
      }),
      quit: vi.fn(),
      requestSingleInstanceLock: vi.fn(() => hasLock),
    },
    emit(eventName: string) {
      listeners.get(eventName)?.();
    },
  };
}

describe('enforceSingleInstanceApp', () => {
  it('quits the duplicate app process when another instance owns the lock', () => {
    const { app } = createApp(false);
    const shouldContinue = enforceSingleInstanceApp(app, () => null);

    expect(shouldContinue).toBe(false);
    expect(app.quit).toHaveBeenCalledTimes(1);
    expect(app.on).not.toHaveBeenCalled();
  });

  it('focuses the existing window when a second app instance is launched', () => {
    const { app, emit } = createApp(true);
    const window = createWindow();

    const shouldContinue = enforceSingleInstanceApp(app, () => window);
    emit('second-instance');

    expect(shouldContinue).toBe(true);
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
  });

  it('restores a minimized existing window before focusing it', () => {
    const { app, emit } = createApp(true);
    const window = createWindow();
    window.isMinimized.mockReturnValue(true);

    enforceSingleInstanceApp(app, () => window);
    emit('second-instance');

    expect(window.restore).toHaveBeenCalledTimes(1);
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
  });
});
