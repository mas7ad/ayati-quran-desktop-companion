export interface SingleInstanceApp {
  on(eventName: 'second-instance', listener: () => void): void;
  quit(): void;
  requestSingleInstanceLock(): boolean;
}

export interface FocusableAppWindow {
  focus(): void;
  isDestroyed(): boolean;
  isMinimized(): boolean;
  restore(): void;
  show(): void;
}

export function focusExistingInstanceWindow(window: FocusableAppWindow | null): boolean {
  if (!window || window.isDestroyed()) {
    return false;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
  return true;
}

export function enforceSingleInstanceApp(
  app: SingleInstanceApp,
  getWindowToFocus: () => FocusableAppWindow | null,
): boolean {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return false;
  }

  app.on('second-instance', () => {
    focusExistingInstanceWindow(getWindowToFocus());
  });

  return true;
}
