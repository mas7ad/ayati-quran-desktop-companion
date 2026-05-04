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

  it('uses generated expanded mood strips directly when available', () => {
    const directMoods = [
      'curious',
      'thinking',
      'excited',
      'doze',
      'sleeping',
      'startle',
      'proud',
      'mad',
      'spin',
      'surprised',
    ] as const;

    for (const mood of directMoods) {
      expect(normalizeIncomingPetState(mood)).toBe(mood);
      expect(resolveSpriteClip({
        visualState: mood,
        isWalking: false,
        walkDirection: null,
        wakeWindowFlightActive: false,
        cameraSnapActive: false,
        userDragRun: null,
      })).toBe(mood);
    }
  });

  it('keeps mood clip ids stable for fallback and generated mood states', () => {
    const fallbackClips: Record<LegacyMood, string> = {
      happy: 'happy',
      curious: 'curious',
      thinking: 'thinking',
      excited: 'excited',
      doze: 'doze',
      sleeping: 'sleeping',
      startle: 'startle',
      proud: 'proud',
      mad: 'mad',
      spin: 'spin',
      surprised: 'surprised',
    };

    for (const [mood, clip] of Object.entries(fallbackClips) as Array<[LegacyMood, string]>) {
      expect(normalizeIncomingPetState(mood)).toBe(mood);
      expect(legacyMoodToClip(mood)).toBe(clip);
    }

    expect(normalizeIncomingPetState('mouth_o')).toBe('idle');
  });
});
