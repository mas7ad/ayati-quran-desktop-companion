import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizePetAppearanceId, type PetAppearanceId } from '../../shared/pet-appearance';
import { SpritePet } from './SpritePet';
import {
  isSleepVisualState,
  normalizeIncomingPetState,
  resolveSpriteClip,
  type LegacyMood,
  type PetVisualState,
} from './pet-sprite-logic';
import { TutorialOverlay } from './TutorialOverlay';

type IdleBehavior = 'blink' | 'look_around' | 'snip_claws' | 'yawn' | 'stretch' | 'wiggle' | 'wander' | null;

interface ChatMessage {
  id: string;
  text: string;
  content?: string;
  trigger?: 'app_switch' | 'idle' | 'proactive' | 'suggestion';
  quickReplies?: string[];
  reflectionId?: string;
  verseKey?: string;
  arabicText?: string;
  footerText?: string;
}

const DEFAULT_QUICK_REPLIES = ['Thanks!', 'Tell me more', 'Not now'];
const WAKE_WINDOW_FLIGHT_DURATION_MS = 1100;
const IDLE_BEHAVIOR_DURATIONS_MS: Record<NonNullable<IdleBehavior>, number> = {
  blink: 400,
  look_around: 2000,
  snip_claws: 1500,
  yawn: 2500,
  stretch: 2000,
  wiggle: 1200,
  wander: 2500,
};
const IDLE_BEHAVIORS = new Set<string>(Object.keys(IDLE_BEHAVIOR_DURATIONS_MS));

const getIdleBehaviorDuration = (idleBehavior: IdleBehavior): number => {
  if (!idleBehavior) return 1500;
  return IDLE_BEHAVIOR_DURATIONS_MS[idleBehavior];
};

const isIdleBehavior = (nextIdleBehavior: string | null | undefined): nextIdleBehavior is NonNullable<IdleBehavior> => (
  Boolean(nextIdleBehavior && IDLE_BEHAVIORS.has(nextIdleBehavior))
);
const shouldReduceMotion = (): boolean => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const PET_APPEARANCE_SETTINGS_SYNC_MS = 1000;

