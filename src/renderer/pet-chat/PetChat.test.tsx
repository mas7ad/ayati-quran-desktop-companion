import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetChat } from './PetChat';

type PetChatMessageHandler = Parameters<Window['ayati']['onPetChatMessage']>[0];

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function installMockAyati(): {
  sendPetMessage: PetChatMessageHandler;
  ayati: Partial<Window['ayati']>;
} {
  let messageHandler: PetChatMessageHandler = () => {};
  const ayati = {
    onPetChatMessage: vi.fn((callback: PetChatMessageHandler) => {
      messageHandler = callback;
    }),
    resizePetChat: vi.fn(),
    petChatInteracted: vi.fn(),
    setPetChatAudioPlaying: vi.fn(),
    petChatReply: vi.fn(),
    hidePetChat: vi.fn(),
    openAssistant: vi.fn(),
    saveAyahReflection: vi.fn(),
    saveAyahReflectionNote: vi.fn(),
    getAyahTafsir: vi.fn(),
    getClawbotStatus: vi.fn(),
    sendToClawbot: vi.fn(),
    qulIsAvailable: vi.fn().mockResolvedValue(false),
    getAyahLensSettings: vi.fn().mockResolvedValue({ qulArabicEnabled: false }),
    getQulRenderedVerse: vi.fn(),
    getAyahAudio: vi.fn(),
  } satisfies Partial<Window['ayati']>;

  Object.defineProperty(window, 'ayati', {
    configurable: true,
    writable: true,
    value: ayati,
  });

  return {
    sendPetMessage: (message) => messageHandler(message),
    ayati,
  };
}

