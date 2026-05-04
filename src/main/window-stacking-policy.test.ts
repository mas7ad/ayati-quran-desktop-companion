import { describe, expect, it } from 'vitest';

import { getAssistantWindowStackingPolicy } from './window-stacking-policy';

describe('getAssistantWindowStackingPolicy', () => {
  it('keeps the assistant always-on-top when the workspace browser is absent', () => {
    expect(getAssistantWindowStackingPolicy({ hasWorkspaceBrowser: false })).toEqual({
      isAlwaysOnTop: true,
      level: 'pop-up-menu',
      relativeLevel: 0,
      shouldRepositionAfterReveal: false,
      shouldRevealInactive: false,
    });
  });

  it('demotes the assistant when the workspace browser exists', () => {
    expect(getAssistantWindowStackingPolicy({ hasWorkspaceBrowser: true })).toEqual({
      isAlwaysOnTop: false,
      shouldRepositionAfterReveal: true,
      shouldRevealInactive: true,
    });
  });
});
