# Quran Foundation API Credentials

Do not store Quran Foundation client secrets in this repository or desktop app builds.

## Desktop app

**Production / release builds** should use only public OAuth configuration and delegate token exchange to Vercel:

```text
QF_CLIENT_ID=<public-client-id>
QURAN_REDIRECT_URI=https://ayati-website.vercel.app/oauth/callback
QURAN_BACKEND_BASE_URL=https://ayati-website.vercel.app
QURAN_FOUNDATION_ENV=production
```

**Local development** may use your own client id and secret in `.env.local` for direct OAuth (no Vercel proxy), using the same redirect URI registered with Quran Foundation:

```text
QF_CLIENT_ID=<your-client-id>
QF_CLIENT_SECRET=<your-client-secret>
QURAN_REDIRECT_URI=https://ayati-website.vercel.app/oauth/callback
QURAN_FOUNDATION_ENV=prelive
```

Do not ship `QF_CLIENT_SECRET` in production desktop builds.

## Website / Vercel backend

Store confidential values only in the Ayati website Vercel project environment variables:

```text
QF_CLIENT_ID=<public-client-id>
QF_CLIENT_SECRET=<server-side-secret>
QURAN_AUTH_BASE_URL=https://oauth2.quran.foundation
QURAN_API_BASE_URL=https://apis.quran.foundation
QURAN_REDIRECT_URI=https://ayati-website.vercel.app/oauth/callback
```

If a secret is ever pasted into chat, committed, or shipped, rotate it with Quran Foundation before release.

## Release build checklist

Before `bun run dist:mac` (or other release targets):

1. **Desktop app** — no `QF_CLIENT_SECRET` in the repo, `.env.local`, or electron-builder bundle (`files` only includes `dist/` and `package.json`).
2. **Vercel (Ayati website)** — `QF_CLIENT_ID`, `QF_CLIENT_SECRET`, `QURAN_REDIRECT_URI`, and production auth/API base URLs set for the **public** client.
3. **Quran Foundation** — `https://ayati-website.vercel.app/oauth/callback` registered on the **production** public client (prelive-only registration will break release sign-in).
4. **Callback page** — `https://ayati-website.vercel.app/oauth/callback` must forward `code` and `state` to `ayati://oauth/callback` when opening the desktop app.

Packaged apps load **no** `.env.local`; OAuth uses production endpoints and the Vercel token proxy by default.
