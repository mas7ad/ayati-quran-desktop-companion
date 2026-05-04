/** Mushaf keys present in QUL `verse_scripts` (qul_rendering.sqlite). */
export type QulVerseScriptMushafKey =
  | 'madani1421'
  | 'madaniTajweed'
  | 'madaniV4Tajweed'
  | 'indoPakNastaleeq'
  | 'qpcNastaleeq';

/** Keys accepted from UI / manifest for font lookup (superset includes fonts-only rows). */
export type QulManifestMushafKey =
  | QulVerseScriptMushafKey
  | 'qpcHafs'
  | 'meQuran'
  | 'indoPakNaskh';

export type QuranRendererKind = 'pageGlyph' | 'unicodeFont';

export interface QulRenderedVersePayload {
  surahId: number;
  ayahNumber: number;
  displayText: string;
  markupText: string | null;
  rendererKind: QuranRendererKind;
  pageNumber: number | null;
  fontPostScriptName: string;
  /** Absolute path to the font file on disk (main process only). */
  fontAbsolutePath: string;
}

export interface QulFontManifest {
  renderers: Record<
    string,
    {
      kind: QuranRendererKind;
      pages?: Record<string, { file: string; postScriptName: string }>;
      font?: { file: string; postScriptName: string };
    }
  >;
}
