import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PetChat } from './PetChat';

type PetChatMessageHandler = Parameters<Window['ayati']['onPetChatMessage']>[0];

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
    petChatReply: vi.fn(),
    hidePetChat: vi.fn(),
    openAssistant: vi.fn(),
    saveAyahReflection: vi.fn(),
    saveAyahReflectionNote: vi.fn(),
    getClawbotStatus: vi.fn(),
    sendToClawbot: vi.fn(),
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

    expect(bubble).toHaveClass('pet-speech-bubble');
    expect(bubble).not.toHaveClass('overflow-hidden');
    expect(tail).not.toBeNull();
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
        quickReplies: ['Reflect', 'Save', 'Not now'],
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
        quickReplies: ['Reflect', 'Save', 'Not now'],
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

  it('saves the linked reflection when a Quran nudge asks to save', async () => {
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
        quickReplies: ['Reflect', 'Save', 'Not now'],
        reflectionId: 'reflection-1',
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save' }));
    });

    await waitFor(() => {
      expect(window.ayati.saveAyahReflection).toHaveBeenCalledWith('reflection-1');
    });
    expect(await screen.findByText(/saved this reflection/i)).toBeInTheDocument();
  });

  it('dismisses Quran nudges when the user chooses not now', () => {
    const { sendPetMessage } = installMockAyati();

    render(<PetChat />);

    act(() => {
      sendPetMessage({
        id: 'pet-message-4',
        text: 'A fitting reminder: Read, in the Name of your Lord Who created. — 96:1',
        quickReplies: ['Reflect', 'Save', 'Not now'],
        reflectionId: 'reflection-1',
      });
    });

    screen.getByRole('button', { name: 'Not now' }).click();

    expect(window.ayati.petChatReply).toHaveBeenCalledWith('dismiss');
    expect(window.ayati.hidePetChat).toHaveBeenCalled();
  });
});
