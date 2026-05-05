import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScreenshotQuestion } from './ScreenshotQuestion';

const reflection: AyahReflection = {
  id: 'reflection-1',
  verseKey: '2:286',
  surahName: 'Al-Baqarah',
  ayahNumber: 286,
  arabicText: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
  translation: 'Allah does not require of any soul more than what it can afford.',
  translatorId: 20,
  reflection: 'Move with what is in your capacity.',
  whyThisVerse: 'The screen suggested stress and pressure.',
  screenSummary: 'A crowded work screen.',
  themes: [{ id: 'stress', confidence: 0.9 }],
  createdAt: 1710000000000,
  syncState: 'local',
};

function installMockAyati(
  error: Error,
  pendingResult: PendingAyahReflectionResult | null | Promise<PendingAyahReflectionResult | null> = null,
): Partial<Window['ayati']> {
  const pendingResultPromise = typeof (pendingResult as Promise<PendingAyahReflectionResult | null> | null)?.then === 'function'
    ? pendingResult as Promise<PendingAyahReflectionResult | null>
    : Promise.resolve(pendingResult as PendingAyahReflectionResult | null);
  const ayati = {
    ...createMockAyati(error),
    getPendingAyahReflectionResult: vi.fn().mockImplementation(() => pendingResultPromise),
  } satisfies Partial<Window['ayati']>;

  Object.defineProperty(window, 'ayati', {
    configurable: true,
    writable: true,
    value: ayati,
  });
  return ayati;
}

function createMockAyati(error: Error): Partial<Window['ayati']> {
  return {
    getScreenCapturePermission: vi.fn().mockResolvedValue('granted'),
    captureAyahReflection: vi.fn().mockRejectedValue(error),
    closeScreenshotQuestion: vi.fn(),
    saveAyahReflection: vi.fn(),
    getAyahCollections: vi.fn().mockResolvedValue([]),
    getAyahTafsir: vi.fn(),
    getAyahAudio: vi.fn(),
    saveAyahReflectionNote: vi.fn(),
    addReflectionToCollection: vi.fn(),
    setReflectionFeedback: vi.fn(),
    showAlternateAyah: vi.fn(),
    copyReflectionShareCard: vi.fn(),
  } satisfies Partial<Window['ayati']>;
}

describe('ScreenshotQuestion', () => {
  beforeEach(() => {
    installMockAyati(new Error(
      "Error invoking remote method 'ayah-capture-reflection': Error: AI provider error 400: This model does not support image input.",
    ));
  });

  it('shows the AI provider error instead of a generic fallback message', async () => {
    render(<ScreenshotQuestion />);

    expect(await screen.findByRole('heading', { name: /reflection unavailable/i })).toBeInTheDocument();
    expect(screen.getByText('AI provider error 400: This model does not support image input.')).toBeInTheDocument();
    expect(screen.queryByText(/Error invoking remote method/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not create a reflection right now/i)).not.toBeInTheDocument();
  });

  it('uses a pending command result instead of recapturing after the modal opens', async () => {
    const ayati = installMockAyati(new Error('Should not capture again.'), { reflection });

    render(<ScreenshotQuestion />);

    expect(await screen.findByText('Al-Baqarah 2:286')).toBeInTheDocument();
    expect(ayati.captureAyahReflection).not.toHaveBeenCalled();
  });

  it('shows a pending command error without recapturing after the modal opens', async () => {
    const ayati = installMockAyati(new Error('Should not capture again.'), {
      error: 'AI provider is not connected.',
    });

    render(<ScreenshotQuestion />);

    expect(await screen.findByRole('heading', { name: /reflection unavailable/i })).toBeInTheDocument();
    expect(screen.getByText('AI provider is not connected.')).toBeInTheDocument();
    expect(ayati.captureAyahReflection).not.toHaveBeenCalled();
  });

  it('disables re-capture controls while waiting for the pending reflection result', async () => {
    let resolvePending: ((value: PendingAyahReflectionResult | null) => void) | null = null;
    const pendingPromise = new Promise<PendingAyahReflectionResult | null>((resolve) => {
      resolvePending = resolve;
    });
    const ayati = installMockAyati(new Error('Should not capture again.'), pendingPromise);
    const user = userEvent.setup();

    render(<ScreenshotQuestion />);

    const reflectAgainButton = screen.getByRole('button', { name: /new capture/i });
    expect(reflectAgainButton).toBeDisabled();

    await user.click(reflectAgainButton);
    expect(ayati.captureAyahReflection).not.toHaveBeenCalled();

    await act(async () => {
      resolvePending?.({ reflection });
      await pendingPromise;
    });
    expect(await screen.findByText('Al-Baqarah 2:286')).toBeInTheDocument();
  });
});
