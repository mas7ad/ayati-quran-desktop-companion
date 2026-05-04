import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpritePet } from './SpritePet';
import { AYAH_ATLAS } from './pet-sprite-atlas';

const clearRect = vi.fn();
const drawImage = vi.fn();
const setTransform = vi.fn();

class MockImage {
  static lastInstance: MockImage | null = null;

  decoding = '';
  naturalWidth = 1536;
  naturalHeight = 1872;
  complete = true;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private currentSrc = '';

  constructor() {
    MockImage.lastInstance = this;
  }

  set src(value: string) {
    this.currentSrc = value;
  }

  get src() {
    return this.currentSrc;
  }
}

describe('SpritePet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearRect.mockClear();
    drawImage.mockClear();
    setTransform.mockClear();
    MockImage.lastInstance = null;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect,
      drawImage,
      setTransform,
      imageSmoothingEnabled: false,
    })) as unknown as HTMLCanvasElement['getContext'];

    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('clears the previous painted sheet immediately when appearance changes', () => {
    const { rerender } = render(<SpritePet appearanceId="ayah" clip="idle" />);

    rerender(<SpritePet appearanceId="cosmo" clip="idle" />);

    expect(clearRect).toHaveBeenCalled();
  });

  it('draws strip clips from frame zero when the atlas provides a strip path', () => {
    const atlas = {
      ...AYAH_ATLAS,
      clips: {
        ...AYAH_ATLAS.clips,
        waving: { length: 4, stripPath: 'waving.webp' },
      },
    };

    render(<SpritePet appearanceId="ayah" clip="waving" atlasOverride={atlas} />);

    const image = MockImage.lastInstance;
    expect(image).toBeTruthy();
    if (image) {
      image.naturalWidth = AYAH_ATLAS.frameWidth * 4;
      image.naturalHeight = AYAH_ATLAS.frameHeight;
    }
    act(() => {
      image?.onload?.();
    });

    expect(drawImage).toHaveBeenCalledWith(
      image,
      0,
      0,
      AYAH_ATLAS.frameWidth,
      AYAH_ATLAS.frameHeight,
      0,
      0,
      expect.any(Number),
      expect.any(Number),
    );
  });
});
