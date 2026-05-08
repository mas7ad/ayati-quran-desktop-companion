import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HotkeyInput, formatAcceleratorAsReadableNames } from './HotkeyInput';

describe('formatAcceleratorAsReadableNames', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses Command and Option on Mac-like user agents', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    );
    expect(formatAcceleratorAsReadableNames('CommandOrControl+Alt+,')).toBe('Command + Option + Comma');
    expect(formatAcceleratorAsReadableNames('CommandOrControl+Alt+.')).toBe('Command + Option + Period');
  });

  it('uses Control and Alt on Windows-like user agents', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(formatAcceleratorAsReadableNames('CommandOrControl+Alt+,')).toBe('Control + Alt + Comma');
  });
});

describe('HotkeyInput', () => {
  const beginHotkeyCapture = vi.fn().mockResolvedValue(undefined);
  const endHotkeyCapture = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      writable: true,
      value: {
        beginHotkeyCapture,
        endHotkeyCapture,
      } as Window['ayati'],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('shows a readable shortcut label under the shortcut button', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    );

    render(
      <HotkeyInput
        label="Hide App"
        description="Toggle visibility"
        value="CommandOrControl+Alt+,"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Command + Option + Comma')).toBeInTheDocument();
  });

  it('uses Electron-safe ASCII keys when modifier layers emit symbols', async () => {
    const onChange = vi.fn();

    render(
      <HotkeyInput
        label="Reflect on Screen"
        description="Capture your screen and receive a fitting ayah"
        value="CommandOrControl+Alt+/"
        onChange={onChange}
      />,
    );

    const button = screen.getByRole('button', { name: /⌘/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(beginHotkeyCapture).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.keyDown(button, {
        key: '≥',
        code: 'Period',
        altKey: true,
        metaKey: true,
      });
    });

    expect(onChange).toHaveBeenCalledWith('CommandOrControl+Alt+.');
    expect(endHotkeyCapture).toHaveBeenCalledTimes(1);
  });
});
