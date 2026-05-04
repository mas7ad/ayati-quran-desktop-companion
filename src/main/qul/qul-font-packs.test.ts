/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import path from 'path';

import { getQulFontPackPresence } from './qul-font-packs';

describe('getQulFontPackPresence', () => {
  it('reports the bundled QUL font packs that are exposed in settings', () => {
    const root = path.join(process.cwd(), 'assets', 'qul');
    const presence = getQulFontPackPresence(root);
    expect(presence.madani1421).toBe(true);
    expect(presence.madaniV4Tajweed).toBe(true);
    expect(presence).not.toHaveProperty('madani1405');
  });
});
