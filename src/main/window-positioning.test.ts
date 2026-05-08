import { describe, expect, it } from 'vitest';

import { getWindowPositionNearAnchor } from './window-positioning';

describe('getWindowPositionNearAnchor', () => {
  it('centers a floating window above the character', () => {
    const position = getWindowPositionNearAnchor({
      anchor: { x: 900, y: 650, width: 130, height: 130 },
      windowSize: { width: 520, height: 280 },
      workArea: { x: 0, y: 0, width: 1440, height: 900 },
      verticalGap: -3,
    });

    expect(position).toEqual({ x: 705, y: 367 });
  });

  it('keeps the positioned window inside the display work area', () => {
    const position = getWindowPositionNearAnchor({
      anchor: { x: 1710, y: 120, width: 130, height: 130 },
      windowSize: { width: 520, height: 280 },
      workArea: { x: 1440, y: 0, width: 1440, height: 900 },
      verticalGap: -3,
    });

    expect(position).toEqual({ x: 1515, y: 0 });
  });

  it('moves beside avoid bounds when the preferred top-clamped position would overlap', () => {
    const position = getWindowPositionNearAnchor({
      anchor: { x: 900, y: 120, width: 130, height: 130 },
      windowSize: { width: 400, height: 500 },
      workArea: { x: 0, y: 0, width: 1440, height: 900 },
      verticalGap: -3,
      avoidBounds: { x: 772, y: 0, width: 420, height: 520 },
      avoidGap: 12,
    });

    expect(position).toEqual({ x: 360, y: 0 });
  });

  it('moves above avoid bounds when there is vertical room', () => {
    const position = getWindowPositionNearAnchor({
      anchor: { x: 900, y: 700, width: 130, height: 130 },
      windowSize: { width: 400, height: 240 },
      workArea: { x: 0, y: 0, width: 1440, height: 900 },
      verticalGap: -3,
      avoidBounds: { x: 772, y: 500, width: 420, height: 220 },
      avoidGap: 12,
    });

    expect(position).toEqual({ x: 765, y: 248 });
  });
});
