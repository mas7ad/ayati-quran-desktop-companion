import { readFileSync, existsSync } from 'fs';
import path from 'path';

import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import type { App } from 'electron';

import type {
  QulFontManifest,
  QulManifestMushafKey,
  QulRenderedVersePayload,
  QulVerseScriptMushafKey,
  QuranRendererKind,
} from './qul-types';
import { resolveManifestFontPath, resolveQulRoot } from './qul-paths';
import { stripTajweedMarkup } from '../../shared/tajweed-markup';

export const QUL_BUNDLE_VERSION = '2026.03.15.1';

/** Keys that appear in `verse_scripts.mushaf_key` for this bundle. */
export const QUL_VERSE_SCRIPT_KEYS: readonly QulVerseScriptMushafKey[] = [
  'madani1421',
  'madaniTajweed',
  'madaniV4Tajweed',
  'indoPakNastaleeq',
  'qpcNastaleeq',
] as const;

let sqlJsSingleton: Promise<SqlJsStatic> | undefined;
let dbSingleton: Database | null = null;
let manifestSingleton: QulFontManifest | null = null;

function sqlWasmLocateDir(app?: App): string {
  if (app?.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist');
    if (existsSync(path.join(unpacked, 'sql-wasm.wasm'))) return unpacked;
  }
  return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist');
}

function getSqlJs(app?: App): Promise<SqlJsStatic> {
  if (!sqlJsSingleton) {
    sqlJsSingleton = initSqlJs({
      locateFile: (file: string) => path.join(sqlWasmLocateDir(app), file),
    });
  }
  return sqlJsSingleton;
}

async function getDatabase(app?: App): Promise<Database | null> {
  if (dbSingleton) return dbSingleton;
  const root = resolveQulRoot(app);
  if (!root) return null;
  const dbPath = path.join(root, 'qul_rendering.sqlite');
  if (!existsSync(dbPath)) return null;
  const SQL = await getSqlJs(app);
  const fileBuffer = readFileSync(dbPath);
  dbSingleton = new SQL.Database(fileBuffer);
  return dbSingleton;
}

export function resetQulTestSingletons(): void {
  dbSingleton?.close();
  dbSingleton = null;
  sqlJsSingleton = undefined;
  manifestSingleton = null;
}

function loadManifest(qulRoot: string): QulFontManifest {
  if (manifestSingleton) return manifestSingleton;
  const raw = readFileSync(path.join(qulRoot, 'font_manifest.json'), 'utf8');
  manifestSingleton = JSON.parse(raw) as QulFontManifest;
  return manifestSingleton;
}

function mushafRendererKind(mushafKey: QulManifestMushafKey): QuranRendererKind {
  const manifest = manifestSingleton;
  if (!manifest) return 'unicodeFont';
  const entry = manifest.renderers[mushafKey];
  return entry?.kind ?? 'unicodeFont';
}

/**
 * Mirrors QuranScroll `BundledQULScriptRepository` script/font mushaf resolution.
 */
export function resolveSourceMushafKey(
  mushafKey: QulVerseScriptMushafKey,
  includeTajweed: boolean,
): QulVerseScriptMushafKey {
  if (!includeTajweed) return mushafKey;
  if (mushafKey === 'madani1421') return 'madaniV4Tajweed';
  return 'madaniTajweed';
}

export function resolveFontMushafKey(
  mushafKey: QulVerseScriptMushafKey,
  includeTajweed: boolean,
): QulManifestMushafKey {
  if (!includeTajweed) return mushafKey;
  if (mushafKey === 'madani1421') return 'madaniV4Tajweed';
  if (mushafKey === 'indoPakNastaleeq' || mushafKey === 'qpcNastaleeq') {
    return 'indoPakNastaleeq';
  }
  return mushafRendererKind(mushafKey) === 'pageGlyph' ? 'madaniTajweed' : mushafKey;
}

export function resolveRendererKind(
  mushafKey: QulVerseScriptMushafKey,
  includeTajweed: boolean,
): QuranRendererKind {
  if (includeTajweed && mushafKey === 'madani1421') {
    return 'pageGlyph';
  }
  if (includeTajweed) return 'unicodeFont';
  return mushafRendererKind(mushafKey);
}

function convertVerseNumbersToIndoPakPUA(markup: string): string {
  const pattern = /<span class=end>([٠١٢٣٤٥٦٧٨٩0-9]+)<\/span>/g;
  let result = markup;
  let match: RegExpExecArray | null;
  const digitMap: Record<string, number> = {
    '٠': 0,
    '١': 1,
    '٢': 2,
    '٣': 3,
    '٤': 4,
    '٥': 5,
    '٦': 6,
    '٧': 7,
    '٨': 8,
    '٩': 9,
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
  };

  const matches: RegExpExecArray[] = [];
  while ((match = pattern.exec(markup)) !== null) {
    matches.push(match);
  }

  for (const m of matches.reverse()) {
    const full = m[0];
    const numStr = m[1] ?? '';
    let val = 0;
    for (const ch of numStr) {
      const d = digitMap[ch];
      if (d !== undefined) val = val * 10 + d;
    }
    if (val > 0) {
      const code = 0xf500 + val - 1;
      const ch = String.fromCodePoint(code);
      result = result.slice(0, m.index) + ch + result.slice(m.index! + full.length);
    }
  }
  return result;
}

