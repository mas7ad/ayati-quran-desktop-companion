import { readFileSync } from 'node:fs';
import path from 'node:path';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Pet } from './Pet';

function getCssRuleBody(styles: string, selectorStart: string): string {
  const selectorIndex = styles.indexOf(selectorStart);
  if (selectorIndex === -1) {
    throw new Error(`Missing CSS selector: ${selectorStart}`);
  }

  const openBraceIndex = styles.indexOf('{', selectorIndex);
  const closeBraceIndex = styles.indexOf('}', openBraceIndex);
  return styles.slice(openBraceIndex + 1, closeBraceIndex);
}

function installMockAyati(): {
  ayati: Partial<Window['ayati']>;
  sendMood: (data: { state: string; reason?: string }) => void;
  sendChatPopup: (data: {
    id: string;
    text: string;
    quickReplies?: string[];
    reflectionId?: string;
    verseKey?: string;
    arabicText?: string;
    footerText?: string;
  }) => void;
  sendIdleBehavior: (data: { type: string; direction?: string }) => void;
  sendPetAppearanceChanged: (appearanceId: string) => void;
  sendPetMoving: (data: { moving: boolean; direction?: 'left' | 'right' }) => void;
} {
  let moodHandler: (data: { state: string; reason?: string }) => void = () => {};
  let chatPopupHandler: (data: {
    id: string;
    text: string;
    quickReplies?: string[];
    reflectionId?: string;
    verseKey?: string;
    arabicText?: string;
    footerText?: string;
  }) => void = () => {};
  let idleBehaviorHandler: (data: { type: string; direction?: string }) => void = () => {};
  let petAppearanceHandler: (appearanceId: string) => void = () => {};
  let petMovingHandler: (data: { moving: boolean; direction?: 'left' | 'right' }) => void = () => {};
  const ayati = {
    getSettings: vi.fn().mockResolvedValue({
      pet: { transparentWhenSleeping: false, appearanceId: 'ayah' },
      dev: { showPetModeOverlay: false },
    }),
    getCursorPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
    getPetPosition: vi.fn().mockResolvedValue([0, 0]),
    dragPet: vi.fn(),
    playPetWakeFlight: vi.fn().mockResolvedValue(undefined),
    showPetChat: vi.fn(),
    showPetContextMenu: vi.fn(),
    petClicked: vi.fn(),
    removeAllListeners: vi.fn(),
    onClawbotMood: vi.fn((callback: (data: { state: string; reason?: string }) => void) => {
      moodHandler = callback;
    }),
    onPetTransparentSleepChanged: vi.fn(),
    onDevShowPetModeOverlayChanged: vi.fn(),
    onPetAppearanceChanged: vi.fn((callback: (appearanceId: string) => void) => {
      petAppearanceHandler = callback;
    }),
    onChatPopup: vi.fn((callback: typeof chatPopupHandler) => {
      chatPopupHandler = callback;
    }),
    onClawbotSuggestion: vi.fn(),
    onPetChatReply: vi.fn(),
    onActivityEvent: vi.fn(),
    onPetMoving: vi.fn((callback: (data: { moving: boolean; direction?: 'left' | 'right' }) => void) => {
      petMovingHandler = callback;
    }),
    onPetCameraSnap: vi.fn(),
    onIdleBehavior: vi.fn((callback: (data: { type: string; direction?: string }) => void) => {
      idleBehaviorHandler = callback;
    }),
  } satisfies Partial<Window['ayati']>;

  Object.defineProperty(window, 'ayati', {
    configurable: true,
    writable: true,
    value: ayati,
  });

  return {
    ayati,
    sendMood: (data) => moodHandler(data),
    sendChatPopup: (data) => chatPopupHandler(data),
    sendIdleBehavior: (data) => idleBehaviorHandler(data),
    sendPetAppearanceChanged: (appearanceId) => petAppearanceHandler(appearanceId),
    sendPetMoving: (data) => petMovingHandler(data),
  };
}

