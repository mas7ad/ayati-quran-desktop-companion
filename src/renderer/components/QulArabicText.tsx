import { useEffect, useMemo, useState } from 'react';

import { parseTajweedSegments } from '../../shared/tajweed-markup';
import { useAyahLensQulSignature } from '../hooks/useAyahLensQulSignature';

import './qul-tajweed.css';

const loadedFontKeys = new Set<string>();
const DEFAULT_QUL_MUSHAF_KEY = 'madani1421';

async function loadQulFontBytes(fontAbsolutePath: string): Promise<Uint8Array | null> {
  const schemeUrl = `ayati-qul-font://font/load?path=${encodeURIComponent(fontAbsolutePath)}`;
  try {
    const res = await fetch(schemeUrl);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.byteLength > 0) return bytes;
    }
  } catch {
    /* scheme not registered or fetch blocked */
  }
  const readFn = window.ayati.readQulFontFile;
  if (typeof readFn !== 'function') return null;
  const bytes = await readFn(fontAbsolutePath);
  if (!bytes || bytes.byteLength === 0) return null;
  return bytes;
}

async function ensureFontLoaded(postScriptName: string, absolutePath: string): Promise<void> {
  const key = `${postScriptName}\0${absolutePath}`;
  if (loadedFontKeys.has(key)) return;
  const bytes = await loadQulFontBytes(absolutePath);
  if (!bytes || bytes.byteLength === 0) {
    throw new Error('QUL font bytes unavailable');
  }
  const blob = new Blob([bytes], { type: 'font/ttf' });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const face = new FontFace(postScriptName, `url(${JSON.stringify(objectUrl)})`);
    await face.load();
    document.fonts.add(face);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  loadedFontKeys.add(key);
}

function resolveDisplayMushafKey(mushafKey: string | undefined): string {
  if (!mushafKey || mushafKey === 'madaniTajweed') return DEFAULT_QUL_MUSHAF_KEY;
  if (mushafKey === 'madani1405' || mushafKey === 'madaniV4Tajweed') return DEFAULT_QUL_MUSHAF_KEY;
  if (mushafKey === 'qpcNastaleeq') return 'indoPakNastaleeq';
  return mushafKey;
}

function fontPathSuggestsColrDarkPalette(fontAbsolutePath: string, postScriptName: string): boolean {
  const norm = fontAbsolutePath.replace(/\\/g, '/');
  return postScriptName.includes('COLOR');
}

export interface QulArabicTextProps {
  verseKey: string;
  fallbackText: string;
  className?: string;
  /** Visual variant for verse cards vs assistant vs pet chat */
  variant?: 'card' | 'assistant' | 'petChat';
  /**
   * When the parent holds Ayah Lens settings (e.g. Assistant), pass a serialized key so changing
   * mushaf/tajweed triggers a refetch. If omitted, signature refreshes on window focus.
   */
  qulSettingsKey?: string;
}

/**
 * When QUL assets are enabled and available, loads verse script + font from the bundled
 * Quranic Universal Library database (same pipeline as QuranScroll).
 */
export function QulArabicText({
  verseKey,
  fallbackText,
  className = '',
  variant = 'card',
  qulSettingsKey: qulSettingsKeyProp,
}: QulArabicTextProps): JSX.Element {
  const internalQulSig = useAyahLensQulSignature();
  const qulSettingsKey = qulSettingsKeyProp ?? internalQulSig;

  const [display, setDisplay] = useState<string>(fallbackText);
  const [markup, setMarkup] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [colrDarkPalette, setColrDarkPalette] = useState(false);
  const [usedQul, setUsedQul] = useState(false);

  const fontSizeClass =
    variant === 'assistant' ? 'text-2xl leading-loose' : variant === 'petChat' ? 'text-[22px] leading-[1.75]' : '';

  useEffect(() => {
    let cancelled = false;
    setDisplay(fallbackText);
    setMarkup(null);
    setFontFamily(null);
    setColrDarkPalette(false);
    setUsedQul(false);

    (async () => {
      try {
        const api = window.ayati;
        const available = await api.qulIsAvailable();
        if (cancelled || !available) return;

        const settings = await api.getAyahLensSettings();
        if (cancelled || settings.qulArabicEnabled === false) return;

        const mushafKey = resolveDisplayMushafKey(settings.qulMushafKey);

        const payload = await api.getQulRenderedVerse({
          verseKey,
          mushafKey,
          includeTajweed: false,
        });
        if (cancelled || !payload) return;

        await ensureFontLoaded(payload.fontPostScriptName, payload.fontAbsolutePath);
        if (cancelled) return;

        setColrDarkPalette(fontPathSuggestsColrDarkPalette(payload.fontAbsolutePath, payload.fontPostScriptName));
        setFontFamily(payload.fontPostScriptName);
        setDisplay(payload.displayText);
        setMarkup(payload.markupText);
        setUsedQul(true);
      } catch {
        /* fall back silently */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [verseKey, fallbackText, qulSettingsKey]);

  const segments = useMemo(() => (markup ? parseTajweedSegments(markup) : null), [markup]);

  const style = fontFamily ? ({ fontFamily: `"${fontFamily}", serif` } as const) : undefined;
  const rootClassName = `${className} ${fontSizeClass} ${colrDarkPalette ? 'qul-arabic-text--colr-dark' : ''}`.trim();

  if (usedQul && segments && segments.length > 0) {
    return (
      <p dir="rtl" lang="ar" translate="no" className={rootClassName} style={style}>
        {segments.map((s, i) =>
          s.cssClass ? (
            <span key={i} className={`qul-tjw--${s.cssClass}`}>
              {s.text}
            </span>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    );
  }

  return (
    <p dir="rtl" lang="ar" translate="no" className={rootClassName} style={style}>
      {display}
    </p>
  );
}
