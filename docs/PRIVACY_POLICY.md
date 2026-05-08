# Privacy Policy — Ayati - Quran Desktop Companion

**Effective date:** 2026-05-03  
**Application:** Ayati - Quran Desktop Companion (the “App”), an Electron desktop application.

---

## Important notice (not legal advice)

This document describes how the App is **designed to behave** based on the product codebase. It is **not** legal advice. Privacy obligations depend on your jurisdiction, how you distribute the App, and how you evolve the product. **Have a qualified attorney review** this policy before you rely on it for compliance, app store submissions, or user-facing publication.

---

## Who this policy is for

This policy is intended for **end users** of the App and for **operators** who publish or distribute builds of the App.

**Operator / contact:** Use the contact method published with your distribution (for example, the maintainer email or GitHub repository listed on the download page or in-app “About” / feedback links). The open-source project is associated with the repository referenced in the product’s links (for example GitHub issues for feedback).

---

## Summary

| Topic | What the App does (as implemented) |
|--------|--------------------------------------|
| **First-party “Ayati cloud” or user database** | The App does **not** ship with analytics SDKs (for example Sentry, PostHog, Mixpanel) in the dependency set reviewed for this document, and it does **not** require signing into an Ayati-operated account to run. |
| **Data the operator “collects” from the App** | The App is built to store data **locally on the user’s device** via `electron-store` and related local files. **Routine operation of the App does not upload that local store to an Ayati-operated server** because no such server is part of this codebase. |
| **Data that leaves the device** | Data leaves the device only when **you** enable features that call **third-party** services (see below), or when the App checks for **software updates** (see Updates). |

If you operate a website or landing page for the App, that site may use cookies, analytics, or forms—that is **separate** from this desktop App and needs its own notice.

---

## 1. Local data the App stores and uses

The App persists configuration and content **on the user’s computer** (typical Electron user data area). Categories include:

### 1.1 AI assistant (“Clawbot” / provider) settings

- **AI provider base URL** (for example OpenRouter or a custom OpenAI-compatible endpoint).
- **API key or token** for the configured provider (stored locally; treated as highly sensitive).
- **Provider type and model identifier** associated with chat and vision requests.

### 1.2 Chat and assistant content

- **Chat message history** (role, text content, timestamps) stored in the local store schema for the assistant experience.

### 1.3 Activity watching (optional)

- **Settings** for whether the App watches the active application and whether **window titles** are included.
- **Watched folder paths** the user selects for file change notifications.
- **Derived activity events** (for example app focus changes with app name and optional window title, file add/change/delete with paths) are used in-session for companion behavior; persistence of specific events depends on implementation details—assume activity-related data may be reflected in local state or logs the user controls.

### 1.4 Screen capture and reflection features

- **User preferences** for screen capture, auto-analysis, Ayah Lens (for example translation IDs, mushaf settings, tajweed, capture mode, nudge and reminder timing, prayer/todo/pomodoro settings).
- **Reflection records** (Quran-related reflections, rankings, notes, collections, streak-related metadata, verse cache entries, feedback) stored locally.
- **OAuth tokens for Quran Foundation** and related **encrypted token material**, expiry, scopes, and optional display name fields as provided by the identity provider.
- **Quran Foundation API client configuration** (for example client identifier, redirect URI, environment selection).
- **Pending sync queue** for actions such as bookmarks when offline.

### 1.5 Pet companion and UX

- **Pet position, mood, appearance, transparency and attention-seeking preferences.**
- **Global hotkey bindings.**
- **Onboarding progress** (completion flags and paths).
- **Developer-only flags** if enabled in dev builds (not typical for end users).

### 1.6 Prayer awareness

- **City, country, calculation method, school, and reminder-related preferences** stored locally.
- **Cached prayer schedule data** for the configured location/date as returned by the third-party prayer-times API.

### 1.7 Todos, Pomodoro, and reminders

- **Todo items and reminder-related state** (including identifiers used to avoid duplicate notifications) stored locally.

### 1.8 Bundled Quran text (QUL)

- The App ships **bundled font and text assets** and may use a **local read-only SQL database** (`sql.js`) loaded from packaged resources for Arabic rendering and related features. This is **not** “collection” of user writing; it is local rendering data.

---

## 2. Operating-system permissions and local sensors

Depending on platform and user settings, the App may request or use:

| Permission / capability | Purpose |
|-------------------------|---------|
| **Screen recording / screen capture** | Capture the display to produce reflections and optional “ask about screen” flows. Images may be written to a **temporary file** during capture on some platforms, then deleted after use. |
| **Accessibility (macOS)** | Detect the **foreground application** for optional activity features (`active-win` with accessibility permission). |
| **Screen recording (macOS)** | When the user enables sending **window titles**, some APIs may require screen recording permission to read titles reliably. |
| **Apple Events / Automation (macOS)** | Fallback path to read the **frontmost window title** in some configurations (`NSAppleEventsUsageDescription` in build metadata). |
| **File system (user-selected folders)** | Watch files the user explicitly adds to the watch list. |

