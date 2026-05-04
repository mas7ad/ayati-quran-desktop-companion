import { describe, expect, it } from 'vitest';

import {
  filterAvailableRecitationResources,
  selectDefaultRecitationResource,
} from './quran-reciter-preferences';

describe('quran reciter preferences', () => {
  it('removes Mishary Rashid Alafasy from reciter choices', () => {
    expect(filterAvailableRecitationResources([
      { id: 7, name: 'Mishari Rashid al-`Afasy' },
      { id: 4, name: 'Abu Bakr Shatri' },
      { id: 1, name: 'Abdul Baset' },
    ])).toEqual([
      { id: 4, name: 'Abu Bakr Shatri' },
      { id: 1, name: 'Abdul Baset' },
    ]);
  });

  it('defaults reminder audio to Abu Bakr Shatri when available', () => {
    expect(selectDefaultRecitationResource([
      { id: 1, name: 'Abdul Baset' },
      { id: 4, name: 'Abu Bakr Ash-Shatri' },
    ])).toEqual({ id: 4, name: 'Abu Bakr Ash-Shatri' });
  });
});
