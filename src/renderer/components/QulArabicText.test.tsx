import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rendererStylesheets = [
  'src/renderer/assistant/styles.css',
  'src/renderer/pet-chat/styles.css',
  'src/renderer/screenshot-question/styles.css',
];

describe('QulArabicText font ownership', () => {
  it('does not load the legacy bundled Quran font stylesheet from Quran display surfaces', () => {
    for (const stylesheet of rendererStylesheets) {
      const css = readFileSync(path.join(process.cwd(), stylesheet), 'utf8');

      expect(css).not.toContain('quran-fonts.css');
      expect(css).not.toContain('--ayah-quran-font-family');
      expect(css).not.toContain('KFGQPCUthmanicScriptHAFS');
      expect(css).not.toContain('AlQuranIndoPakbyQuranWBW');
    }
  });

  it('does not use madaniTajweed as implicit default mushaf in components', () => {
    const component = readFileSync(path.join(process.cwd(), 'src/renderer/components/QulArabicText.tsx'), 'utf8');
    const assistant = readFileSync(path.join(process.cwd(), 'src/renderer/assistant/Assistant.tsx'), 'utf8');

    expect(component).not.toContain("?? 'madaniTajweed'");
    expect(assistant).not.toContain("?? 'madaniTajweed'");
  });

  it('does not expose Madani 1405 or ambiguous tajweed palette selection in renderer code', () => {
    const component = readFileSync(path.join(process.cwd(), 'src/renderer/components/QulArabicText.tsx'), 'utf8');
    const assistant = readFileSync(path.join(process.cwd(), 'src/renderer/assistant/Assistant.tsx'), 'utf8');

    expect(assistant).not.toContain("value: 'madani1405'");
    expect(assistant).not.toContain('Madani 1405');
    expect(component).not.toContain("fontPalette: 'dark'");
    expect(component).toContain('qul-arabic-text--colr-dark');
  });
});
