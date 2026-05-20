# Ayati - Quran Desktop Companion

Ayati - Quran Desktop Companion is an Electron desktop companion that turns a screenshot into a Quran-focused reflection. Press the capture shortcut, Ayati sends the image to the configured AI provider, ranks a relevant ayah, retrieves Quran Foundation content, and can save a Quran Foundation bookmark when the user is signed in.

A small animated pet companion lives on your desktop, reacts to your actions, offers idle behaviors, and can remind you about tasks and prayers.

## Features

### Quran Reflection System
- **Screen Capture & Analysis**: Press a global hotkey to capture your screen and get an AI-powered Quran reflection
- **Ayah Ranking**: AI analyzes your screen context and ranks relevant ayah candidates based on themes (stress, focus, gratitude, patience, work, etc.)
- **Arabic Text & Translation**: Displays Uthmani Arabic text with configurable translations via Quran Foundation API
- **Tafsir Integration**: Expand detailed tafsir (exegesis) for any reflection
- **Audio Recitation**: Play ayah recitation audio from configurable reciters
- **Alternate Ayahs**: View stronger alternate ayah candidates for the same screen context
- **Reflection History**: Browse, search, and filter past reflections by theme, status, and feedback
- **Day Summary**: View daily reflection stats, themes, and saved count
- **Share Card**: Copy a branded share card with ayah text, translation, and notes to clipboard

### Quran Foundation Integration
- **OAuth2 Sign-In**: PKCE authorization code flow for secure user authentication
- **Bookmarks**: Save ayah bookmarks synced to your Quran Foundation account
- **Personal Notes**: Attach reflection notes to ayahs (local or synced)
- **Collections**: Create collections and organize saved ayahs
- **Streak Tracking**: Track and display your Quran reading streak
- **Activity Recording**: Automatically log Quran activity days
- **Offline Support**: Local storage with pending sync when offline

### Pet Companion
- **Animated Sprite Pet**: A small desktop pet with multiple appearance themes (Ayah, Bolt, Cloudlet, Cosmo)
- **Idle Behaviors**: Blink, look around, snip claws, yawn, wander, stretch, wiggle, wave
- **Attention Seeking**: Pet can seek attention when idle
- **Pet Chat**: Click the pet to open a chat bubble with AI-powered responses
- **Context Menu**: Right-click the pet for quick actions
- **Tutorial**: First-launch tutorial guides you through pet features
- **Camera Snap Feedback**: Pet reacts with a camera animation when capturing reflections

### Prayer Awareness
- **Prayer Times**: Fetch daily prayer times by city/country via AlAdhan API
- **Calculation Methods**: 20+ calculation methods (MWL, ISNA, Umm Al-Qura, JAKIM, etc.)
- **Juristic Schools**: Shafi/Maliki/Hanbali or Hanafi Asr time
- **Prayer Reminders**: Configurable lead-time reminders before prayer
- **Quiet Windows**: Suppress nudges during prayer times
- **Location Presets**: Quick-select cities across 10 countries

### Task Management
- **Local Todos**: Create tasks with title, notes, priority, due date, and reminders
- **Pet Reminders**: Pet can remind you about upcoming tasks
- **Task Completion**: Mark tasks complete or delete them

### Pomodoro Timer
- **Focus Sessions**: Configurable focus, short break, and long break durations
- **Session Tracking**: Track completed focus sessions and history
- **Todo Integration**: Link focus sessions to specific tasks
- **Pet Reminders**: Pet notifies when sessions complete

### AI Provider Support
Ayati uses OpenRouter by default but supports multiple AI providers:

| Provider | Base URL | Default Model |
| --- | --- | --- |
| OpenRouter | `https://openrouter.ai/api/v1` | `google/gemma-4-31b-it:free` |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.2` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3-flash-preview` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| Claude (Anthropic) | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| Grok (xAI) | `https://api.x.ai/v1` | `grok-4.20-reasoning` |
| Kimi (Moonshot AI) | `https://api.moonshot.ai/v1` | `kimi-k2.5` |
| GLM (Z.AI) | `https://api.z.ai/api/paas/v4` | `glm-5.1` |

OpenAI-compatible providers append `/chat/completions`; Claude appends `/messages` with Anthropic headers.

### Chat & Assistant
- **Streaming Chat**: Real-time streaming AI responses in the assistant panel
- **Screen Analysis**: Ask AI to analyze your current screen
- **Chat History**: Persistent chat history across sessions
- **Quick Prompts**: Built-in prompts for Quranic guidance and day summaries