describe('PetChat', () => {
  beforeEach(() => {
    vi.spyOn(HTMLAudioElement.prototype, 'pause').mockImplementation(() => {});

    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }

    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });
  });

  it('presents pet messages as a speech bubble with a visible tail', async () => {
    const { sendPetMessage } = installMockAyati();

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-1',
        text: 'Also, I hope `Pet.tsx` is a literal pet.',
        quickReplies: ['Thanks!', 'Tell me more', 'Not now'],
      });
    });

    const bubble = await screen.findByRole('group', { name: /pet speech bubble/i });
    const tail = bubble.querySelector('.pet-speech-bubble-tail');
    const content = bubble.querySelector('.pet-chat-content');

    expect(bubble).toHaveClass('pet-speech-bubble');
    expect(bubble).not.toHaveClass('overflow-hidden');
    expect(tail).not.toBeNull();
    expect(content).toHaveClass('px-4', 'pt-4', 'pb-3');
    expect(screen.getByRole('button', { name: 'Tell me more' })).toHaveClass('px-3', 'py-2');
    expect(screen.getByRole('button', { name: 'Tell me more' })).toBeInTheDocument();

    await waitFor(() => {
      expect(window.ayati.resizePetChat).toHaveBeenCalled();
    });
  });

  it('opens an inline reflection note when Reflect is chosen for a Quran nudge', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-2',
        text: 'A fitting reminder — **Al-Alaq · 96:1**',
        arabicText: 'ٱقْرَأْ',
        footerText: 'Read, in the Name of your Lord Who created.',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Reflect' }));
    });

    expect(window.ayati.petChatReply).toHaveBeenCalledWith('curious');
    expect(window.ayati.openAssistant).not.toHaveBeenCalled();
    expect(window.ayati.hidePetChat).not.toHaveBeenCalled();
    expect(screen.getByText('ٱقْرَأْ')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('Read, in the Name of your Lord Who created.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write your reflection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save reflection' })).toHaveClass('px-3', 'py-2');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('px-3', 'py-2');
  });

  it('shows Tafsir between Listen and Reflect and loads it inline', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    vi.mocked(window.ayati.getAyahTafsir).mockResolvedValue({
      id: 'reflection-1',
      verseKey: '96:1',
      surahName: 'Al-Alaq',
      ayahNumber: 1,
      arabicText: 'ٱقْرَأْ',
      translation: 'Read.',
      translatorId: 20,
      reflection: 'Begin with remembrance.',
      whyThisVerse: 'The screen suggested study.',
      screenSummary: 'A study window is active.',
      themes: [{ id: 'study', confidence: 0.82 }],
      createdAt: Date.now(),
      syncState: 'local',
      tafsir: {
        resourceId: 169,
        resourceName: 'Tafsir Ibn Kathir',
        text: 'This tafsir explains the opening command to read. It connects learning with remembrance. It then gives the believer a practical orientation.',
        fetchedAt: Date.now(),
      },
    });

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-tafsir',
        text: 'A fitting reminder — **Al-Alaq · 96:1**',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Listen',
      'Tafsir',
      'Reflect',
      'Save',
      'Dismiss',
    ]);
    expect(screen.getByRole('group', { name: /pet speech bubble/i })).toHaveClass('max-w-[380px]');
    expect(screen.getByRole('button', { name: 'Tafsir' }).parentElement).toHaveClass('flex-nowrap');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Tafsir' }));
    });

    await waitFor(() => {
      expect(window.ayati.getAyahTafsir).toHaveBeenCalledWith('reflection-1');
    });
    const tafsirRegion = screen.getByRole('region', { name: /tafsir/i });
    expect(tafsirRegion).toHaveTextContent('Tafsir Ibn Kathir');
    expect(tafsirRegion).toHaveTextContent(
      'This tafsir explains the opening command to read. It connects learning with remembrance.',
    );
    expect(tafsirRegion).toHaveTextContent('It then gives the believer a practical orientation.');
    expect(window.ayati.hidePetChat).not.toHaveBeenCalled();
  });

  it('keeps the reminder visible and shows Tafsir loading on the button while tafsir is fetched', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    const tafsirRequest = createDeferred<Awaited<ReturnType<Window['ayati']['getAyahTafsir']>>>();
    vi.mocked(window.ayati.getAyahTafsir).mockReturnValue(tafsirRequest.promise);

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-tafsir-loading',
        text: 'A fitting reminder — **Al-Alaq · 96:1**',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    await user.click(screen.getByRole('button', { name: 'Tafsir' }));

    expect(screen.getByText(/a fitting reminder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading tafsir/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Listen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reflect' })).toBeInTheDocument();
  });

  it('reports content size again when a same-sized reminder replaces the current message', async () => {
    const { sendPetMessage } = installMockAyati();

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-size-1',
        text: 'First reminder',
        quickReplies: ['Not now'],
      });
    });

    await waitFor(() => {
      expect(window.ayati.resizePetChat).toHaveBeenCalledTimes(1);
    });

    act(() => {
      sendPetMessage({
        id: 'pet-message-size-2',
        text: 'Other reminder',
        quickReplies: ['Not now'],
      });
    });

    await waitFor(() => {
      expect(window.ayati.resizePetChat).toHaveBeenCalledTimes(2);
    });
  });

  it('saves a reflection note from the pet chat field', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    vi.mocked(window.ayati.saveAyahReflectionNote).mockResolvedValue({
      id: 'reflection-1',
      verseKey: '96:1',
      surahName: 'Al-Alaq',
      ayahNumber: 1,
      arabicText: 'ٱقْرَأْ',
      translation: 'Read.',
      translatorId: 20,
      reflection: 'Begin with remembrance.',
      whyThisVerse: 'The screen suggested study.',
      screenSummary: 'A study window is active.',
      themes: [{ id: 'study', confidence: 0.82 }],
      createdAt: Date.now(),
      savedAt: Date.now(),
      syncState: 'local',
      note: { body: 'A thoughtful note about this ayah.', syncState: 'local' },
    });

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-note',
        text: 'A fitting reminder — **Al-Alaq · 96:1**',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Reflect' }));
    });

    const field = screen.getByPlaceholderText(/write your reflection/i);
    await user.type(field, 'A thoughtful note about this ayah.');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save reflection' }));
    });

    await waitFor(() => {
      expect(window.ayati.saveAyahReflectionNote).toHaveBeenCalledWith(
        'reflection-1',
        'A thoughtful note about this ayah.',
      );
    });
    expect(await screen.findByText(/reflection note saved/i)).toBeInTheDocument();
  });

  it('saves the linked verse reminder when a Quran nudge asks to save', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    vi.mocked(window.ayati.saveAyahReflection).mockResolvedValue({
      id: 'reflection-1',
      verseKey: '96:1',
      surahName: 'Al-Alaq',
      ayahNumber: 1,
      arabicText: 'ٱقْرَأْ',
      translation: 'Read.',
      translatorId: 20,
      reflection: 'Begin with remembrance.',
      whyThisVerse: 'The screen suggested study.',
      screenSummary: 'A study window is active.',
      themes: [{ id: 'study', confidence: 0.82 }],
      createdAt: Date.now(),
      savedAt: Date.now(),
      syncState: 'local',
    });

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-3',
        text: 'A fitting reminder: Read, in the Name of your Lord Who created. — 96:1',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save' }));
    });

    await waitFor(() => {
      expect(window.ayati.saveAyahReflection).toHaveBeenCalledWith('reflection-1');
    });
    expect(await screen.findByText(/saved this verse reminder/i)).toBeInTheDocument();
    expect(screen.queryByText(/saved this reflection/i)).not.toBeInTheDocument();
  });

  it('dismisses Quran nudges when the user chooses Dismiss', () => {
    const { sendPetMessage } = installMockAyati();

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-4',
        text: 'A fitting reminder: Read, in the Name of your Lord Who created. — 96:1',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    screen.getByRole('button', { name: 'Dismiss' }).click();

    expect(window.ayati.petChatReply).toHaveBeenCalledWith('dismiss');
    expect(window.ayati.hidePetChat).toHaveBeenCalled();
  });

  it('changes Listen to Pause while recitation is playing', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    const playSpy = vi.spyOn(HTMLAudioElement.prototype, 'play').mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(HTMLAudioElement.prototype, 'pause').mockImplementation(() => {});
    vi.mocked(window.ayati.getAyahAudio).mockResolvedValue({
      id: 'reflection-1',
      verseKey: '96:1',
      surahName: 'Al-Alaq',
      ayahNumber: 1,
      arabicText: 'ٱقْرَأْ',
      translation: 'Read.',
      translatorId: 20,
      reflection: 'Note',
      whyThisVerse: 'Reason',
      screenSummary: 'Summary',
      themes: [{ id: 'study', confidence: 0.5 }],
      createdAt: Date.now(),
      syncState: 'local',
      audio: {
        recitationId: 7,
        url: 'https://example.com/recitation.mp3',
        fetchedAt: Date.now(),
      },
    });

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-listen',
        text: 'Time for a Quran reminder',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
        verseKey: '96:1',
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Listen' }));
    });

    await waitFor(() => {
      expect(window.ayati.getAyahAudio).toHaveBeenCalledWith('reflection-1');
    });
    expect(playSpy).toHaveBeenCalled();
    expect(window.ayati.setPetChatAudioPlaying).toHaveBeenCalledWith(true);
    expect(window.ayati.hidePetChat).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause' }));

    expect(pauseSpy).toHaveBeenCalled();
    expect(window.ayati.setPetChatAudioPlaying).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: 'Listen' })).toBeInTheDocument();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  it('keeps the reminder visible and shows Listen loading on the button while audio is fetched', async () => {
    const user = userEvent.setup();
    const { sendPetMessage } = installMockAyati();
    const audioRequest = createDeferred<Awaited<ReturnType<Window['ayati']['getAyahAudio']>>>();
    vi.mocked(window.ayati.getAyahAudio).mockReturnValue(audioRequest.promise);

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-listen-loading',
        text: 'Time for a Quran reminder',
        quickReplies: ['Listen', 'Tafsir', 'Reflect', 'Save', 'Dismiss'],
        reflectionId: 'reflection-1',
      });
    });

    await user.click(screen.getByRole('button', { name: 'Listen' }));

    expect(screen.getByText(/time for a quran reminder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading listen/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tafsir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reflect' })).toBeInTheDocument();
  });
});