export const Pet: React.FC = () => {
  const [appearanceId, setAppearanceId] = useState<PetAppearanceId>('ayah');
  const [visualState, setVisualState] = useState<PetVisualState>('idle');
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState<'left' | 'right' | null>(null);
  const [dragRun, setDragRun] = useState<{ dir: 'left' | 'right' } | null>(null);
  const [idleBehavior, setIdleBehavior] = useState<IdleBehavior>(null);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [transparentWhenSleeping, setTransparentWhenSleeping] = useState(false);
  const [showModeOverlay, setShowModeOverlay] = useState(false);
  const [cameraSnapActive, setCameraSnapActive] = useState(false);
  const [cameraFlashActive, setCameraFlashActive] = useState(false);
  const [wakeWindowFlightActive, setWakeWindowFlightActive] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const idleBehaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraSnapEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraFlashOnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraFlashOffTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeWindowFlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sleepLockedRef = useRef(false);

  const setPetVisualState = useCallback((next: PetVisualState) => {
    const sleeping = isSleepVisualState(next);
    sleepLockedRef.current = sleeping;
    if (sleeping) {
      setIsWalking(false);
      setWalkDirection(null);
      if (idleBehaviorTimeoutRef.current) {
        clearTimeout(idleBehaviorTimeoutRef.current);
        idleBehaviorTimeoutRef.current = null;
      }
      if (wakeWindowFlightTimeoutRef.current) {
        clearTimeout(wakeWindowFlightTimeoutRef.current);
        wakeWindowFlightTimeoutRef.current = null;
      }
      setIdleBehavior(null);
      setWakeWindowFlightActive(false);
    }
    setVisualState(next);
  }, []);

  const canApplyMoodUpdate = useCallback((next: PetVisualState): boolean => {
    if (!sleepLockedRef.current) return true;
    return next === 'sleeping' || next === 'doze' || next === 'startle' || next === 'idle';
  }, []);

  const playIdleBehavior = useCallback((nextIdleBehavior: IdleBehavior) => {
    if (idleBehaviorTimeoutRef.current) {
      clearTimeout(idleBehaviorTimeoutRef.current);
    }

    setIdleBehavior(nextIdleBehavior);

    idleBehaviorTimeoutRef.current = setTimeout(() => {
      setIdleBehavior(null);
      idleBehaviorTimeoutRef.current = null;
    }, getIdleBehaviorDuration(nextIdleBehavior));
  }, []);

  const playWakeWindowFlight = useCallback(() => {
    if (wakeWindowFlightTimeoutRef.current) {
      clearTimeout(wakeWindowFlightTimeoutRef.current);
    }

    setWakeWindowFlightActive(true);
    if (!shouldReduceMotion()) {
      void window.ayati.playPetWakeFlight().catch((error) => {
        console.warn('[Pet] Failed to play wake window flight:', error);
      });
    }

    wakeWindowFlightTimeoutRef.current = setTimeout(() => {
      setWakeWindowFlightActive(false);
      wakeWindowFlightTimeoutRef.current = null;
    }, WAKE_WINDOW_FLIGHT_DURATION_MS);
  }, []);

  const syncAppearanceFromSettings = useCallback(async (shouldApply: () => boolean = () => true) => {
    const settings = await window.ayati.getSettings();
    if (!shouldApply()) return;

    const typedSettings = settings as {
      pet?: { transparentWhenSleeping?: boolean; appearanceId?: string };
      dev?: { showPetModeOverlay?: boolean };
    };
    const petSettings = typedSettings.pet;
    const devSettings = typedSettings.dev;
    setTransparentWhenSleeping(Boolean(petSettings?.transparentWhenSleeping));
    setAppearanceId(normalizePetAppearanceId(petSettings?.appearanceId));
    setShowModeOverlay(Boolean(devSettings?.showPetModeOverlay));
  }, []);

  // Handle mood updates from ClawBot
  useEffect(() => {
    let isMounted = true;
    const syncIfMounted = async () => {
      if (!isMounted) return;
      try {
        await syncAppearanceFromSettings(() => isMounted);
      } catch (error) {
        console.warn('[Pet] Failed to sync appearance settings:', error);
      }
    };
    void syncIfMounted();
    const appearanceSettingsSyncInterval = window.setInterval(() => {
      void syncIfMounted();
    }, PET_APPEARANCE_SETTINGS_SYNC_MS);

    window.ayati.onClawbotMood((data: unknown) => {
      const moodData = data as { state: string; reason?: string };
      const next = normalizeIncomingPetState(moodData.state);
      if (!canApplyMoodUpdate(next)) return;
      setPetVisualState(next);
    });

    window.ayati.onPetTransparentSleepChanged((enabled: boolean) => {
      setTransparentWhenSleeping(enabled);
    });
    window.ayati.onDevShowPetModeOverlayChanged((enabled: boolean) => {
      setShowModeOverlay(enabled);
    });

    if (typeof window.ayati.onPetAppearanceChanged === 'function') {
      window.ayati.onPetAppearanceChanged((id: unknown) => {
        setAppearanceId(normalizePetAppearanceId(id));
      });
    }

    window.ayati.onChatPopup((data: unknown) => {
      const messageData = data as ChatMessage;
      const message = {
        id: messageData.id || crypto.randomUUID(),
        text: messageData.text || messageData.content || '',
        quickReplies: messageData.quickReplies || DEFAULT_QUICK_REPLIES,
        reflectionId: messageData.reflectionId,
        verseKey: messageData.verseKey,
        arabicText: messageData.arabicText,
        footerText: messageData.footerText,
      };
      window.ayati.showPetChat(message);
      if (!sleepLockedRef.current) {
        setPetVisualState('curious');
      }
    });

    // Legacy suggestion support - show in separate window
    window.ayati.onClawbotSuggestion((data: unknown) => {
      const suggestionData = data as { text: string; id: string };
      const message = {
        id: suggestionData.id,
        text: suggestionData.text,
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
      window.ayati.showPetChat(message);
    });

    // Handle chat reply reactions
    window.ayati.onPetChatReply((reply: string) => {
      if (sleepLockedRef.current) return;

      if (reply === 'thanks') {
        setPetVisualState('happy');
        setTimeout(() => {
          if (!sleepLockedRef.current) {
            setPetVisualState('idle');
          }
        }, 2000);
      } else if (reply === 'thinking') {
        setPetVisualState('thinking');
      } else if (reply === 'curious') {
        setPetVisualState('curious');
      } else if (reply === 'dismiss') {
        setPetVisualState('idle');
      }
    });

    window.ayati.onActivityEvent((event: unknown) => {
      if (sleepLockedRef.current) return;

      const activityEvent = event as { type: string };
      // React to activity - show curiosity briefly
      if (activityEvent.type === 'app_focus_changed') {
        setPetVisualState('curious');
        setTimeout(() => {
          if (!sleepLockedRef.current) {
            setPetVisualState('idle');
          }
        }, 3000);
      }
    });

    // Listen for pet movement events
    window.ayati.onPetMoving((data: { moving: boolean; direction?: 'left' | 'right' }) => {
      if (sleepLockedRef.current) {
        setIsWalking(false);
        setWalkDirection(null);
        return;
      }
      setIsWalking(data.moving);
      setWalkDirection(data.moving && data.direction ? data.direction : null);
    });

    window.ayati.onPetCameraSnap((data) => {
      if (sleepLockedRef.current) return;

      const captureAtMs = Math.max(0, data.captureAtMs || 0);
      const durationMs = Math.max(captureAtMs + 80, data.durationMs || 900);
      const flashDurationMs = Math.max(60, data.flashDurationMs || 120);

      if (cameraSnapEndTimeoutRef.current) {
        clearTimeout(cameraSnapEndTimeoutRef.current);
      }
      if (cameraFlashOnTimeoutRef.current) {
        clearTimeout(cameraFlashOnTimeoutRef.current);
      }
      if (cameraFlashOffTimeoutRef.current) {
        clearTimeout(cameraFlashOffTimeoutRef.current);
      }

      setCameraSnapActive(true);
      setCameraFlashActive(false);

      cameraFlashOnTimeoutRef.current = setTimeout(() => {
        setCameraFlashActive(true);
        cameraFlashOffTimeoutRef.current = setTimeout(() => {
          setCameraFlashActive(false);
        }, flashDurationMs);
      }, captureAtMs);

      cameraSnapEndTimeoutRef.current = setTimeout(() => {
        setCameraSnapActive(false);
      }, durationMs);
    });

    // Listen for idle behaviors
    window.ayati.onIdleBehavior((data) => {
      if (sleepLockedRef.current) return;

      const idleData = data as { type?: string; direction?: string };
      if (!isIdleBehavior(idleData.type)) return;
      playIdleBehavior(idleData.type);
    });

    // Listen for tutorial events
    window.ayati.onTutorialStep(() => {
      setTutorialActive(true);
    });

    window.ayati.onTutorialEnded(() => {
      setTutorialActive(false);
    });

    window.ayati.onTutorialResumePrompt(() => {
      setTutorialActive(true);
    });

    return () => {
      if (idleBehaviorTimeoutRef.current) {
        clearTimeout(idleBehaviorTimeoutRef.current);
      }
      if (cameraSnapEndTimeoutRef.current) {
        clearTimeout(cameraSnapEndTimeoutRef.current);
      }
      if (cameraFlashOnTimeoutRef.current) {
        clearTimeout(cameraFlashOnTimeoutRef.current);
      }
      if (cameraFlashOffTimeoutRef.current) {
        clearTimeout(cameraFlashOffTimeoutRef.current);
      }
      if (wakeWindowFlightTimeoutRef.current) {
        clearTimeout(wakeWindowFlightTimeoutRef.current);
      }
      isMounted = false;
      window.clearInterval(appearanceSettingsSyncInterval);
      window.ayati.removeAllListeners();
    };
  }, [canApplyMoodUpdate, playIdleBehavior, setPetVisualState, syncAppearanceFromSettings]);

  const isSleepTransparent = transparentWhenSleeping && (visualState === 'sleeping' || visualState === 'doze');
  const shouldShowModeOverlay = import.meta.env.DEV && showModeOverlay;
  const spriteClip = resolveSpriteClip({
    visualState,
    isWalking,
    walkDirection,
    wakeWindowFlightActive,
    cameraSnapActive,
    userDragRun: dragRun,
  });
  const currentMode = wakeWindowFlightActive
    ? 'wake-window-flight'
    : dragRun
      ? `drag:${dragRun.dir}`
      : isWalking
        ? `walk:${walkDirection ?? 'run'}`
        : idleBehavior
          ? `idle:${idleBehavior}`
          : `state:${visualState} clip:${spriteClip}`;

  // Handle dragging - use document-level events to track fast mouse movements
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStart.current = { x: e.screenX, y: e.screenY };

    const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = moveEvent.screenX - dragStart.current.x;
      const deltaY = moveEvent.screenY - dragStart.current.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        didDragRef.current = true;
      }

      if (didDragRef.current) {
        if (Math.abs(deltaX) > 2) {
          setDragRun({ dir: deltaX > 0 ? 'right' : 'left' });
        }
        window.ayati.dragPet(deltaX, deltaY);
        dragStart.current = { x: moveEvent.screenX, y: moveEvent.screenY };
      }
    };

    const handleDocumentMouseUp = () => {
      isDraggingRef.current = false;
      setDragRun(null);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  }, []);

  // Poke reactions - random animations when clicked
  const pokeReactions: Array<{ mood?: LegacyMood; behavior?: IdleBehavior; duration: number }> = [
    // Happy reactions
    { mood: 'happy', duration: 1500 },
    { mood: 'excited', duration: 1500 },
    { mood: 'proud', duration: 1800 },      // feeling smug
    { mood: 'spin', duration: 1000 },       // celebratory spin!
    // Curious/playful
    { mood: 'curious', duration: 1200 },
    { behavior: 'snip_claws', duration: 1500 },
    { behavior: 'wiggle', duration: 1200 },
    // Surprised reactions
    { mood: 'startle', duration: 1200 },    // startled by the poke
    // Annoyed/grumpy reactions
    { mood: 'thinking', duration: 1500 },   // worried/annoyed face
    { mood: 'mad', duration: 1500 },        // arms crossed, annoyed
    { behavior: 'yawn', duration: 2500 },   // bored yawn
    // Neutral
    { behavior: 'stretch', duration: 2000 },
    { behavior: 'look_around', duration: 2000 },
    { behavior: 'blink', duration: 400 },
  ];

  // Single click = poke animation
  const handleClick = useCallback(() => {
    if (didDragRef.current) return;

    // Notify tutorial if active
    if (tutorialActive) {
      window.ayati.tutorialPetClicked();
    }

    if (sleepLockedRef.current) {
      setPetVisualState('idle');
      playWakeWindowFlight();
      window.ayati.petClicked?.();
      return;
    }

    // Pick a random reaction
    const reaction = pokeReactions[Math.floor(Math.random() * pokeReactions.length)];

    if (reaction.mood) {
      setPetVisualState(reaction.mood);
      setTimeout(() => {
        if (!sleepLockedRef.current) {
          setPetVisualState('idle');
        }
      }, reaction.duration);
    } else if (reaction.behavior) {
      setIdleBehavior(reaction.behavior);
      setTimeout(() => {
        if (!sleepLockedRef.current) {
          setIdleBehavior(null);
        }
      }, reaction.duration);
    }

    // Notify main process (optional - for sound effects or other reactions)
    window.ayati.petClicked?.();
  }, [playWakeWindowFlight, setPetVisualState, tutorialActive]);

  // Right click = open custom context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!didDragRef.current) {
      window.ayati.petClicked?.();
      window.ayati.showPetContextMenu(e.screenX, e.screenY);
    }
  }, []);

  return (
    <div
      className={`pet-container ${tutorialActive ? 'tutorial-active' : ''} ${cameraFlashActive ? 'camera-flash-active' : ''}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {shouldShowModeOverlay && (
        <div className="pet-mode-overlay">{currentMode}</div>
      )}

      {/* Animated companion pet */}
      <div
        data-testid="ayah-character-shell"
        data-pet-clip={spriteClip}
        data-visual-state={visualState}
        className={`lobster-container sprite-pet-root ${isSleepTransparent ? 'sleep-transparent' : ''} ${cameraSnapActive ? 'action-camera-snap' : ''} ${wakeWindowFlightActive ? 'wake-window-flight' : ''}`}
      >
        <SpritePet appearanceId={appearanceId} clip={spriteClip} />
        <div className="camera-prop" aria-hidden="true">
          <span className="camera-shutter" />
          <span className="camera-lens" />
        </div>
      </div>
      <div className="camera-flash-overlay" aria-hidden="true" />

      {/* Tutorial Overlay */}
      <TutorialOverlay />
    </div>
  );
};