### Workspace Browser
- **File Navigation**: Browse your Ayati workspace files and directories
- **File Previews**: Preview markdown, JSON, and image files
- **Open in System**: Open files/folders in your default system application

### Auto-Updates
- **Automatic Updates**: Check stable website metadata at `https://ayati-website.vercel.app/update/latest.json`
- **Installer Downloads**: Download the platform-specific installer URL published in the website metadata, with SHA-256 verification when provided
- **Update Notifications**: Badge indicator in settings when updates are available
- **Cross-Platform**: Supports macOS Apple Silicon, macOS Intel, and Windows x64 metadata entries

### Customization
- **Customizable Hotkeys**: Configure global shortcuts for chat, capture, and assistant
- **Pet Appearance**: Choose from multiple pet themes
- **Mushaf Options**: Multiple mushaf scripts (Madani 1421, Indo-Pak Nastaleeq, QPC Nastaleeq, etc.)
- **Tajweed Support**: Optional tajweed color markup rendering
- **Translation Selection**: Configurable translation resource
- **Contextual Nudges**: AI-powered Quran reminders based on your activity
- **Timed Reminders**: Periodic Quran reflection reminders

### Privacy
- **No Persistent Screenshots**: Screenshots are cleared after reflection is built
- **Local History**: Only text summaries, ayah content, themes, timestamps, notes, and sync state are stored locally
- **Encrypted Tokens**: OAuth tokens encrypted using OS-level secure storage
- **No Re-translation**: Quran translations and tafsir are displayed as returned by the API

## Keyboard Shortcuts

| Action | Default Shortcut |
| --- | --- |
| Open Chat | `Cmd/Ctrl+Alt+,` |
| Reflect on Screen | `Cmd/Ctrl+Alt+/` |
| Open Assistant | `Cmd/Ctrl+Alt+.` |

All shortcuts are customizable in Settings.

## Quran Foundation API Usage

Ayati uses the required Quran Foundation API categories:

- **Content API:** `GET {QURAN_CONTENT_API_BASE_URL}/verses/by_key/{verseKey}` with `translations`, `fields=text_uthmani`, and `translation_fields=resource_name` to fetch Arabic text and translation.
- **Content API:** `GET {QURAN_CONTENT_API_BASE_URL}/tafsirs/{resourceId}/by_ayah/{verseKey}` for tafsir snippets.
- **Content API:** `GET {QURAN_CONTENT_API_BASE_URL}/recitations/{recitationId}/by_ayah/{verseKey}` for ayah recitation audio.
- **User API:** `POST {QURAN_API_BASE_URL}/auth/v1/bookmarks` to save an ayah bookmark with `key`, `verseNumber`, `type: "ayah"`, and `mushaf`.
- **User API:** `POST {QURAN_API_BASE_URL}/auth/v1/notes` to save personal reflection notes attached to the selected ayah.
- **User API:** `POST {QURAN_API_BASE_URL}/auth/v1/collections` and `POST /auth/v1/collections/{collectionId}/bookmarks` to create collections and place saved ayahs into them.
- **User API:** `POST {QURAN_API_BASE_URL}/auth/v1/activity-days` plus `GET /auth/v1/streaks/current-streak-days?type=QURAN` to record Quran activity and display the current streak.
- **OAuth2/OIDC:** `GET {QURAN_AUTH_BASE_URL}/oauth2/auth` and `POST {QURAN_AUTH_BASE_URL}/oauth2/token` using PKCE authorization code flow for user sign-in and refresh.

Packaged release builds ignore `.env` / `.env.local`, use **production** Quran Foundation endpoints, the public Ayati `QF_CLIENT_ID`, `https://ayati-website.vercel.app/oauth/callback`, and delegate token exchange to the Ayati website (Vercel). See [docs/api-keys.md](docs/api-keys.md) for the release checklist.

For **local development** with your own Quran Foundation client (direct OAuth, like the pre-Vercel setup), use `.env.local`:

```bash
QF_CLIENT_ID=<your-client-id>
QF_CLIENT_SECRET=<your-client-secret>
QURAN_REDIRECT_URI=https://ayati-website.vercel.app/oauth/callback
QURAN_FOUNDATION_ENV=prelive
```

For **production-style local testing** without a desktop secret, use only public config in `.env.local`:

