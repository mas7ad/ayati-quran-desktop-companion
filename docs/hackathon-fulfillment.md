# Hackathon Fulfillment

Last reviewed: May 20, 2026.

This document maps Ayati - Quran Desktop Companion against the requirements summarized in
[`docs/hackathon-rules.md`](./hackathon-rules.md). It is intended to make the
submission story explicit for judges and for final pre-submission checks.

## Summary

Ayati - Quran Desktop Companion satisfies the core technical requirement by using at least one Quran
Foundation API from each required category:

- **Content API**: Quran Foundation Content API verse lookup, tafsir lookup, and ayah recitation lookup.
- **User API**: Quran Foundation User API bookmark creation, notes, collections, activity days, and streak lookup.

Ayati is a non-AI desktop companion. The user chooses a reflection theme (stress, focus, gratitude, patience, work, and more), and Ayati ranks curated ayah candidates, fetches Quran Foundation content, and displays Arabic text, translation, tafsir, and recitation. Signed-in users can save bookmarks, notes, and collections to their Quran Foundation account.

The app also includes a clear demo path, local privacy safeguards, fallback
behavior when external services fail, and documentation for setup and API usage.

## Technical Requirements

| Requirement | Status | Implementation |
| --- | --- | --- |
| Use at least one Quran Foundation Content API or Quran MCP | Implemented | Ayati calls `GET /content/api/v4/verses/by_key/{verseKey}` for ayah text/translation, `GET /content/api/v4/tafsirs/{resourceId}/by_ayah/{verseKey}` for tafsir, and `GET /content/api/v4/recitations/{recitationId}/by_ayah/{verseKey}` for recitation audio in [`src/main/quran-foundation-client.ts`](../src/main/quran-foundation-client.ts). |
| Use at least one Quran Foundation User API | Implemented | Ayati uses Bookmarks, Notes, Collections, Activity Days, and Streaks User APIs. Saving and organizing reflections calls `POST /auth/v1/bookmarks`, `POST /auth/v1/notes`, `POST /auth/v1/collections`, `POST /auth/v1/collections/{collectionId}/bookmarks`, `POST /auth/v1/activity-days`, and `GET /auth/v1/streaks/current-streak-days`. |
| Authenticate Quran Foundation user API calls | Implemented | Ayati starts a Quran Foundation OAuth/OIDC PKCE flow from the main process in [`src/main/main.ts`](../src/main/main.ts), requests OpenID, refresh, bookmark, collection, note, activity day, and streak scopes, stores encrypted tokens locally, refreshes tokens when possible, validates the OpenID nonce, and uses the user access token for User API calls. |
| Preserve app behavior if Quran Foundation is unavailable | Implemented | Verse content has fallback content, bookmark/note/collection/activity failures mark local pending state, and tafsir/audio failures do not break the base reflection. See [`src/main/main.ts`](../src/main/main.ts) and [`src/main/ayah-reflection-store.ts`](../src/main/ayah-reflection-store.ts). |

## Content API Details

Ayati - Quran Desktop Companion generates a Quran-focused reflection from a user-selected theme:

1. The user opens the Assistant and chooses a reflection theme (e.g., Stress, Focus, Gratitude, Patience, Work, Distraction, General Remembrance).
2. The app creates a manual reflection insight for the selected theme.
3. The app ranks curated ayah candidates deterministically using the theme engine in [`src/main/ayah-theme-engine.ts`](../src/main/ayah-theme-engine.ts), applying recency penalties and relevance feedback adjustments.
4. The app fetches Quran Foundation verse content for the top-ranked ayah.
5. The user can lazily fetch tafsir and recitation audio from Quran Foundation.
6. The app displays the Arabic text, translation, verse reference, reflection,
   explanation for why the ayah was selected, tafsir, and audio controls.

Relevant implementation:

- [`src/main/main.ts`](../src/main/main.ts): `captureAyahReflection`,
  `fetchVerseContentForReflection`, and `buildAyahReflection`.
