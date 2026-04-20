export type UtilityWindowRole = 'assistant' | 'chatbar' | 'petContextMenu' | 'screenshotQuestion';

export function shouldHideWindowOnBlur(role: UtilityWindowRole): boolean {
  return role !== 'screenshotQuestion';
}

export function shouldRevealWindowInactive(role: UtilityWindowRole): boolean {
  return role === 'assistant' || role === 'screenshotQuestion';
}
