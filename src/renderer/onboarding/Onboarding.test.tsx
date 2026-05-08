import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Onboarding } from './Onboarding';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function createMockAyati() {
  return {
    onboardingSkip: vi.fn().mockResolvedValue(true),
    onboardingComplete: vi.fn().mockResolvedValue(true),
    checkAccessibilityPermission: vi.fn().mockResolvedValue(true),
    beginHotkeyCapture: vi.fn().mockResolvedValue(undefined),
    endHotkeyCapture: vi.fn().mockResolvedValue(undefined),
  } satisfies Partial<Window['ayati']>;
}

function getMatchingClassNames(container: HTMLElement, pattern: RegExp) {
  return Array.from(container.querySelectorAll<HTMLElement>('[class]'))
    .flatMap((element) => Array.from(element.classList))
    .filter((className, index, classNames) => pattern.test(className) && classNames.indexOf(className) === index)
    .sort();
}

describe('Onboarding', () => {
  let mockAyati: ReturnType<typeof createMockAyati>;

  beforeEach(() => {
    mockAyati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      writable: true,
      value: mockAyati as Window['ayati'],
    });
  });

  it('uses the inverted Ayati brand palette with neutral macOS title bar chrome', () => {
    const { container } = render(<Onboarding />);
    const title = screen.getByText('Ayati');
    const subtitle = screen.getByText('Setup Companion');

    expect(container.firstElementChild).toHaveClass('bg-[#FAF9F6]');
    expect(title.closest('.drag-region')).toHaveClass('bg-white');
    expect(title).toHaveClass('text-[#1a2a24]');
    expect(subtitle).toHaveClass('text-[#67E0A3]');
    expect(screen.getByRole('button', { name: /close setup/i })).toHaveClass('bg-[#ff5f57]');
  });

  it('keeps the onboarding scroll path free of paint-heavy effects', () => {
    const { container } = render(<Onboarding />);

    expect(getMatchingClassNames(
      container,
      /^(soft-glow|step-enter|animate-happy-bounce|transition-all|backdrop-blur.*|blur-.*|group-hover:.*|hover:shadow.*|hover:-translate.*|duration-700)$/,
    )).toEqual([]);
  });

  it('goes from welcome to keyboard shortcuts without an AI setup step', async () => {
    const user = userEvent.setup();

    render(<Onboarding />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /get started/i }));
    });

    expect(await screen.findByRole('heading', { name: /keyboard shortcuts/i, level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(/vision provider/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
  });

  it('returns to the previous step when Back is used', async () => {
    const user = userEvent.setup();

    render(<Onboarding />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /get started/i }));
    });

    expect(await screen.findByRole('heading', { name: /keyboard shortcuts/i, level: 2 })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^back$/i }));
    });

    expect(await screen.findByRole('heading', { name: /welcome to ayati/i, level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /keyboard shortcuts/i, level: 2 })).not.toBeInTheDocument();
  });

  it('updates context toggles immediately while the accessibility prompt is pending', async () => {
    const user = userEvent.setup();
    const accessibilityPrompt = createDeferred<boolean>();
    mockAyati.checkAccessibilityPermission.mockReturnValue(accessibilityPrompt.promise);

    render(<Onboarding />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /get started/i }));
    });

    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /continue/i }));
    });

    const activeAppToggle = await screen.findByRole('checkbox', { name: /active application/i });

    await act(async () => {
      await user.click(activeAppToggle);
    });

    expect(activeAppToggle).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /window titles/i })).not.toBeChecked();
    expect(screen.getByText(/we asked for access/i)).toBeInTheDocument();
    expect(mockAyati.checkAccessibilityPermission).toHaveBeenCalledWith(true);

    accessibilityPrompt.resolve(true);
  });

  it('completes setup without AI credentials or screen-reflection shortcuts', async () => {
    const user = userEvent.setup();

    render(<Onboarding />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /get started/i }));
    });
    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /continue/i }));
    });
    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /continue/i }));
    });
    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /^open ayati$/i }));
    });

    await waitFor(() => expect(mockAyati.onboardingComplete).toHaveBeenCalledTimes(1));
    expect(mockAyati.onboardingComplete).toHaveBeenCalledWith(
      expect.not.objectContaining({
        gatewayToken: expect.anything(),
        hotkeyOpenChat: expect.anything(),
        hotkeyCaptureScreen: expect.anything(),
      }),
    );
  });
});
