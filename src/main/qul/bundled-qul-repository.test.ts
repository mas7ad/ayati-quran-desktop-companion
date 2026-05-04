/**
 * @vitest-environment node
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import path from 'path';

import {
  getQulRenderedVerse,
  resetQulTestSingletons,
  resolveFontMushafKey,
  resolveRendererKind,
  resolveSourceMushafKey,
} from './bundled-qul-repository';

describe('bundled QUL repository', () => {
  beforeAll(() => {
    process.env.AYATI_QUL_ROOT = path.join(process.cwd(), 'assets', 'qul');
  });

  afterEach(() => {
    resetQulTestSingletons();
  });

  it('loads Madani Tajweed verse text from the bundled sqlite', async () => {
    const result = await getQulRenderedVerse(
      {
        surahId: 2,
        ayahNumber: 286,
        mushafKey: 'madaniTajweed',
        includeTajweed: false,
      },
      undefined,
    );
    expect(result).not.toBeNull();
    expect(result!.displayText.length).toBeGreaterThan(10);
    expect(result!.fontAbsolutePath).toMatch(/UthmanicHafs_V22\.ttf$/);
  });

  it('does not expose Madani 1405 because this bundle does not include its page fonts', async () => {
    const { QUL_VERSE_SCRIPT_KEYS, coerceQulVerseScriptMushafKey } = await import('./bundled-qul-repository');

    expect(QUL_VERSE_SCRIPT_KEYS).not.toContain('madani1405');
    expect(coerceQulVerseScriptMushafKey('madani1405')).toBeNull();
  });
});
