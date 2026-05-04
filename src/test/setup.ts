import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    imageSmoothingEnabled: false,
  })) as unknown as HTMLCanvasElement['getContext'];
}