function stripAyahZeroMarkers(text: string): string {
  let cleanText = text;
  const verseEndPatterns = [
    /\s*<span class=end>[\u0660-\u0669\u06f0-\u06f9]+<\/span>\s*$/u,
    /[0-9\u0660-\u0669\u06f0-\u06f9]+\uFD3E?\s*$/u,
  ];
  for (const pattern of verseEndPatterns) {
    cleanText = cleanText.replace(pattern, '');
  }
  return cleanText.trim();
}

function resolveFontEntry(
  manifest: QulFontManifest,
  mushafKey: QulManifestMushafKey,
  pageNumber: number | null,
): { file: string; postScriptName: string } {
  const renderer = manifest.renderers[mushafKey];
  if (!renderer) {
    throw new Error(`QUL manifest missing mushaf ${mushafKey}`);
  }
  if (renderer.kind === 'pageGlyph') {
    if (pageNumber == null) {
      throw new Error(`QUL page font requested without page number (${mushafKey})`);
    }
    const pageFont = renderer.pages?.[String(pageNumber)];
    if (!pageFont) {
      throw new Error(`QUL missing page font ${mushafKey} page ${pageNumber}`);
    }
    return pageFont;
  }
  if (!renderer.font) {
    throw new Error(`QUL manifest missing unicode font for ${mushafKey}`);
  }
  return renderer.font;
}

export interface GetRenderedVerseParams {
  surahId: number;
  ayahNumber: number;
  /** Must be a row present in `verse_scripts` for this bundle. */
  mushafKey: QulVerseScriptMushafKey;
  includeTajweed: boolean;
}

export async function getQulRenderedVerse(
  params: GetRenderedVerseParams,
  app?: App,
): Promise<QulRenderedVersePayload | null> {
  const root = resolveQulRoot(app);
  if (!root) return null;

  const db = await getDatabase(app);
  if (!db) return null;

  loadManifest(root);

  const sourceMushaf = resolveSourceMushafKey(params.mushafKey, params.includeTajweed);
  const fontMushaf = resolveFontMushafKey(params.mushafKey, params.includeTajweed);
  const rendererKind = resolveRendererKind(params.mushafKey, params.includeTajweed);

  const lookupSurahId = params.ayahNumber === 0 ? 1 : params.surahId;
  const lookupAyahNumber = params.ayahNumber === 0 ? 1 : params.ayahNumber;

  const stmt = db.prepare(
    'SELECT verse_key, text, page_number FROM verse_scripts WHERE mushaf_key = ? AND surah = ? AND ayah = ? LIMIT 1;',
  );
  stmt.bind([sourceMushaf, lookupSurahId, lookupAyahNumber]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.get() as unknown[];
  stmt.free();

  const processedText = String(row[1] ?? '');
  const pageRaw = row[2];
  const pageNumber = pageRaw === null || pageRaw === undefined ? null : Number(pageRaw);

  let taggedText: string | null =
    params.includeTajweed && rendererKind === 'unicodeFont' ? processedText : null;

  const indoPakFamily =
    params.mushafKey === 'indoPakNastaleeq' || params.mushafKey === 'qpcNastaleeq';
  if (indoPakFamily && taggedText) {
    taggedText = convertVerseNumbersToIndoPakPUA(taggedText);
  }

  let cleanText = stripTajweedMarkup(taggedText ?? processedText);

  if (params.ayahNumber === 0) {
    cleanText = stripAyahZeroMarkers(stripTajweedMarkup(taggedText ?? processedText));
    if (taggedText) {
      taggedText = stripAyahZeroMarkers(taggedText).trim();
    }
    const pageGlyphFamily =
      params.mushafKey === 'madani1421' ||
      params.mushafKey === 'madaniV4Tajweed';
    if (pageGlyphFamily) {
      if (cleanText.length > 0) {
        cleanText = cleanText.slice(0, -1).trim();
      }
      if (taggedText && taggedText.length > 0) {
        taggedText = taggedText.slice(0, -1).trim();
      }
    }
  } else {
    cleanText = cleanText.trim();
  }

  const manifest = loadManifest(root);
  const fontEntry = resolveFontEntry(manifest, fontMushaf, pageNumber);
  const fontAbsolutePath = resolveManifestFontPath(root, fontEntry.file);
  if (!existsSync(fontAbsolutePath)) {
    throw new Error(`Missing QUL font file: ${fontAbsolutePath}`);
  }

  return {
    surahId: params.surahId,
    ayahNumber: params.ayahNumber,
    displayText: cleanText,
    markupText: taggedText,
    rendererKind,
    pageNumber,
    fontPostScriptName: fontEntry.postScriptName,
    fontAbsolutePath,
  };
}

export function isQulBundleAvailable(app?: App): boolean {
  const root = resolveQulRoot(app);
  return Boolean(root && existsSync(path.join(root ?? '', 'qul_rendering.sqlite')));
}

export function parseVerseKeyToSurahAyah(verseKey: string): { surah: number; ayah: number } | null {
  const [s, a] = verseKey.split(':');
  const surah = Number.parseInt(s, 10);
  const ayah = Number.parseInt(a, 10);
  if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return null;
  return { surah, ayah };
}

/** Narrow untrusted input to a known script key, else null. */
export function coerceQulVerseScriptMushafKey(value: string): QulVerseScriptMushafKey | null {
  return (QUL_VERSE_SCRIPT_KEYS as readonly string[]).includes(value)
    ? (value as QulVerseScriptMushafKey)
    : null;
}