- [`src/main/ayah-manual-reflection.ts`](../src/main/ayah-manual-reflection.ts):
  `createManualReflectionInsight` and `normalizeManualReflectionTheme`.
- [`src/main/ayah-theme-engine.ts`](../src/main/ayah-theme-engine.ts):
  `rankAyahCandidates` with curated candidates, recency penalties, and feedback signals.
- [`src/main/quran-foundation-client.ts`](../src/main/quran-foundation-client.ts):
  `fetchVerseContent`, `fetchTafsir`, and `fetchAyahAudio`.
- [`src/renderer/screenshot-question/AyahVerseCard.tsx`](../src/renderer/screenshot-question/AyahVerseCard.tsx):
  ayah display UI.

## User API Details

Ayati - Quran Desktop Companion uses multiple User APIs from the hackathon list:
Bookmarks, Notes, Collections, Activity Days, and Streaks.

When a signed-in user saves a reflection:

1. The renderer invokes `window.ayati.saveAyahReflection(reflectionId)`.
2. The main process marks the reflection as saved locally.
3. If a Quran Foundation user token is available, the main process calls
   `QuranFoundationClient.createBookmark`.
4. The client sends `POST /auth/v1/bookmarks`.
5. A successful response stores the returned bookmark ID and marks the
   reflection as synced.
6. A successful save also records a Quran activity day and refreshes streak state.
7. The user can add a Quran Foundation note and place the ayah into a Quran Foundation collection.
8. Failed User API responses keep the reflection locally and mark the related action as pending sync.

Relevant implementation:

- [`src/main/main.ts`](../src/main/main.ts): `saveAyahReflectionById` and
  `ayah-save-reflection` IPC handler.
- [`src/main/quran-foundation-client.ts`](../src/main/quran-foundation-client.ts):
  `createBookmark`, `createNote`, `createCollection`, `addCollectionBookmark`,
  `recordActivityDay`, and `getCurrentStreakDays`.
- [`src/main/ayah-reflection-store.ts`](../src/main/ayah-reflection-store.ts):
  text-only history, synced/pending note metadata, collection membership,
  feedback metadata, `markReflectionSynced`, and `markReflectionPendingSync`.
- [`src/renderer/screenshot-question/AyahVerseCard.tsx`](../src/renderer/screenshot-question/AyahVerseCard.tsx):
  save button and sync status labels.

Relevance feedback remains local because the documented Quran Foundation APIs do
not expose a direct match-quality endpoint.

## Submission Checklist

| Checklist item | Status | Notes |
| --- | --- | --- |
| Project title | Ready | `Ayati - Quran Desktop Companion`. |
| Team member names | Submission process | Add final team names in the hackathon submission form. |
| Short description | Ready | Electron desktop companion for manual Quran-themed reflections with Quran Foundation bookmark, note, collection, and streak sync. |
| Detailed explanation of the idea | Ready | Product explanation exists in [`README.md`](../README.md), [`docs/prd.md`](./prd.md), and [`docs/features.md`](./features.md). |
| Live demo or working app link | Ready | Packaged release builds (`v0.1.2`) are in `/release/` for macOS (Apple Silicon and Intel) and Windows x64. The landing page is at `https://ayati-website.vercel.app/`. |
| GitHub repository, if available | Ready | `https://github.com/mwijanarko1/ayati-quran-desktop-companion.git` |
| 2 to 3 minute demo video | Pending submission asset | Record the demo flow described in [`docs/features.md`](./features.md). |
| API usage description | Ready | [`README.md`](../README.md) documents Content API, User API, and OAuth/OIDC usage. This file provides the expanded fulfillment mapping. |

## Judging Criteria Alignment

