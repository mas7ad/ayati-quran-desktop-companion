import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { QulArabicText } from '../components/QulArabicText';

const MIN_REFLECTION_NOTE_CHARS = 6;

interface ChatMessage {
  id: string;
  text: string;
  quickReplies?: string[];
  reflectionId?: string;
  verseKey?: string;
  arabicText?: string;
  footerText?: string;
}

const DEFAULT_QUICK_REPLIES = ['Thanks!', 'Tell me more', 'Not now'];

interface PetChatTafsir {
  resourceName: string;
  paragraphs: string[];
}

function pausePetChatAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.pause();
  } catch {
    // JSDOM does not implement media pause in some environments.
  }
}

function formatTafsirParagraphs(text: string): string[] {
  const explicitParagraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) return explicitParagraphs;

  const sentences = (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text])
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (sentences.length <= 2) return sentences;

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '));
  }
  return paragraphs;
}

export const PetChat: React.FC = () => {
  const [message, setMessage] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingQuickReply, setLoadingQuickReply] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [tafsir, setTafsir] = useState<PetChatTafsir | null>(null);
  const [isReflectNoteOpen, setIsReflectNoteOpen] = useState(false);
  const [reflectNoteDraft, setReflectNoteDraft] = useState('');
  const [reflectNoteError, setReflectNoteError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const lastInteractionSentAtRef = useRef(0);
  const petChatAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.ayati.onPetChatMessage((msg) => {
      lastSizeRef.current = null;
      pausePetChatAudio(petChatAudioRef.current);
      petChatAudioRef.current = null;
      setIsAudioPlaying(false);
      window.ayati.setPetChatAudioPlaying(false);
      setMessage({
        ...msg,
        quickReplies: msg.quickReplies || DEFAULT_QUICK_REPLIES,
      });
      setIsLoading(false);
      setLoadingQuickReply(null);
      setTafsir(null);
      setIsReflectNoteOpen(false);
      setReflectNoteDraft('');
      setReflectNoteError(null);
    });
  }, []);

  useEffect(() => {
    return () => {
      pausePetChatAudio(petChatAudioRef.current);
      petChatAudioRef.current = null;
      window.ayati.setPetChatAudioPlaying(false);
    };
  }, []);

  const reportContentSize = useCallback(() => {
    const element = contentRef.current;
    if (!element || !message) return;

    const rect = element.getBoundingClientRect();
    const width = Math.ceil(rect.width) + 8;
    const height = Math.ceil(rect.height);
    const lastSize = lastSizeRef.current;

    if (lastSize && Math.abs(lastSize.width - width) < 2 && Math.abs(lastSize.height - height) < 2) {
      return;
    }

    lastSizeRef.current = { width, height };
    window.ayati.resizePetChat(width, height);
  }, [message]);

  useLayoutEffect(() => {
    if (!message) return;

    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      reportContentSize();
      frame2 = requestAnimationFrame(reportContentSize);
    });

    return () => {
      cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
    };
  }, [message, isLoading, loadingQuickReply, isAudioPlaying, tafsir, isReflectNoteOpen, reflectNoteDraft, reportContentSize]);

  useEffect(() => {
    if (!message || !contentRef.current) return;

    const observer = new ResizeObserver(() => {
      reportContentSize();
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [message, reportContentSize]);

  const notifyInteraction = useCallback(() => {
    const now = Date.now();
    if (now - lastInteractionSentAtRef.current < 600) return;
    lastInteractionSentAtRef.current = now;
    window.ayati.petChatInteracted();
  }, []);

  const cancelReflectionNote = useCallback(() => {
    setIsReflectNoteOpen(false);
    setReflectNoteDraft('');
    setReflectNoteError(null);
    window.ayati.petChatReply('dismiss');
  }, []);

  const saveReflectionNote = useCallback(async () => {
    if (!message?.reflectionId) return;

    const body = reflectNoteDraft.trim();
    if (body.length < MIN_REFLECTION_NOTE_CHARS) {
      setReflectNoteError(`Add at least ${MIN_REFLECTION_NOTE_CHARS} characters.`);
      return;
    }

    setIsLoading(true);
    setReflectNoteError(null);
    window.ayati.petChatReply('thinking');
    try {
      const saved = await window.ayati.saveAyahReflectionNote(message.reflectionId, body);
      if (!saved) {
        setReflectNoteError('Could not save this note. Check length (6–10,000 characters) and try again.');
        window.ayati.petChatReply('curious');
        return;
      }
      setIsReflectNoteOpen(false);
      setReflectNoteDraft('');
      setMessage({
        id: crypto.randomUUID(),
        text: 'Reflection note saved. You can review it anytime under Reflections in Settings.',
        quickReplies: ['Got it', 'Not now'],
      });
      window.ayati.petChatReply('happy');
    } catch {
      setReflectNoteError('Could not save this note. Try again from Reflections.');
      window.ayati.petChatReply('curious');
    } finally {
      setIsLoading(false);
    }
  }, [message?.reflectionId, reflectNoteDraft]);

  const handleQuickReply = useCallback(async (reply: string) => {
    if (!message) return;

    if (reply === 'Dismiss' || reply === 'Not now') {
      window.ayati.petChatReply('dismiss');
      window.ayati.hidePetChat();
      return;
    }

    if (reply === 'Pause') {
      pausePetChatAudio(petChatAudioRef.current);
      setIsAudioPlaying(false);
      window.ayati.setPetChatAudioPlaying(false);
      window.ayati.petChatReply('curious');
      return;
    }

    if (reply === 'Listen') {
      if (!message.reflectionId) {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Recitation is unavailable for this message.',
          quickReplies: ['Got it', 'Dismiss'],
        });
        return;
      }

      setLoadingQuickReply('Listen');
      window.ayati.petChatReply('thinking');
      try {
        const updated = await window.ayati.getAyahAudio(message.reflectionId);
        const url = updated?.audio?.url;
        if (!url) {
          setMessage({
            id: crypto.randomUUID(),
            text: 'Could not load recitation. Try again from Reflections after checking your connection.',
            quickReplies: ['Got it', 'Dismiss'],
          });
          window.ayati.petChatReply('curious');
          return;
        }

        pausePetChatAudio(petChatAudioRef.current);
        const audio = new Audio(url);
        petChatAudioRef.current = audio;
        audio.addEventListener('ended', () => {
          setIsAudioPlaying(false);
          window.ayati.setPetChatAudioPlaying(false);
          window.ayati.petChatReply('happy');
        });
        audio.addEventListener('pause', () => {
          setIsAudioPlaying(false);
          window.ayati.setPetChatAudioPlaying(false);
        });
        try {
          await audio.play();
          setIsAudioPlaying(true);
          window.ayati.setPetChatAudioPlaying(true);
          window.ayati.petChatReply('curious');
        } catch {
          window.ayati.setPetChatAudioPlaying(false);
          setMessage({
            id: crypto.randomUUID(),
            text: 'Could not start playback. Check system audio and try again.',
            quickReplies: ['Got it', 'Dismiss'],
          });
          window.ayati.petChatReply('curious');
        }
      } catch {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Could not load recitation. Try again from Reflections.',
          quickReplies: ['Got it', 'Dismiss'],
        });
        window.ayati.petChatReply('curious');
      } finally {
        setLoadingQuickReply(null);
      }
      return;
    }

    if (reply === 'Tafsir') {
      if (!message.reflectionId) {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Tafsir is unavailable for this message.',
          quickReplies: ['Got it', 'Dismiss'],
        });
        return;
      }

      setLoadingQuickReply('Tafsir');
      window.ayati.petChatReply('thinking');
      try {
        const updated = await window.ayati.getAyahTafsir(message.reflectionId);
        if (!updated?.tafsir?.text) {
          setMessage({
            id: crypto.randomUUID(),
            text: 'Could not load tafsir. Try again from Reflections.',
            quickReplies: ['Got it', 'Dismiss'],
          });
          window.ayati.petChatReply('curious');
          return;
        }

        setTafsir({
          resourceName: updated.tafsir.resourceName,
          paragraphs: formatTafsirParagraphs(updated.tafsir.text),
        });
        window.ayati.petChatReply('curious');
      } catch {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Could not load tafsir. Try again from Reflections.',
          quickReplies: ['Got it', 'Dismiss'],
        });
        window.ayati.petChatReply('curious');
      } finally {
        setLoadingQuickReply(null);
      }
      return;
    }

    if (reply === 'Start Break' || reply === 'Start Focus' || reply === 'Open Focus') {
      window.ayati.petChatReply(reply);
      window.ayati.hidePetChat();
      return;
    }

    if (reply === 'Reflect') {
      window.ayati.petChatReply('curious');
      if (message.reflectionId) {
        setIsReflectNoteOpen(true);
        setReflectNoteError(null);
        return;
      }
      window.ayati.openAssistant();
      window.ayati.hidePetChat();
      return;
    }

    if (reply === 'Save') {
      if (!message.reflectionId) {
        setMessage({
          id: crypto.randomUUID(),
          text: 'There is no verse reminder to save yet.',
          quickReplies: ['Got it', 'Not now'],
        });
        return;
      }

      setIsLoading(true);
      window.ayati.petChatReply('thinking');
      try {
        const savedReflection = await window.ayati.saveAyahReflection(message.reflectionId);
        setMessage({
          id: crypto.randomUUID(),
          text: savedReflection?.syncState === 'synced'
            ? 'Saved this verse reminder to Quran Foundation bookmarks.'
            : 'Saved this verse reminder locally.',
          quickReplies: ['Got it', 'Not now'],
        });
        window.ayati.petChatReply('happy');
      } catch {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Could not save this verse reminder. Try again from Reflections.',
          quickReplies: ['Got it', 'Not now'],
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (reply === 'Tell me more') {
      const status = await window.ayati.getClawbotStatus();
      if (!status.connected) {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Gateway not connected. Update your AI provider settings, then check the connection again.',
          quickReplies: ['Got it', 'Not now'],
        });
        return;
      }

      setIsLoading(true);
      window.ayati.petChatReply('thinking');
      try {
        const response = await window.ayati.sendToClawbot(
          `Tell me more about: ${message.text}`,
        ) as { text?: string };

        if (response.text) {
          setMessage({
            id: crypto.randomUUID(),
            text: response.text,
            quickReplies: ['Thanks!', 'Not now'],
          });
          window.ayati.petChatReply('curious');
        }
      } catch {
        setMessage({
          id: crypto.randomUUID(),
          text: 'Couldn\'t connect to gateway. Make sure it\'s running.',
          quickReplies: ['Got it', 'Not now'],
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (reply === 'Got it') {
      window.ayati.petChatReply('dismiss');
      window.ayati.hidePetChat();
      return;
    }

    window.ayati.petChatReply('thanks');
    window.ayati.hidePetChat();
  }, [message]);

  if (!message) return null;

  const scrollMaxClass = isReflectNoteOpen || tafsir || message.arabicText ? 'max-h-[280px]' : 'max-h-[150px]';

  return (
    <div className="w-full h-full flex items-end justify-center">
      <div ref={contentRef} className="inline-block px-2 pb-4">
        <div
          role="group"
          aria-label="Pet speech bubble"
          className="pet-speech-bubble min-w-[260px] max-w-[380px] w-max animate-speech-bubble-in"
          onMouseEnter={notifyInteraction}
          onMouseMove={notifyInteraction}
          onMouseDown={notifyInteraction}
          onTouchStart={notifyInteraction}
          onWheel={notifyInteraction}
        >
          <div className="pet-speech-bubble-panel">
            <div className={`pet-chat-content px-4 pt-4 pb-3 overflow-y-auto ${scrollMaxClass}`}>
              {isLoading ? (
                <div className="flex gap-1 justify-center py-2">
                  <span className="w-2 h-2 rounded-full bg-[#67E0A3] loading-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-[#67E0A3] loading-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-[#67E0A3] loading-dot"></span>
                </div>
              ) : (
                <>
                  <div className="text-sm text-neutral-200 leading-relaxed break-words select-text cursor-text">
                    <MarkdownMessage content={message.text} />
                  </div>
                  {message.arabicText ? (
                    message.verseKey ? (
                      <QulArabicText
                        verseKey={message.verseKey}
                        fallbackText={message.arabicText}
                        className="pet-chat-arabic"
                        variant="petChat"
                      />
                    ) : (
                      <p className="pet-chat-arabic" dir="rtl" lang="ar" translate="no">
                        {message.arabicText}
                      </p>
                    )
                  ) : null}
                  {message.footerText ? (
                    <p className="pet-chat-translation">{message.footerText}</p>
                  ) : null}
                  {tafsir ? (
                    <section className="pet-chat-tafsir" aria-label="Tafsir">
                      <p className="pet-chat-tafsir-title">{tafsir.resourceName}</p>
                      <div className="pet-chat-tafsir-body">
                        {tafsir.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {isReflectNoteOpen && message.reflectionId ? (
                    <div className="mt-3">
                      <label htmlFor="pet-chat-reflect-note" className="sr-only">
                        Your reflection
                      </label>
                      <textarea
                        id="pet-chat-reflect-note"
                        className="pet-chat-reflect-field"
                        placeholder="Write your reflection (saved with this ayah)…"
                        value={reflectNoteDraft}
                        onChange={(e) => {
                          setReflectNoteDraft(e.target.value);
                          setReflectNoteError(null);
                        }}
                        rows={4}
                        autoFocus
                      />
                      {reflectNoteError ? (
                        <p className="pet-chat-reflect-hint text-amber-200/90">{reflectNoteError}</p>
                      ) : (
                        <p className="pet-chat-reflect-hint">
                          {MIN_REFLECTION_NOTE_CHARS}+ characters. Saved to Reflections.
                        </p>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {!isLoading && !isReflectNoteOpen && message.quickReplies && (
              <div className="flex gap-1.5 px-2 pb-2 pt-2 flex-nowrap justify-center border-t border-white/5">
                {message.quickReplies.map((reply) => {
                  const label = reply === 'Listen' && isAudioPlaying ? 'Pause' : reply;
                  const isButtonLoading = loadingQuickReply === reply;
                  return (
                    <button
                      key={reply}
                      type="button"
                      aria-label={isButtonLoading ? `Loading ${reply}` : undefined}
                      aria-busy={isButtonLoading}
                      disabled={loadingQuickReply !== null}
                      onClick={() => handleQuickReply(label)}
                      className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E0A3]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] disabled:cursor-default disabled:opacity-75 ${
                        label === 'Dismiss' || label === 'Not now'
                          ? 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-300'
                          : 'bg-[#67E0A3]/10 border border-[#67E0A3]/20 text-[#67E0A3] hover:bg-[#67E0A3]/20 hover:border-[#67E0A3]/40'
                      }`}
                    >
                      {isButtonLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-current loading-dot" aria-hidden="true" />
                          <span>{label}</span>
                        </span>
                      ) : label}
                    </button>
                  );
                })}
              </div>
            )}

            {!isLoading && isReflectNoteOpen && (
              <div className="flex gap-2 px-3 pb-2 pt-2 flex-wrap justify-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => void saveReflectionNote()}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E0A3]/60 bg-[#67E0A3]/10 border border-[#67E0A3]/20 text-[#67E0A3] hover:bg-[#67E0A3]/20"
                >
                  Save reflection
                </button>
                <button
                  type="button"
                  onClick={cancelReflectionNote}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="pet-speech-bubble-tail" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
