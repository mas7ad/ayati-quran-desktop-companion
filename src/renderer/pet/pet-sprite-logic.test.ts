import { describe, expect, it } from 'vitest';

import {
  legacyMoodToClip,
  normalizeIncomingPetState,
  resolveSpriteClip,
  type LegacyMood,
} from './pet-sprite-logic';

describe('pet sprite logic', () => {
  it('accepts every current atlas row state as a direct sprite clip', () => {
    const clips = [
      'idle',
      'running-right',
      'running-left',
      'waving',
      'jumping',
      'failed',
      'waiting',
      'running',
      'review',
    ] as const;

    for (const clip of clips) {
      expect(normalizeIncomingPetState(clip)).toBe(clip);
      expect(resolveSpriteClip({
        visualState: clip,
        isWalking: false,
        walkDirection: null,
        wakeWindowFlightActive: false,
        cameraSnapActive: false,
        userDragRun: null,
      })).toBe(clip);
    }
  });

  it('recognizes future mood states and maps them to current fallback clips', () => {
    const fallbackClips: Record<LegacyMood, string> = {
      happy: 'waving',
      curious: 'waiting',
      thinking: 'review',
      excited: 'jumping',
      doze: 'idle',
      sleeping: 'idle',
      startle: 'jumping',
      proud: 'waving',
      mad: 'failed',
      spin: 'jumping',
      surprised: 'review',
    };

    for (const [mood, clip] of Object.entries(fallbackClips) as Array<[LegacyMood, string]>) {
      expect(normalizeIncomingPetState(mood)).toBe(mood);
      expect(legacyMoodToClip(mood)).toBe(clip);
    }

    expect(normalizeIncomingPetState('mouth_o')).toBe('idle');
  });
});
