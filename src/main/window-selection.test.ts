import { describe, expect, it, vi } from 'vitest';
import { selectPreferredWindow } from './window-selection';

function createWindow(options?: { destroyed?: boolean; visible?: boolean }) {
  return {
    isDestroyed: vi.fn(() => options?.destroyed ?? false),
    isVisible: vi.fn(() => options?.visible ?? false),
  };
}

describe('selectPreferredWindow', () => {
  it('prefers a visible window over a hidden preloaded window', () => {
    const hiddenChatbarWindow = createWindow({ visible: false });
    const visiblePetWindow = createWindow({ visible: true });

    const selectedWindow = selectPreferredWindow([
      hiddenChatbarWindow,
      visiblePetWindow,
    ]);

    expect(selectedWindow).toBe(visiblePetWindow);
  });

  it('falls back to a hidden window when nothing is visible', () => {
    const hiddenAssistantWindow = createWindow({ visible: false });
    const hiddenPetWindow = createWindow({ visible: false });

    const selectedWindow = selectPreferredWindow([
      hiddenAssistantWindow,
      hiddenPetWindow,
    ]);

    expect(selectedWindow).toBe(hiddenAssistantWindow);
  });
});
