import { describe, expect, it } from 'vitest';

import { AYAH_ATLAS, getClipFps, getClipFrameSource } from './pet-sprite-atlas';

describe('AYAH_ATLAS', () => {
  it('describes the real Ayah spritesheet frame grid', () => {
    expect(AYAH_ATLAS.sheetWidth).toBe(1536);
    expect(AYAH_ATLAS.sheetHeight).toBe(1872);
    expect(AYAH_ATLAS.frameWidth).toBe(192);
    expect(AYAH_ATLAS.frameHeight).toBe(208);
    expect(AYAH_ATLAS.columns).toBe(8);
    expect(AYAH_ATLAS.sheetWidth / AYAH_ATLAS.frameWidth).toBe(AYAH_ATLAS.columns);
    expect(AYAH_ATLAS.sheetHeight / AYAH_ATLAS.frameHeight).toBe(9);
  });

  it('keeps each named clip on its own spritesheet row', () => {
    expect(AYAH_ATLAS.clips).toMatchObject({
      idle: { start: 0, length: 6, fps: 1 },
      'running-right': { start: 8, length: 8 },
      'running-left': { start: 16, length: 8 },
      waving: { start: 24, length: 4 },
      jumping: { start: 32, length: 5 },
      failed: { start: 40, length: 8 },
      waiting: { start: 48, length: 6 },
      running: { start: 56, length: 6 },
      review: { start: 64, length: 6 },
    });
  });

  it('slows idle blinking without changing action clip speed', () => {
    expect(getClipFps('idle')).toBe(1);
    expect(getClipFps('running-right')).toBe(AYAH_ATLAS.fps);
    expect(getClipFps('jumping')).toBe(AYAH_ATLAS.fps);
  });

  it('resolves packed spritesheet clips from their atlas frame range', () => {
    const source = getClipFrameSource('ayah', 'running-right');

    expect(source.mode).toBe('spritesheet');
    expect(source.start).toBe(8);
    expect(source.length).toBe(8);
    expect(source.columns).toBe(AYAH_ATLAS.columns);
    expect(source.expectedImageWidth).toBe(AYAH_ATLAS.sheetWidth);
    expect(source.expectedImageHeight).toBe(AYAH_ATLAS.sheetHeight);
  });

  it('allows an atlas clip to resolve as its own horizontal strip', () => {
    const source = getClipFrameSource('ayah', 'waving', {
      ...AYAH_ATLAS,
      clips: {
        ...AYAH_ATLAS.clips,
        waving: { length: 4, fps: 12, stripPath: 'waving.webp' },
      },
    });

    expect(source.mode).toBe('strip');
    expect(source.start).toBe(0);
    expect(source.length).toBe(4);
    expect(source.columns).toBe(4);
    expect(source.fps).toBe(12);
    expect(source.expectedImageWidth).toBe(AYAH_ATLAS.frameWidth * 4);
    expect(source.expectedImageHeight).toBe(AYAH_ATLAS.frameHeight);
  });
});
