import { useCallback, useEffect, useRef, useState } from 'react';

export interface HotkeyInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  theme?: 'dark' | 'setupInverted';
}

const NON_TRIGGER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

const CODE_TO_ACCELERATOR_KEY: Record<string, string> = {
  Backquote: '`',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Equal: '=',
  Minus: '-',
  Period: '.',
  Quote: "'",
  Semicolon: ';',
  Slash: '/',
  Space: 'Space',
};

const KEY_TO_ACCELERATOR_KEY: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Esc: 'Escape',
};

const KEY_TO_READABLE_NAME: Record<string, string> = {
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '`': 'Backtick',
  '-': 'Minus',
  '=': 'Equals',
  '[': 'Left Bracket',
  ']': 'Right Bracket',
  '\\': 'Backslash',
  Space: 'Space',
  Escape: 'Escape',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Up: 'Up Arrow',
  Down: 'Down Arrow',
  Left: 'Left Arrow',
  Right: 'Right Arrow',
};

function isMacLikeUserAgent(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Human-readable shortcut for UI copy, e.g. "Command + Option + Comma". */
export function formatAcceleratorAsReadableNames(hotkey: string): string {
  const trimmed = hotkey.trim();
  if (!trimmed) {
    return '';
  }

  const isMac = isMacLikeUserAgent();
  const tokens = trimmed.split('+').map((t) => t.trim()).filter(Boolean);
  const labels: string[] = [];

  for (const token of tokens) {
    if (token === 'CommandOrControl') {
      labels.push(isMac ? 'Command' : 'Control');
      continue;
    }
    if (token === 'Alt') {
      labels.push(isMac ? 'Option' : 'Alt');
      continue;
    }
    if (token === 'Shift') {
      labels.push('Shift');
      continue;
    }
    if (token === 'Control' || token === 'Ctrl') {
      labels.push('Control');
      continue;
    }
    if (token === 'Command' || token === 'Cmd' || token === 'Meta' || token === 'Super') {
      labels.push(isMac ? 'Command' : 'Windows');
      continue;
    }

    const readable = KEY_TO_READABLE_NAME[token];
    if (readable) {
      labels.push(readable);
      continue;
    }

    if (/^F([1-9]|1[0-9]|2[0-4])$/i.test(token)) {
      labels.push(token.toUpperCase());
      continue;
    }

    if (/^[A-Z]$/i.test(token)) {
      labels.push(token.toUpperCase());
      continue;
    }

    if (/^[0-9]$/.test(token)) {
      labels.push(token);
      continue;
    }

    labels.push(token);
  }

  return labels.join(' + ');
}

export const HotkeyInput: React.FC<HotkeyInputProps> = ({
  label,
  description,
  value,
  onChange,
  theme = 'dark',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const captureActiveRef = useRef(false);

  const stopCapture = useCallback(() => {
    if (!captureActiveRef.current) {
      setIsRecording(false);
      return;
    }
    captureActiveRef.current = false;
    void window.ayati?.endHotkeyCapture?.();
    setIsRecording(false);
  }, []);

  const startCapture = useCallback(() => {
    if (isRecording) return;
    captureActiveRef.current = true;
    void window.ayati?.beginHotkeyCapture?.();
    setIsRecording(true);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (captureActiveRef.current) {
        captureActiveRef.current = false;
        void window.ayati?.endHotkeyCapture?.();
      }
    };
  }, []);

  const isSetupInverted = theme === 'setupInverted';
  const labelClassName = isSetupInverted
    ? "font-['Outfit',system-ui,sans-serif] text-[15px] font-semibold tracking-tight text-[#1a2a24]"
    : 'text-sm font-medium text-neutral-200';
  const descriptionClassName = isSetupInverted
    ? "font-['Source_Sans_3','Segoe_UI',system-ui,sans-serif] mt-1.5 text-[13px] font-medium leading-relaxed text-[#1a2a24]/55"
    : 'text-xs mt-1 leading-snug text-neutral-500';
  const buttonClassName = isRecording
    ? getRecordingClassName(isSetupInverted)
    : getIdleClassName(isSetupInverted);
  const formattedHotkey = formatAcceleratorForDisplay(value);
  const readableShortcut = formatAcceleratorAsReadableNames(value);
  const rowClassName = isSetupInverted
    ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'
    : 'flex items-center justify-between gap-5 py-3.5';
  const leftColClassName = isSetupInverted ? 'min-w-0 flex-1 sm:pr-4' : 'min-w-0 pr-2';
  const buttonLayoutClassName = isSetupInverted
    ? 'w-full shrink-0 px-4 py-3 text-[13px] leading-tight sm:w-auto sm:min-w-[168px] rounded-xl'
    : 'shrink-0 px-3.5 py-2.5 rounded-lg text-sm min-w-[148px]';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];

    // Build modifier string
    if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const acceleratorKey = getAcceleratorKey(e);
    if (!acceleratorKey) return;

    parts.push(acceleratorKey);

    onChange(parts.join('+'));
    stopCapture();
  };

  return (
    <div className={rowClassName}>
      <div className={leftColClassName}>
        <div className={labelClassName}>{label}</div>
        <div className={descriptionClassName}>{description}</div>
      </div>
      <div
        className={
          isSetupInverted
            ? 'flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end'
            : 'flex shrink-0 flex-col items-end gap-1.5'
        }
      >
        <button
          aria-label={`Change ${label} shortcut, currently ${formattedHotkey}`}
          onKeyDown={handleKeyDown}
          onClick={startCapture}
          onBlur={stopCapture}
          type="button"
          className={`font-mono text-center transition-colors ${buttonLayoutClassName} ${buttonClassName}`}
        >
          {isRecording ? 'Press keys…' : formattedHotkey}
        </button>
        {readableShortcut ? (
          <p
            className={
              isSetupInverted
                ? "w-full text-center font-['Source_Sans_3','Segoe_UI',system-ui,sans-serif] text-[11px] font-medium leading-snug text-[#1a2a24]/45 sm:w-auto sm:text-right"
                : 'max-w-[200px] text-right text-[11px] leading-snug text-neutral-500'
            }
            aria-hidden="true"
          >
            {readableShortcut}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export function formatAcceleratorForDisplay(hotkey: string) {
  return hotkey
    .replace('CommandOrControl', '⌘')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Space', 'Space')
    .replace(/\+/g, ' + ');
}

function getAcceleratorKey(e: React.KeyboardEvent): string | null {
  if (NON_TRIGGER_KEYS.has(e.key)) {
    return null;
  }

  if (/^Key[A-Z]$/.test(e.code)) {
    return e.code.slice(3);
  }

  if (/^Digit[0-9]$/.test(e.code)) {
    return e.code.slice(5);
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(e.code)) {
    return e.code;
  }

  const keyFromCode = CODE_TO_ACCELERATOR_KEY[e.code];
  if (keyFromCode) {
    return keyFromCode;
  }

  const namedKey = KEY_TO_ACCELERATOR_KEY[e.key];
  if (namedKey) {
    return namedKey;
  }

  if (/^[a-z]$/i.test(e.key)) {
    return e.key.toUpperCase();
  }

  if (/^[0-9]$/.test(e.key) || /^[\x21-\x2A\x2C-\x7E]$/.test(e.key)) {
    return e.key;
  }

  return null;
}

function getRecordingClassName(isSetupInverted: boolean) {
  if (isSetupInverted) {
    return 'bg-[#1a2a24] border border-[#1a2a24] text-white animate-pulse';
  }

  return 'bg-[#67E0A3]/15 border border-[#67E0A3] text-[#AFF9C9] animate-pulse';
}

function getIdleClassName(isSetupInverted: boolean) {
  if (isSetupInverted) {
    return 'bg-[#1a2a24]/05 border border-[#1a2a24]/10 text-[#1a2a24] hover:bg-[#1a2a24]/10';
  }

  return 'bg-neutral-900 border border-white/10 text-neutral-300 hover:border-white/20';
}
