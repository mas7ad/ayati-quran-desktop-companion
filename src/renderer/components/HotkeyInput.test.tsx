import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HotkeyInput } from './HotkeyInput';

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
