import { APP_DISPLAY_NAME } from '../shared/app-branding';
import type { RankedAyahCandidate, ScreenInsight } from './ayah-types';

/** When the ranked list has a clear winner, skip the second LLM round-trip (~seconds). */
const CLEAR_WINNER_SCORE_GAP = 32;

export function shouldUseRankedTopCandidateWithoutAi(candidates: RankedAyahCandidate[]): boolean {
  if (candidates.length <= 1) return true;
  const [top, second] = candidates;
  if (top.isFallback || second.isFallback) return true;
  return top.score - second.score >= CLEAR_WINNER_SCORE_GAP;
}

interface AiVerseSelectionClient {
  isConnected: () => boolean;
  chat: (message: string) => Promise<{ text?: string }>;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return JSON.parse(trimmed);
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in ayah selection response.');
  }

  return JSON.parse(match[0]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeReason(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const reason = value.replace(/\s+/g, ' ').trim();
  if (!reason) {
    return fallback;
  }

  return reason.slice(0, 240);
}

function summarizeProviderText(text: string): string {
  const summary = text.replace(/\s+/g, ' ').trim();
  return summary ? summary.slice(0, 240) : 'No response text.';
}

function buildSelectionPrompt(insight: ScreenInsight, candidates: RankedAyahCandidate[]): string {
  const allowedCandidates = candidates.map((candidate) => ({
    verseKey: candidate.verseKey,
    themeId: candidate.themeId,
    reflection: candidate.reflection,
    whyThisVerse: candidate.whyThisVerse,
  }));

  return `Choose the best Quran verse candidate for ${APP_DISPLAY_NAME} from a privacy-preserving screen description.

Screen description:
${insight.summary}

Category: ${insight.category}
Themes: ${JSON.stringify(insight.themes)}

Allowed candidates:
${JSON.stringify(allowedCandidates, null, 2)}

Rules:
- Do not choose any verse outside this list.
- Do not quote, translate, or paraphrase Quran text.
- Judge only from the screen description, category, themes, and candidate metadata.
- Return only compact JSON with this shape: {"verseKey":"2:286","reason":"one concise reason based on the description"}`;
}

export async function selectAyahCandidateWithAi(
  client: AiVerseSelectionClient | null,
  insight: ScreenInsight,
  candidates: RankedAyahCandidate[],
): Promise<RankedAyahCandidate> {
  const deterministicCandidate = candidates[0];
  if (!deterministicCandidate) {
    throw new Error(`${APP_DISPLAY_NAME} cannot select from an empty candidate list.`);
  }

  if (insight.isSensitive || deterministicCandidate.isFallback) {
    return deterministicCandidate;
  }

  if (!client?.isConnected()) {
    throw new Error('AI provider is not connected.');
  }

  const allowedCandidates = candidates.slice(0, 6);
  const response = await client.chat(buildSelectionPrompt(insight, allowedCandidates));
  const responseText = response.text ?? '';
  let parsed: unknown;

  try {
    parsed = extractJson(responseText);
  } catch (error) {
    if (responseText.trim().startsWith('AI provider error') || responseText.trim().startsWith('Failed to reach AI provider')) {
      throw new Error(responseText.trim());
    }
    throw new Error(`AI provider returned an invalid ayah selection response: ${summarizeProviderText(responseText)}`, {
      cause: error,
    });
  }

  if (!isRecord(parsed) || typeof parsed.verseKey !== 'string') {
    throw new Error('AI provider returned an invalid ayah selection response.');
  }

  const selectedCandidate = allowedCandidates.find((candidate) => candidate.verseKey === parsed.verseKey);
  if (!selectedCandidate) {
    throw new Error('AI provider selected a verse outside the allowed candidates.');
  }

  return {
    ...selectedCandidate,
    whyThisVerse: sanitizeReason(parsed.reason, selectedCandidate.whyThisVerse),
  };
}
