export interface AssistantWindowStackingPolicy {
  isAlwaysOnTop: boolean;
  level?: 'pop-up-menu';
  relativeLevel?: number;
  shouldRepositionAfterReveal: boolean;
  shouldRevealInactive: boolean;
}

export function getAssistantWindowStackingPolicy({
  hasWorkspaceBrowser,
}: {
  hasWorkspaceBrowser: boolean;
}): AssistantWindowStackingPolicy {
  if (hasWorkspaceBrowser) {
    return {
      isAlwaysOnTop: false,
      shouldRepositionAfterReveal: true,
      shouldRevealInactive: true,
    };
  }

  return {
    isAlwaysOnTop: true,
    level: 'pop-up-menu',
    relativeLevel: 0,
    shouldRepositionAfterReveal: false,
    shouldRevealInactive: false,
  };
}
