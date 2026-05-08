---
last_mapped: 2026-04-19T00:00:00Z
---

# Codebase Map

## System Overview

Ayati - Quran Desktop Companion is an Electron 28 desktop app with React 18, Vite 5, Tailwind, TypeScript strict mode, and `electron-store` for local persistence. Quran reflections are non-AI: the user chooses a reflection theme, the main process ranks curated ayah candidates, then the app fetches Quran Foundation content and stores text-only reflection history.

The workspace root contains runtime code, package metadata, and hackathon planning/API notes in `docs/`.

## Directory Guide

- `src/main/main.ts` - Electron app bootstrap, window creation, global hotkeys, screen capture, IPC handlers, tray, app lifecycle, and Ayati - Quran Desktop Companion orchestration.
- `src/main/preload.ts` - `window.ayati` bridge exposed to renderer windows.
- `src/main/store.ts` - `electron-store` schema and local persistence defaults.
- `src/main/quran-foundation-client.ts` - Quran Foundation OAuth, content, and bookmark API client.
- `src/main/ayah-*.ts` - ayah ranking, manual reflection themes, fallback content, reflection history, and reminder helpers.
- `src/renderer/assistant/` - main assistant panel with prayers, to-dos, focus, reflections, and Quran Foundation settings.
- `src/renderer/components/` - shared renderer components such as provider setup, markdown, links, and hotkey input.
- `src/shared/types.ts` - shared TypeScript types that can be imported by main-process modules.
- `docs/prd.md` - product requirements for Ayati - Quran Desktop Companion.
- `ayahlens-hackathon-implementation-plan.md` - active implementation plan and acceptance criteria.

## Key Workflows

- Build: from the repo root run `bun run build`, which executes renderer Vite build then main-process TypeScript compile.
- Tests: Vitest harness with unit and renderer tests (`bun run test`).
- Manual reflection flow: renderer calls `window.ayati.captureAyahReflection(theme)`; main process creates a manual theme insight, ranks candidate ayahs, fetches Quran Foundation content, persists text-only reflection history, and optionally syncs a Quran Foundation bookmark.
- Settings flow: renderer uses allowlisted IPC writes; main process updates `electron-store` and applies runtime effects such as hotkey changes.

## Known Risks

- `main.ts` is large and owns many responsibilities, so new Ayati - Quran Desktop Companion orchestration should be placed in focused modules and wired through narrow IPC handlers.
- Desktop OAuth cannot truly protect a client secret. The MVP supports local configuration for hackathon demo, but production should move token exchange to a backend proxy.
- Legacy chat/screenshot files may still exist for migration history, but user-facing AI entry points are disabled and the active reflection flow does not capture screenshots.
- Quran Foundation API endpoint shapes may change, so the client should normalize errors and keep endpoint configuration centralized.
- The existing app has no test harness before this implementation; regression coverage starts with Ayati - Quran Desktop Companion domain, client, and renderer behavior.
