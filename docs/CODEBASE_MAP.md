---
last_mapped: 2026-05-19T00:00:00Z
---

# Codebase Map — Ayati Quran Desktop Companion

## System Overview

**Ayati** is a cross-platform Electron desktop companion for Quran study, reflection, and daily productivity. It runs a persistent animated pixel-art pet that sits on your desktop and provides quick access to Quran verses, prayer times, Pomodoro focus sessions, to-do management, and workspace file browsing.

**Stack:** Electron 28 + React 18 + Vite 5 + Tailwind CSS 3 + TypeScript strict + `electron-store` + `sql.js` (SQLite WASM for Quranic Arabic rendering) + `sharp` (image transcoding)

**Key architectural decisions:**
- All state lives in the **main process**; each renderer is a standalone React app communicating via IPC (`window.ayati.*`)
- **10 separate BrowserWindows** (pet, chat, assistant, screenshot, workspace, pomodoro timer, context menu, onboarding, chatbar — plus system tray)
- **macOS window levels**: `screen-saver` for always-on-top panels, `pop-up-menu` for user-interactive overlays
- **Offline-first**: Quran content works fully offline with bundled fallbacks and local storage
- **Quran Foundation OAuth2** with PKCE for syncing bookmarks, notes, collections, and streaks

---

## Source Tree