describe('Pet', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      setTransform: vi.fn(),
      imageSmoothingEnabled: false,
    })) as unknown as HTMLCanvasElement['getContext'];
    installMockAyati();
  });

  it('renders the Ayah spritesheet companion', () => {
    render(<Pet />);

    const sprite = screen.getByTestId('ayah-sprite-pet');
    expect(sprite).toBeInTheDocument();
    expect(sprite.tagName.toLowerCase()).toBe('canvas');
  });

  it('updates the rendered spritesheet appearance when the main process broadcasts a change', async () => {
    const { sendPetAppearanceChanged } = installMockAyati();
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('ayah-sprite-pet')).toHaveAttribute('data-pet-appearance', 'ayah');

    act(() => {
      sendPetAppearanceChanged('cosmo');
    });

    expect(screen.getByTestId('ayah-sprite-pet')).toHaveAttribute('data-pet-appearance', 'cosmo');
  });

  it('reconciles the rendered appearance from saved settings if the live IPC event is missed', async () => {
    vi.useFakeTimers();
    const { ayati } = installMockAyati();
    let savedAppearanceId = 'ayah';
    ayati.getSettings = vi.fn().mockImplementation(() => Promise.resolve({
      pet: { transparentWhenSleeping: false, appearanceId: savedAppearanceId },
      dev: { showPetModeOverlay: false },
    }));
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('ayah-sprite-pet')).toHaveAttribute('data-pet-appearance', 'ayah');

    savedAppearanceId = 'bolt';
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(screen.getByTestId('ayah-sprite-pet')).toHaveAttribute('data-pet-appearance', 'bolt');
    vi.useRealTimers();
  });

  it('ignores hand wave idle events while the wave behavior is disabled', async () => {
    const { sendIdleBehavior } = installMockAyati();
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      sendIdleBehavior({ type: 'wave' });
    });

    expect(screen.getByTestId('ayah-character-shell')).not.toHaveClass('idle-wave');
  });

  it('wakes up by moving the pet window when tapped while sleeping', async () => {
    const { ayati, sendMood } = installMockAyati();
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      sendMood({ state: 'sleeping' });
    });

    const characterShell = screen.getByTestId('ayah-character-shell');
    expect(characterShell).toHaveAttribute('data-visual-state', 'sleeping');

    fireEvent.click(characterShell);

    expect(characterShell).toHaveAttribute('data-visual-state', 'idle');
    expect(characterShell).toHaveAttribute('data-pet-clip', 'jumping');
    expect(characterShell).toHaveClass('wake-window-flight');
    expect(characterShell).not.toHaveClass('idle-wave');
    expect(ayati.playPetWakeFlight).toHaveBeenCalled();
    expect(ayati.petClicked).toHaveBeenCalled();
  });

  it('uses running-left clip when the main process reports leftward movement', async () => {
    const { sendPetMoving } = installMockAyati();
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      sendPetMoving({ moving: true, direction: 'left' });
    });

    expect(screen.getByTestId('ayah-character-shell')).toHaveAttribute('data-pet-clip', 'running-left');

    act(() => {
      sendPetMoving({ moving: false });
    });

    expect(screen.getByTestId('ayah-character-shell')).toHaveAttribute('data-pet-clip', 'idle');
  });

  it('keeps verse keys when forwarding Quran popups to the pet chat window', async () => {
    const { ayati, sendChatPopup } = installMockAyati();
    render(<Pet />);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      sendChatPopup({
        id: 'popup-1',
        text: 'Time for a Quran reminder',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
        verseKey: '2:286',
        arabicText: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
        footerText: 'Allah does not burden a soul beyond that it can bear.',
      });
    });

    expect(ayati.showPetChat).toHaveBeenCalledWith(expect.objectContaining({
      id: 'popup-1',
      reflectionId: 'reflection-1',
      verseKey: '2:286',
      arabicText: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      footerText: 'Allah does not burden a soul beyond that it can bear.',
    }));
  });

  it('does not define hand wave animation rules while wave is disabled', () => {
    const styles = readFileSync(path.join(process.cwd(), 'src/renderer/pet/styles.css'), 'utf8');

    expect(styles).not.toContain('idle-wave');
    expect(styles).not.toContain('leftHandWave');
    expect(styles).not.toContain('rightHandWave');
  });

  it('does not fly or flip the character within the pet window during wake', () => {
    const styles = readFileSync(path.join(process.cwd(), 'src/renderer/pet/styles.css'), 'utf8');
    const wakeWindowFlightRule = getCssRuleBody(styles, '.lobster-container.wake-window-flight');

    expect(styles).not.toContain('wakeFlyFlip');
    expect(wakeWindowFlightRule).not.toMatch(/transform\s*:/);
    expect(wakeWindowFlightRule).not.toMatch(/animation\s*:/);
  });

  it('keeps hand layers from moving down in sleeping poses', () => {
    const styles = readFileSync(path.join(process.cwd(), 'src/renderer/pet/styles.css'), 'utf8');
    const leftSleepHandRule = getCssRuleBody(
      styles,
      '.lobster-container.state-sleep .character-left-hand-top-layer,',
    );
    const rightSleepHandRule = getCssRuleBody(
      styles,
      '.lobster-container.state-sleep .character-right-hand-top-layer,',
    );

    expect(leftSleepHandRule).not.toMatch(/translate\([^)]*,\s*[1-9][\d.]*px\)/);
    expect(rightSleepHandRule).not.toMatch(/translate\([^)]*,\s*[1-9][\d.]*px\)/);
  });
});
