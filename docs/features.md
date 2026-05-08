# Ayati - Quran Desktop Companion Features

Ayati is now a non-AI Quran desktop companion. The core loop is: choose what kind of reminder you need, receive a curated ayah with Quran Foundation content, then save notes, tafsir, audio, and bookmarks.

## Best Demo Flow

1. Open Ayati and show the always-on-top desktop companion.
2. Open the Assistant and go to **Reflections**.
3. Choose a reflection theme such as Stress, Focus, Gratitude, Study, Planning, or General Remembrance.
4. Click **New Reflection** and show the ayah card in history.
5. Point out Arabic text, translation, reference, reflection, and "Why this verse".
6. Expand tafsir and play recitation.
7. Save the bookmark locally or sync it with Quran Foundation after sign-in.
8. Add a personal note, save to a collection, and mark whether the ayah felt relevant.
9. Use **Show Another Ayah** to rotate through curated candidates for the same theme.
10. Show day recap, streak state, prayer reminders, to-dos, and focus timer.

## Core User Features

### Always-On-Top Companion

- Small floating companion that stays visible while the user works.
- Draggable saved position, companion modes, sleep/doze states, and optional transparency while asleep.
- Context menu for settings, workspace, and quit actions.
- Quran reminder bubble for prayer, timer, app-switch, to-do, and focus-session reminders.

### Manual Quran Reflections

- Theme picker for general remembrance, stress, focus, gratitude, beauty, patience, uncertainty, moderation, conflict, study, planning, work, and distraction.
- Deterministic ayah ranking from curated candidates.
- Recent-verse penalties reduce repeats.
- Relevance feedback influences future local ranking.
- No screenshots, chat prompts, API keys, or AI providers are required.

### Ayah Card And History

- Arabic ayah text with RTL rendering.
- Translation text from Quran Foundation or bundled fallback content.
- Surah name, ayah reference, reflection copy, and "Why this verse" explanation.
- Expandable tafsir snippet and verse-specific recitation playback.
- Save, note, collection, feedback, alternate ayah, share-card, and delete actions.
- Search and filter reflection history by saved state, theme, and relevance feedback.
- Day recap groups reflection count, saved count, notes, and themes.

### Quran Foundation Integration

- Quran Foundation OAuth/OIDC sign-in with PKCE.
- Encrypted local storage for access and refresh tokens when Electron safe storage is available.
- Content API verse, tafsir, translation, and recitation lookups.
- User API bookmark, note, collection, and activity/streak sync.
- Local fallback content and pending sync states when network or auth fails.

### Reminders And Productivity

- Prayer-time reminders with quiet window support.
- Timer Quran reminders at a user-defined interval.
- Rule-based app-switch Quran nudges with sensitive-app and sensitive-title suppression.
- To-do reminders and Pomodoro focus sessions.
- Active-app and optional window-title watching for non-AI nudges.

## Removed Scope

- AI provider setup.
- Chat assistant and quick chat bar.
- Screenshot-to-ayah reflection.
- Vision analysis and AI reranking.
- Screen-context chat.

## Privacy And Reliability Talking Points

- Ayati does not need AI credentials for the core reflection flow.
- Manual reflections do not capture or upload screenshots.
- Reflection history stores Quran content, text summaries, notes, themes, timestamps, feedback, and sync state.
- Quran Foundation tokens are encrypted before local storage when Electron safe storage is available.
- API errors are sanitized before display.
