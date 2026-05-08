# PRD: Ayati - Quran Desktop Companion

## Product Summary

Ayati is a desktop Quran companion that helps users create small moments of remembrance during normal computer use. The product no longer depends on AI, chat, or screenshots. Users choose a reflection theme, receive a curated ayah with translation, tafsir, recitation, and reflection copy, then save notes and bookmarks through Quran Foundation.

## Core Features

### 1. On-Screen Companion

- Persistent floating companion.
- Always-on-top mode.
- Draggable saved position.
- Companion modes, sleep/doze behavior, and quiet visual presence.

### 2. Manual Reflection

- User selects a theme: general remembrance, stress, focus, gratitude, beauty, patience, uncertainty, moderation, conflict, study, planning, work, or distraction.
- App ranks curated ayah candidates for that theme.
- App avoids immediate repeats.
- User can request another ayah for the same theme.

### 3. Verse Card

- Arabic ayah text.
- Translation.
- Surah and ayah reference.
- Short reflection text.
- "Why this verse" explanation.
- Save, note, tafsir, recitation, collection, feedback, share, and delete actions.

### 4. Quran Foundation Integration

- OAuth/OIDC sign-in with PKCE.
- Content API verse, translation, tafsir, and recitation lookup.
- User API bookmark, note, collection, and activity/streak sync.
- Local fallback content and pending sync states.

### 5. Reflection History

- Recent reflection history.
- Search by surah, theme, note, or keyword.
- Filter by saved state, pending state, theme, and feedback.
- Reopen saved verse cards.
- Day recap and streak summary.

### 6. Reminders

- Prayer-time reminders.
- Timer Quran reminders.
- Rule-based app-switch nudges.
- To-do reminders.
- Pomodoro focus-session support.
- Sensitive app/title suppression for non-AI app-switch nudges.

## Explicit Non-Goals

- AI provider setup.
- Chat assistant.
- Quick chat bar.
- Screenshot capture for reflection.
- Vision analysis.
- AI verse reranking.
- Screen-context chat.

## Privacy Requirements

- Manual reflections must not capture screenshots.
- The core reflection flow must not require AI credentials.
- Reflection history stores Quran content, notes, themes, timestamps, feedback, and sync state.
- Quran Foundation tokens are encrypted when Electron safe storage is available.
- Sensitive app/title nudges must suppress reminders rather than infer private context.