```
src/
├── main/                       # Electron main process (Node.js)
│   ├── main.ts                 # ~4000+ lines — ALL window creation, IPC, pets, timers, orchestration
│   ├── preload.ts              # contextBridge API (window.ayati) — ~90+ IPC channels
│   ├── store.ts                # electron-store schema + migrations
│   │
│   ├── ayah-types.ts           # ALL TypeScript types (reflections, prayer, todos, pomodoro)
│   ├── ayah-reflection-store.ts# Pure state mutation functions for AyahLensState
│   ├── ayah-reflection-content.ts # Verse content fetcher with fallback chain
│   ├── ayah-fallbacks.ts       # CURATED_AYAH_CANDIDATES — hand-curated verse/reflection pairs
│   ├── ayah-theme-engine.ts    # Scene→verse ranking algorithm with feedback learning
│   ├── ayah-scene-analyzer.ts  # AI prompt for screen analysis (legacy, not active)
│   ├── ayah-contextual-nudges.ts # App-switch nudges + timed verse reminders
│   ├── ayah-manual-reflection.ts # Manual reflection creation from user-chosen theme
│   │
│   ├── ai-providers.ts         # AI provider configs (OpenRouter, OpenAI, Gemini, etc.)
│   ├── ai-provider-defaults.ts # Default provider/model values
│   ├── clawbot-client.ts      # AI chat client (OpenAI + Anthropic protocols)
│   │
│   ├── quran-foundation-client.ts # OAuth2 + Content/User API client
│   ├── quran-runtime-config.ts    # Quran API config resolution
│   ├── quran-oauth-scopes.ts      # OAuth scope definitions
│   ├── quran-surah-verse-counts.ts# Verse count data
│   │
│   ├── qul/                    # Quran Unicode Layout — bundled Quran rendering
│   │   ├── bundled-qul-repository.ts # SQLite-backed QUL rendering via sql.js
│   │   ├── qul-types.ts             # QUL types (mushaf keys, renderer kinds)
│   │   ├── qul-paths.ts             # File path resolution for QUL font assets
│   │   └── qul-font-packs.ts        # Font presence detection
│   │
│   ├── watchers.ts             # App focus (active-win) + file watcher (chokidar)
│   ├── window-title.ts         # macOS System Events title fallback
│   ├── window-positioning.ts   # Smart panel positioning near pet anchor
│   ├── window-stacking-policy.ts # Assistant window stacking rules
│   ├── window-visibility-policy.ts# Hide-on-blur policies per window type
│   ├── window-selection.ts     # Preferred window for focus
│   │
│   ├── prayer-times-client.ts  # AlAdhan API client
│   ├── prayer-awareness.ts     # Prayer reminder logic
│   ├── pomodoro-store.ts       # Pomodoro session state machine
│   ├── todo-store.ts           # Todo CRUD operations
│   │
│   ├── hotkeys.ts              # Global hotkey registration + sanitization
│   ├── updates.ts              # Auto-update state machine
│   ├── single-instance.ts      # Single-instance enforcement
│   │
│   └── *.test.ts               # Test files co-located
│
├── renderer/                   # React apps (Vite multi-entry — 7 HTML entry points)
│   ├── pet/                    # Pet sprite window (frameless, transparent)
│   │   ├── Pet.tsx             # Main pet logic (idle behaviors, drag, moods, sleep)
│   │   ├── SpritePet.tsx       # Canvas-based WebP spritesheet renderer
│   │   ├── pet-sprite-logic.ts # Visual state → clip ID resolution
│   │   ├── pet-sprite-atlas.ts # Sprite atlas definitions, clip frames
│   │   ├── main.tsx            # React root mount
│   │   ├── pet.html            # Vite entry HTML
│   │   └── styles.css
│   │
│   ├── pet-chat/               # Chat bubble overlay (anchored to pet)
│   │   ├── PetChat.tsx         # Speech bubble, quick replies, tafsir, audio, notes
│   │   ├── main.tsx / pet-chat.html / styles.css
│   │
│   ├── pet-context-menu/       # Right-click context menu
│   │   ├── PetContextMenu.tsx  # Chat, Workspace, Settings, Quit commands
│   │   ├── main.tsx / pet-context-menu.html / styles.css
│   │
│   ├── assistant/              # Main settings/reflection panel
│   │   ├── Assistant.tsx       # Tabbed UI (Prayers, To Do, Focus, Reflections, Settings)
│   │   ├── main.tsx / assistant.html / styles.css
│   │
│   ├── chatbar/                # Quick AI input bar (transparent overlay)
│   │   ├── ChatBar.tsx         # Input + streaming AI responses + screenshot
│   │   ├── main.tsx / chatbar.html / styles.css
│   │
│   ├── screenshot-question/    # Ayah reflection capture modal
│   │   ├── ScreenshotQuestion.tsx  # Capture + display reflection
│   │   ├── AyahVerseCard.tsx       # Verse card with tafsir, audio, notes, feedback
│   │   ├── main.tsx / screenshot-question.html / styles.css
│   │
│   ├── workspace-browser/      # File explorer for ayati workspace
│   │   ├── WorkspaceBrowser.tsx # Navigation + preview
│   │   ├── main.tsx / workspace-browser.html / styles.css
│   │
│   ├── pomodoro-timer/         # Tiny countdown strip above pet
│   │   ├── PomodoroTimer.tsx   # Clock display
│   │   ├── main.tsx / pomodoro-timer.html / styles.css
│   │
│   ├── onboarding/             # First-run setup wizard
│   │   ├── Onboarding.tsx      # Multi-step flow (welcome, hotkeys, watch, complete)
│   │   ├── steps/              # Individual step components
│   │   ├── main.tsx / onboarding.html / styles.css
│   │
│   └── components/             # Shared UI components
│       ├── QulArabicText.tsx   # Quranic Arabic with QUL font + tajweed coloring
│       ├── qul-tajweed.css
│       ├── MarkdownMessage.tsx # react-markdown + remark-gfm wrapper
│       ├── LinkifyText.tsx     # URL → clickable links
│       ├── HotkeyInput.tsx     # Keyboard shortcut capture widget
│       ├── SettingsSection.tsx # Collapsible settings section
│       ├── AiProviderSettingsFields.tsx
│       ├── GatewaySetupModal.tsx
│       ├── GatewayConnectionBanner.tsx
│       └── ... (other shared UI)
│
├── shared/                     # Shared between main + renderer processes
│   ├── types.ts                # Shared type re-exports
│   ├── pet-window-size.ts      # Window dimension constants
│   ├── pet-appearance.ts       # Pet appearance IDs + labels
│   ├── pomodoro-client.ts      # Remaining time calculation, clock formatting
│   ├── prayer-schedule.ts      # Next prayer time finder
│   ├── tajweed-markup.ts       # Tajweed markup parser
│   └── quran-reciter-preferences.ts
│
└── test/
    └── setup.ts                # Vitest global setup
```

