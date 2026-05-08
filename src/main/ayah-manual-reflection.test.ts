import { describe, expect, it } from 'vitest';

import { createManualReflectionInsight, normalizeManualReflectionTheme } from './ayah-manual-reflection';

describe('manual ayah reflections', () => {
  it('creates a high-confidence insight from an explicit user-selected theme', () => {
    const insight = createManualReflectionInsight('stress');

    expect(insight).toEqual({
      summary: 'The user asked for a Quran reflection for stress.',
      category: 'stress',
      themes: [{ id: 'stress', confidence: 0.95 }],
      overallConfidence: 0.95,
      isSensitive: false,
    });
  });

  it('falls back to general remembrance for missing or invalid themes', () => {
    expect(normalizeManualReflectionTheme('not-a-theme')).toBe('unclear');
    expect(createManualReflectionInsight(undefined).themes).toEqual([{ id: 'unclear', confidence: 1 }]);
  });
});