```bash
QF_CLIENT_ID=0059acb5-8d81-4535-8070-02c072166ff8
QURAN_REDIRECT_URI=https://ayati-website.vercel.app/oauth/callback
QURAN_BACKEND_BASE_URL=https://ayati-website.vercel.app
QURAN_FOUNDATION_ENV=production
```

`QF_CLIENT_SECRET` for release builds belongs only in the Ayati website/Vercel environment. Never log authorization codes, PKCE verifiers, access tokens, refresh tokens, ID tokens, or client secrets.

## Demo Script

1. Open Settings and choose an AI provider account.
2. Sign in with Quran Foundation.
3. Press `Cmd+Shift+/` or choose **Reflect on Screen**.
4. Show the ayah card with Arabic text, translation, reference, reflection, and why it was selected.
5. Expand tafsir, then play recitation for the returned ayah.
6. Save the bookmark and confirm synced or pending status.
7. Add a personal note and save the ayah into a Quran Foundation collection.
8. Mark the ayah relevant, then use **Show Another Ayah** to demonstrate alternate ranked candidates.
9. Open the **Reflections** tab to show filters, the day recap, streak state, and saved collection/note metadata.
10. Copy the branded share card.

## Development

```bash
bun install
bun run test
bun run build
bun run dev
```

## Packaging

Build downloadable artifacts with Electron Builder:

### macOS
```bash
bun run dist:mac
```

Output files in `release/`:
- `Ayati - Quran Desktop Companion-<version>.dmg` for Intel Macs.
- `Ayati - Quran Desktop Companion-<version>-arm64.dmg` for Apple Silicon Macs.
- Matching `*-mac.zip` files for auto-update feeds.
- `latest-mac.yml` for `electron-updater`.

For a first local or private test build without code signing or notarization:
```bash
bun run dist:mac:unsigned
```

### Windows
```bash
bun run dist:win
```

### Linux
```bash
bun run dist:linux
```

Unsigned builds are downloadable, but macOS Gatekeeper will warn users. For public distribution, build on a Mac with an Apple Developer account, a valid Developer ID Application certificate in Keychain, and Apple notarization credentials configured for Electron Builder. Then upload the macOS Apple Silicon DMG, macOS Intel DMG, and Windows x64 installer to GitHub Releases. Update the Ayati website download redirects and `public/update/latest.json` so both the landing page and the desktop app point at the same release assets. The legacy `electron-updater` generic feed in `package.json` is kept as an opt-in fallback by launching with `AYATI_USE_ELECTRON_UPDATER=true`.

## Project Structure

Runtime code lives under `src/`:

- `src/main/main.ts` - Electron app bootstrap, windows, IPC, screenshot capture, and orchestration
- `src/main/clawbot-client.ts` - AI provider client for chat, streaming, and screenshot analysis
- `src/shared/ai-providers.ts` - Provider catalog, default endpoints, default models, and protocol metadata
- `src/main/quran-foundation-client.ts` - Quran Foundation OAuth, content, and bookmark API client
- `src/main/ayah-*.ts` - Ayah ranking, fallbacks, reflection history, and screen-scene analysis
- `src/main/pomodoro-store.ts` - Pomodoro timer state and session management
- `src/main/todo-store.ts` - Local todo CRUD operations
- `src/main/prayer-*.ts` - Prayer times fetching and prayer-aware reminder logic
- `src/main/store.ts` - Electron store schema and migration
- `src/main/hotkeys.ts` - Global hotkey configuration and parsing
- `src/main/updates.ts` - Auto-update state machine and actions
- `src/renderer/assistant/` - Assistant panel with chat, prayers, todos, focus, reflections, and settings
- `src/renderer/screenshot-question/` - Floating screenshot reflection surface
- `src/renderer/pet/` - Animated pet companion with sprite atlas and tutorial
- `src/renderer/pet-chat/` - Pet chat bubble window
- `src/renderer/pet-context-menu/` - Pet right-click context menu
- `src/renderer/chatbar/` - Quick chat bar
- `src/renderer/onboarding/` - First-launch setup flow
- `src/renderer/workspace-browser/` - Workspace file browser

## License

This project is licensed under a modified MIT License. It requires any website or application using this software in production to include a visible backlink to [mikhailwijanarko.xyz](https://mikhailwijanarko.xyz) on its landing page.

See the [LICENSE](LICENSE) file for the full text.