---

## Window Architecture (10 Window Types)

| Window | Type | macOS Level | Purpose |
|--------|------|-------------|---------|
| **petWindow** | Transparent, frameless | `screen-saver` +20 | Animated pixel-art pet |
| **petChatWindow** | Transparent, frameless | `pop-up-menu` | Speech bubble overlay |
| **petPomodoroTimerWindow** | Non-transparent, frameless | `screen-saver` +25 | Pomodoro countdown strip |
| **petContextMenuWindow** | Transparent, frameless | `screen-saver` +30 | Right-click menu |
| **assistantWindow** | Non-transparent, frameless | `pop-up-menu` | Main settings/reflections panel (5 tabs) |
| **chatbarWindow** | Transparent, frameless | `pop-up-menu` | Quick AI input |
| **screenshotQuestionWindow** | Transparent, frameless | `pop-up-menu` | Reflection capture modal |
| **workspaceBrowserWindow** | Non-transparent, frameless | `screen-saver` | Workspace file explorer |
| **onboardingWindow** | Non-transparent | `pop-up-menu` | First-run setup wizard |
| **tray** | System tray icon | Menu bar | Toggle visibility |

All companion panels position themselves relative to the pet window via `getWindowPositionNearAnchor()` in `window-positioning.ts`.

---

## IPC Architecture

All channels exposed via `contextBridge` in `preload.ts` under `window.ayati`:

- **Window controls**: `toggle-assistant`, `open-assistant`, `close-assistant`, `pet-drag`, etc.
- **Pet**: `show-pet-chat`, `hide-pet-chat`, `pet-clicked`, `execute-pet-action`, `move-pet-to`
- **Settings**: `get-settings`, `update-settings`, hotkey capture
- **Quran/Reflections**: `capture-ayah-reflection`, `save-ayah-reflection`, `get-ayah-tafsir`, `get-ayah-audio`, `qul-*`
- **Prayers**: `prayer-settings-*`, `prayer-times-get`, `prayer-times-refresh`
- **Todos**: `todo-create`, `todo-complete`, `todo-delete`
- **Pomodoro**: `pomodoro-start`, `pomodoro-pause`, `pomodoro-complete`
- **AI**: `send-to-clawbot`, `start-clawbot-stream`, `ask-about-screen`
- **Screen**: `capture-screen`, `capture-screen-with-context`
- **Workspace**: `list-workspace-directory`, `preview-workspace-file`
- **Updates**: `update-check`, `update-download`, `update-install`
- **Onboarding**: `validate-gateway`, `onboarding-complete`

---

## Pet / Sidekick System

**5 appearances:** ayah (default), bolt, cloudlet, cosmo, boba

Each has a `spritesheet.webp` + `atlas.json` defining 20 clip types: idle, running, waving, jumping, sleeping, curious, excited, etc.

**Rendering:** `SpritePet.tsx` renders to `<canvas>`, loading WebP spritesheets and painting frames at atlas-defined FPS.

**Behaviors (in main.ts and Pet.tsx):**
- 8 idle behaviors (blink, look_around, snip_claws, wiggle, stretch, yawn, wave, wander) with weighted probabilities
- Sleep cycle after 60s idle (doze → sleeping)
- Camera snap flash animation
- Wake flight (upward bounce on wake)
- Attention seeker (periodic movement toward cursor)
- Draggable with run animation direction tracking
- Poke reactions on click
- Mood system driven by ClawBot moods

---

## Quran Data Flow

1. **Trigger**: User selects a reflection theme (manual) or app-switch nudge fires
2. **Theme Engine** (`ayah-theme-engine.ts`): Ranks `CURATED_AYAH_CANDIDATES` from `ayah-fallbacks.ts` using:
   - Theme match confidence
   - Feedback signals (relevant/not_relevant per theme)
   - Recency penalty
