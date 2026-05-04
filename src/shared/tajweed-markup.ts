/**
 * Tajweed markup parsing — mirrors QuranScroll `TajweedTextRenderer.stripMarkup` / segment parsing.
 */

const TAG_PATTERN = /<(tajweed|span)\s+class=([a-zA-Z0-9_]+)>(.*?)<\/\1>/gs;

export interface TajweedSegment {
  text: string;
  cssClass: string | null;
}

export function stripTajweedMarkup(markup: string): string {
  return parseTajweedSegments(markup)
    .map((s) => s.text)
    .join('');
}

export function parseTajweedSegments(markup: string): TajweedSegment[] {
  const normalizedMarkup = markup.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  const segments: TajweedSegment[] = [];
  let cursor = 0;
  const regex = new RegExp(TAG_PATTERN.source, TAG_PATTERN.flags);
  for (const match of normalizedMarkup.matchAll(regex)) {
    const full = match[0];
    const idx = match.index ?? 0;
    if (idx > cursor) {
      segments.push({ text: normalizedMarkup.slice(cursor, idx), cssClass: null });
    }
    segments.push({ text: match[3] ?? '', cssClass: match[2] ?? null });
    cursor = idx + full.length;
  }
  if (cursor < normalizedMarkup.length) {
    segments.push({ text: normalizedMarkup.slice(cursor), cssClass: null });
  }
  return segments.filter((s) => s.text.length > 0);
}
