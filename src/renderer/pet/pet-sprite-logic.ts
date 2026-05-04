import { isPetClipId, type PetClipId } from './pet-sprite-atlas';

/** Legacy moods driven by ClawBot, chat, and poke reactions (SVG era); mapped into atlas clips. */
export type LegacyMood =
  | 'happy'
  | 'curious'
  | 'sleeping'
  | 'thinking'
  | 'excited'
  | 'doze'
  | 'startle'
  | 'proud'
  | 'mad'
  | 'spin'
  | 'surprised';

export type PetVisualState = PetClipId | LegacyMood;

const LEGACY_MOODS = new Set<string>([
  'happy',
  'curious',
  'sleeping',
  'thinking',
  'excited',
  'doze',
  'startle',
  'proud',
  'mad',
  'spin',
  'surprised',
]);

export function isLegacyMood(value: string): value is LegacyMood {
  return LEGACY_MOODS.has(value);
}

export function isSleepVisualState(state: PetVisualState): boolean {
  return state === 'sleeping' || state === 'doze';
}

export function normalizeIncomingPetState(state: string): PetVisualState {
  if (isPetClipId(state)) return state;
  if (isLegacyMood(state)) return state;
  return 'idle';
}

export function legacyMoodToClip(mood: LegacyMood): PetClipId {
  switch (mood) {
    case 'happy':
      return 'happy';
    case 'curious':
      return 'curious';
    case 'sleeping':
      return 'sleeping';
    case 'thinking':
      return 'thinking';
    case 'excited':
      return 'excited';
    case 'doze':
      return 'doze';
    case 'startle':
      return 'startle';
    case 'proud':
      return 'proud';
    case 'mad':
      return 'mad';
    case 'spin':
      return 'spin';
    case 'surprised':
      return 'surprised';
    default:
      return 'idle';
  }
}

export function resolveSpriteClip(input: {
  visualState: PetVisualState;
  isWalking: boolean;
  walkDirection: 'left' | 'right' | null;
  wakeWindowFlightActive: boolean;
  cameraSnapActive: boolean;
  userDragRun: { dir: 'left' | 'right' } | null;
}): PetClipId {
  const {
    visualState,
    isWalking,
    walkDirection,
    wakeWindowFlightActive,
    cameraSnapActive,
    userDragRun,
  } = input;

  if (wakeWindowFlightActive) return 'jumping';
  if (cameraSnapActive) return 'review';
  if (userDragRun) {
    return userDragRun.dir === 'left' ? 'running-left' : 'running-right';
  }
  if (isWalking) {
    if (walkDirection === 'left') return 'running-left';
    if (walkDirection === 'right') return 'running-right';
    return 'running';
  }
  if (isPetClipId(visualState)) return visualState;
  if (isSleepVisualState(visualState)) return 'idle';
  return legacyMoodToClip(visualState);
}