| Criterion | Alignment |
| --- | --- |
| Impact on Quran engagement | Ayati inserts Quran reflection into everyday computer use by letting users choose a theme that matches their current state of mind. It is designed for repeated use after Ramadan through lightweight theme selection, reflection history, saved bookmarks, prayer reminders, and focus sessions. |
| Product quality and UX | The app provides onboarding, a draggable desktop companion, manual theme selection, ayah card display, tafsir, recitation, notes, collections, save state, reflection filters, day recap, streak state, prayer reminders, to-dos, a Pomodoro timer, and fallback messaging. |
| Technical execution | The app uses Electron, React, TypeScript strict mode, Vitest tests, Quran Foundation OAuth/OIDC, Content API calls, User API bookmark/note/collection/activity/streak sync, token refresh, local encrypted token storage, and sanitized text-only reflection history. |
| Innovation and creativity | Ayati turns a user's emotional or situational context into a Quran-centered reflection by offering curated themes instead of requiring the user to start from a Quran search query. |
| Effective use of APIs | Quran Foundation APIs are used in the core journey: Content API provides the selected ayah text and translation, and User API bookmarks, notes, and collections persist the user's saved ayahs in their Quran Foundation account. |

## Practical Submission Notes

| Rule note | Fulfillment |
| --- | --- |
| Clearly show both Content and User API usage | The demo should show an ayah fetched from Quran Foundation, tafsir, recitation, bookmark sync, note sync, collection sync, and streak/activity state. |
| Make the user journey obvious quickly | Recommended demo path: sign in, open Reflections, choose a theme (e.g., Focus or Gratitude), show the ayah card, expand tafsir, play recitation, save bookmark, add note, add collection, show streak/day recap. |
| Solve a real retention or engagement problem | The app creates small Quran reflection moments during normal desktop work and lets users save meaningful ayahs for later. Prayer reminders and focus sessions extend engagement beyond reflections. |
| Make the concept understandable without a long explanation | Use the short framing: "Ayati is a desktop companion that gives you a Quran reflection for how you're feeling right now and lets you save the ayah to Quran Foundation." |

## Privacy And Conduct

| Requirement area | Fulfillment |
| --- | --- |
| Avoid confidential or proprietary material in the submission | The submission should include only code and assets intended for public review. Do not include `.env.local`, API keys, credentials, private screenshots, or local user data. |
| Respect third-party IP and licenses | Runtime dependencies are declared in [`package.json`](../package.json). Before submission, confirm any demo music, video, screenshots, fonts, and generated assets are owned by the team or licensed for the submission. |
| Protect user privacy | Ayati does not capture or store screenshots for the core reflection flow. No AI credentials are required. Local history stores ayah text, translation, tafsir/audio metadata, notes, collection IDs, reflection copy, theme summaries, timestamps, feedback, and sync state. |
| Accurate submission information | Team, repository, demo, API usage, and live app links should be reviewed against this file and [`docs/hackathon-rules.md`](./hackathon-rules.md) before final submission. |

## Verification Evidence

Current automated evidence:

- `src/main/quran-foundation-client.test.ts` covers safe token error mapping,
  successful User API bookmark response parsing, tafsir parsing, audio URL
  normalization, notes, collections, activity days, streaks, and User API
  error sanitization.
- `src/main/ayah-reflection-store.test.ts` covers text-only reflection history
  notes, collection metadata, relevance feedback, and pending bookmark sync
  behavior.
- `src/main/ayah-manual-reflection.test.ts` covers manual theme normalization
  and insight creation.
- `src/main/ayah-theme-engine.test.ts` covers candidate ranking, recency
  penalties, feedback adjustments, and fallback behavior.
- Renderer tests cover the ayah card display, tafsir, audio, note, collection,
  feedback, alternate ayah, and share interactions.

Recommended pre-submission checks:

```bash
bun run test
bun run build
```

Recommended manual demo verification:

1. Sign in with Quran Foundation.
2. Open the Assistant and go to **Reflections**.
3. Choose a theme (e.g., Focus, Gratitude, or Stress).
4. Receive the ayah reflection.
5. Save the reflection.
6. Expand tafsir and play recitation.
7. Add a note and collection.
8. Confirm the UI reports "Saved to Quran Foundation" or a pending sync state
   if the API is unavailable.