3. **Content Fetch** (`ayah-reflection-content.ts`):
   - Primary: Quran Foundation API
   - Fallback: Hardcoded fallback data
4. **QUL Rendering**: `bundled-qul-repository.ts` loads from bundled SQLite → selects font → renders with optional tajweed coloring
5. **Display**: `QulArabicText` component renders Arabic text with QUL fonts and color palette

**Feedback loop:** User marks reflections as relevant/not_relevant → scores adjust via `RELEVANT_THEME_BOOST` (+18), `NOT_RELEVANT_PAIR_PENALTY` (-60), `NOT_RELEVANT_THEME_PENALTY` (-16) — per theme and per verse pair.

---

## Key Services (instantiated in main.ts)

| Service | File | Purpose |
|---------|------|---------|
| `Watchers` | `watchers.ts` | App focus monitoring via `active-win` + file watching via `chokidar` |
| `ClawBotClient` | `clawbot-client.ts` | AI provider client (OpenAI-compatible + Anthropic Messages) |
| `createStore()` | `store.ts` | `electron-store` backed persistent config |
| `AyahLensState` | `ayah-types.ts` | Central state shape for all reflections, settings, and sync data |
| `BundledQulRepository` | `qul/bundled-qul-repository.ts` | SQLite-backed Quran Arabic rendering |

---

## Config Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite multi-entry build (7 HTML entry points), output to `dist/renderer` |
| `tsconfig.json` | Root TS config (renderer + shared), ES2022, bundler resolution |
| `tsconfig.main.json` | Main process TS config, CommonJS, Node resolution |
| `tailwind.config.js` | Custom font family: Satoshi with system fallbacks |
| `vitest.config.ts` | jsdom environment, globals enabled, pattern `src/**/*.test.{ts,tsx}` |
| `electron-builder.env` | Apple notarization credentials (CI-only, gitignored) |
| `.env.example` | Template for local env variables |
| `postcss.config.js` | tailwindcss + autoprefixer |

---

## Build & Release

- **Dev:** `bun run dev` (concurrent main compile + Vite dev server on port 5173)
- **Build:** `bun run build` (renderer Vite build → main TSC compile)
- **Package:** `bun run dist:mac` | `bun run dist:win` | `bun run dist:linux`
- **Output:** `release/` (DMG, ZIP, AppImage, etc.)
- **Notarization:** macOS hardened runtime + Apple notarization via `electron-builder.env`

---

## Known Risks & Design Considerations

- **main.ts is ~4000+ lines** — owns window creation, IPC, pet behaviors, timers, and orchestration. New features should be in focused modules with narrow IPC handlers.
- **Desktop OAuth** cannot protect a client secret; PKCE mitigates but production should proxy token exchange through a backend.
- **Quran Foundation APIs** may change shape — endpoint config is centralized in `quran-runtime-config.ts`, errors are normalized in the client.
- **10 BrowserWindows** means significant memory footprint; window pooling could reduce overhead.
- **All renderers are independent React apps** — no shared state between them, only IPC to main process.
- **Pet sleep/wake cycle** and attention seeker run on `setInterval` in main.ts; these could be extracted to a dedicated pet behavior manager.

---

## Docs Reference

| Document | Purpose |
|----------|---------|
| `docs/prd.md` | Product requirements (non-AI companion) |
| `docs/BRAND_GUIDELINES.md` | Brand identity, colors, fonts |
| `docs/features.md` | Feature walkthrough and demo flow |
| `docs/api-keys.md` | API credential management |
| `docs/PRIVACY_POLICY.md` | Privacy policy (no telemetry, local-first) |
| `docs/TERMS_OF_SERVICE.md` | Terms of service (MIT-style) |
| `docs/quran-com-apis.md` | Quran Foundation API reference |
| `docs/hackathon-fulfillment.md` | Hackathon submission checklist |
| `docs/hackathon-rules.md` | Quran Foundation Hackathon rules |
| `docs/ayahlens-hackathon-implementation-plan.md` | Implementation plan |
