export interface SelectableWindow {
  isDestroyed(): boolean;
  isVisible?(): boolean;
}

export function selectPreferredWindow<T extends SelectableWindow>(
  candidates: Array<T | null | undefined>,
): T | null {
  const activeWindow = candidates.find((window): window is T => {
    if (!window || window.isDestroyed()) {
      return false;
    }
    return window.isVisible?.() === true;
  });

  if (activeWindow) {
    return activeWindow;
  }

  return candidates.find((window): window is T => Boolean(window && !window.isDestroyed())) ?? null;
}
