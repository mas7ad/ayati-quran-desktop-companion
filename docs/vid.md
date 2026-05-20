# Ayati — Video Pitch Script

**Length target:** 2–3 minutes  
**One-line hook:** Ayati turns your everyday desktop moments into Quran reflection—and saves what matters to your Quran Foundation account.

---

## The Product

**Ayati** is a macOS/Windows desktop companion for Muslims who work on a computer all day. A small animated pet lives on your screen. When life interrupts you—stress before a meeting, gratitude after good news, distraction during deep work—you press a hotkey. Ayati reads what’s on your screen, finds a relevant ayah, and shows you:

- Uthmani Arabic text and a trusted translation (Quran Foundation Content API)
- A short reflection and why that verse fits your moment
- Tafsir, recitation audio, alternate ayahs, and a shareable card

If you’re signed in with Quran Foundation, one tap saves the ayah as a bookmark, adds a personal note, drops it into a collection, and logs your Quran activity for streak tracking.

Around that core loop, Ayati also helps you stay grounded through the day: prayer-time reminders, local todos, a Pomodoro focus timer, reflection history with day recap, and a gentle pet that reacts when you capture or complete tasks.

**Privacy by design:** screenshots are analyzed and discarded. Only text summaries, ayah content, themes, notes, and sync state stay on your machine. OAuth tokens are encrypted with OS-level secure storage.

---

## Value Proposition

**Problem:** Quran engagement often lives in a separate app or habit. After Ramadan, that habit fades—especially during work, when the screen is full of everything except the Quran.

**Solution:** Ayati meets you where you already are—the desktop—and turns *this* moment into *that* ayah, without opening a search box or guessing what to read.

| For the user | What Ayati delivers |
|--------------|---------------------|
| **Relevance** | Screen-aware ayah ranking (stress, focus, gratitude, patience, work, study, and more) |
| **Depth** | Translation, tafsir, recitation—not just a quote |
| **Continuity** | Bookmarks, notes, collections, and streaks synced to Quran Foundation |
| **Habit** | Lightweight hotkey + history + reminders + prayer awareness |
| **Delight** | A desktop pet that makes remembrance feel human, not clinical |

**Why now:** Built for the Quran Foundation Hackathon (Ramadan 2026)—the explicit goal is technology that keeps people connected to the Quran *after* Ramadan, not only during it.

---

## Vision

**Near term:** The default “Quran layer” for desktop work—a companion that makes dhikr-sized moments normal: capture, reflect, save, move on.

**Long term:** Ayati becomes the ambient spiritual OS for knowledge workers and students:

- **Context-aware remembrance** across apps and workflows, always respectful of privacy
- **Personal Quran library** that grows from real life—saved ayahs tied to the moments you lived
- **Community-ready foundation** via Quran Foundation APIs (bookmarks, collections, streaks) so reflection isn’t trapped on one device
- **Gentle accountability** through prayer times, focus sessions, and streaks—without guilt or gamification overload

We’re not replacing Quran.com or a mushaf. We’re filling the gap between “I should read more” and “this ayah is exactly what I needed right now.”

---

## Traction

*Be honest in the video—lead with what’s shipped and verified.*

### Shipped (v0.1.0)

- **Production desktop app** — Electron companion with full reflection loop, pet companion, assistant panel, and settings
- **macOS distribution** — Signed/notarized DMG builds for Apple Silicon and Intel (`release/`)
- **Landing & updates** — [ayati-website.vercel.app](https://ayati-website.vercel.app/) with OAuth callback proxy and auto-update metadata
- **Open source** — [github.com/mwijanarko1/ayati-quran-desktop-companion](https://github.com/mwijanarko1/ayati-quran-desktop-companion)

### Quran Foundation integration (hackathon-ready)

- **Content API:** verses, tafsir, recitation
- **User API:** bookmarks, notes, collections, activity days, current streak
- **OAuth/OIDC:** PKCE sign-in with encrypted local tokens and offline pending sync

### Engineering quality

- TypeScript strict mode, Vitest coverage on Quran client, reflection store, and core UI flows
- Documented demo path, API usage, privacy policy, and hackathon fulfillment checklist

### Submission status (as of build)

- **Hackathon:** Quran Foundation Hackathon 2026 — full technical requirements mapped in `docs/hackathon-fulfillment.md`
- **Pending for submission:** 2–3 min demo video (this script), final team names, live download link in submission form

### Traction to claim carefully

Use only metrics you can verify on camera or in links:

- “Working v0.1.0 builds for macOS” ✓  
- “Full Quran Foundation Content + User API journey” ✓  
- “Automated test suite for core flows” ✓  
- User/download counts — **only if you have analytics**; otherwise say “early release, seeking first users from hackathon and community”

---

## Suggested 2–Minute Demo Flow

1. **Hook (10s):** Pet on desktop → “This is Ayati. One shortcut turns whatever you’re doing into a Quran reflection.”
2. **Capture (20s):** Show a real screen (email, notes, calendar) → hotkey → ayah card appears with Arabic, translation, reflection, “why this verse.”
3. **Depth (25s):** Expand tafsir → play recitation → “Show another ayah.”
4. **Save (25s):** Sign in to Quran Foundation → save bookmark → add note → add to collection → show streak/day recap in Reflections tab.
5. **Surround (20s):** Quick cuts—pet reaction, prayer reminder, reflection history filter, share card copy.
6. **Close (20s):** Vision line + “Download at ayati-website.vercel.app” + hackathon framing.

---

## Closing Line (pick one)

- “Ayati doesn’t ask you to leave your work—it brings the Quran into it.”
- “Small moments of remembrance, saved for life—on the desktop you already use.”
- “After Ramadan, the screen is still there. Ayati helps the Quran stay there too.”
