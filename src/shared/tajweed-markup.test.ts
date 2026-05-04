import { describe, expect, it } from 'vitest';

import { stripTajweedMarkup } from './tajweed-markup';

describe('tajweed-markup', () => {
  it('strips tajweed tags to plain Arabic', () => {
    const raw =
      'لَا يُكَلِّفُ <tajweed class=ham_wasl>ٱ</tajweed>للَّهُ <span class=end>١</span>';
    expect(stripTajweedMarkup(raw)).not.toContain('<tajweed');
    expect(stripTajweedMarkup(raw)).toContain('لَا يُكَلِّفُ');
  });
});