The user can refuse permissions; features that depend on them may be limited.

---

## 3. Data sent to third parties (user-configured or feature-triggered)

The App **does not** replace the privacy policies of third parties. When a feature contacts a network endpoint, that provider’s terms and privacy policy govern their processing.

### 3.1 User-chosen AI providers (including OpenRouter)

When the user sends chat messages, screen analysis, or vision requests:

- **Prompt text, conversation context you send, and image-derived content** are transmitted to the **configured provider URL** using the **user-supplied credentials**.
- Providers may log, train on, or retain data per **their** policies. **Do not paste secrets, medical data, or unlawful content into the assistant.**

### 3.2 Quran Foundation (OAuth and APIs)

If the user connects a Quran Foundation account:

- **Authorization and API traffic** go to Quran Foundation (and configured environment endpoints such as prelive vs production).
- **Tokens and account-related metadata** are stored locally (including encrypted token fields as implemented).

### 3.3 Quran.com API (content)

- Verse, tafsir, recitation metadata, and related **content API** requests may go to `api.quran.com` (or the URL configured at build/runtime per `quran-runtime-config`).

### 3.4 Quran Foundation verse media

- **Audio URLs** may reference `verses.quran.foundation` (or constructed URLs from that host) for playback.

### 3.5 AlAdhan (prayer times)

- **City and country** (and date) are sent to `api.aladhan.com` to retrieve prayer times when the user configures prayer awareness.

### 3.6 GitHub (application updates)

- The packaged app is configured to use **electron-updater** with a **generic update feed** pointing at GitHub release artifacts (see `package.json` build `publish` configuration).
- Update checks typically disclose **client version and download metadata** to the host serving releases (GitHub). GitHub’s privacy notice applies.

### 3.7 Other outbound links

- Opening documentation, feedback, or community links (for example from the pet context menu) uses the **system browser**; those sites have their own policies.

---

## 4. What we do **not** do (based on current product scope)

Unless you add it in a future version and update this document:

- **No in-app advertising profile** or ad ID integration was identified in the reviewed architecture.
- **No dedicated “phone home” telemetry channel** to an Ayati analytics backend is part of the described open-source app behavior.
- **No payment processing** is built into the core App flows described in the repository overview.

---

## 5. Security

- **Local storage is only as secure as the user’s device.** Malware, unlocked machines, and shared accounts increase risk.
- **API keys** are powerful credentials. Anyone with access to the device or backups may access keys stored by the App.
- **OAuth tokens** are stored with app-implemented protection (for example encrypted fields); this reduces casual exposure but is **not** a guarantee against a compromised operating system.

---

## 6. Retention and deletion

- **Local data** remains until the user **clears app data**, **uninstalls** the App, or uses in-app controls if provided.
- **Third-party retention** is controlled by those services; users should use provider dashboards to revoke keys or tokens.

---

## 7. Children’s privacy

The App is **not intended for children under 13** (or the minimum age required in your jurisdiction). Operators should not target minors with data-intensive features without appropriate consent mechanisms and legal review.

---

## 8. International users (GDPR / UK GDPR / ePrivacy-style framing)

Depending on where users live, they may have rights to access, rectify, erase, restrict, or object to processing, and rights related to portability or automated decisions. For **purely local processing** on the user’s device, many requests can be satisfied by **the user deleting local data** or **disconnecting third-party accounts**. For processing by **third-party providers**, the provider may be an independent controller—users should contact them directly.

If an **operator** establishes that it acts as a **controller** (for example by operating a support inbox that collects personal data), that operator must honor applicable requests and document its lawful basis.

---

## 9. California / U.S. state privacy notices

If you “sell” or “share” personal information under U.S. state laws, you may need additional disclosures and opt-out links. **This App’s core design emphasizes local storage and user-directed API calls**; whether your **overall business** “sells” data depends on facts outside this repository. Obtain legal advice if you operate at scale in the United States.

---

## 10. Changes to this policy

Update this file when you change data practices, dependencies, or endpoints. For user-facing apps, provide **notice** (for example in release notes or in-app) when material changes occur.

---

## 11. Third-party privacy policies (non-exhaustive)

Users should review:

- Their **AI provider** (for example OpenRouter, OpenAI, Anthropic, Google, etc.).
- **Quran Foundation** documentation for accounts and APIs.
- **AlAdhan** (`api.aladhan.com`).
- **Quran.com** / **verses.quran.foundation** as applicable to content fetches.
- **GitHub** for releases and update metadata.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-05-03 | Initial inventory from application architecture and `docs/CODEBASE_MAP.md`. |
