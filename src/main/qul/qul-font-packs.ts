import { existsSync } from 'fs';
import path from 'path';

import type { QulVerseScriptMushafKey } from './qul-types';

/** Probes for on-disk QUL font trees used by the current app bundle. */
export function getQulFontPackPresence(qulRoot: string | null): Record<QulVerseScriptMushafKey, boolean> {
  const none = (): Record<QulVerseScriptMushafKey, boolean> => ({
    madani1421: false,
    indoPakNastaleeq: false,
  });
  if (!qulRoot) return none();

  const probe = (...segments: string[]) => existsSync(path.join(qulRoot, 'Fonts', ...segments));

  return {
    madani1421: probe('Madani1421', 'v2-p1.ttf'),
    indoPakNastaleeq: probe('IndoPakNastaleeq', 'indopak-nastaleeq-waqf-lazim.ttf'),
  };
}
