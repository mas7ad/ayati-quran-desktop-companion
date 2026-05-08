import type { AyahTheme, ScreenInsight } from './ayah-types';

const MANUAL_REFLECTION_THEMES = new Set<AyahTheme>([
  'stress',
  'focus',
  'gratitude',
  'beauty',
  'patience',
  'risk',
  'excess',
  'conflict',
  'study',
  'planning',
  'work',
  'distraction',
  'unclear',
]);

export function normalizeManualReflectionTheme(theme: unknown): AyahTheme {
  return typeof theme === 'string' && MANUAL_REFLECTION_THEMES.has(theme as AyahTheme)
    ? theme as AyahTheme
    : 'unclear';
}

export function createManualReflectionInsight(theme: unknown): ScreenInsight {
  const normalizedTheme = normalizeManualReflectionTheme(theme);

  if (normalizedTheme === 'unclear') {
    return {
      summary: 'The user asked for a general Quran reflection.',
      category: 'unclear',
      themes: [{ id: 'unclear', confidence: 1 }],
      overallConfidence: 1,
      isSensitive: false,
    };
  }

  return {
    summary: `The user asked for a Quran reflection for ${normalizedTheme}.`,
    category: normalizedTheme,
    themes: [{ id: normalizedTheme, confidence: 0.95 }],
    overallConfidence: 0.95,
    isSensitive: false,
  };
}
