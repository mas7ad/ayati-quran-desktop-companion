import { describe, expect, it } from 'vitest';

import { createDefaultAyahLensState } from './ayah-reflection-store';
import { DEFAULT_PUBLIC_QURAN_CLIENT_ID, resolveQuranClientConfig } from './quran-runtime-config';

describe('resolveQuranClientConfig', () => {
  it('uses setup credentials with local secret exchange when encrypted secret is present', () => {
    const state = createDefaultAyahLensState();
    state.quranConfig = {
      clientId: 'setup-client-id',
      encryptedClientSecret: 'encrypted-secret',
      redirectUri: 'ayati://oauth/callback',
      environment: 'prelive',
    };

    const config = resolveQuranClientConfig({
      state,
      env: {
        QURAN_CLIENT_ID: 'env-client-id',
        QURAN_REDIRECT_URI: 'env://callback',
        QURAN_FOUNDATION_ENV: 'production',
        QURAN_BACKEND_BASE_URL: 'https://ayati-website.vercel.app',
      },
      decryptSecret: () => 'setup-client-secret',
    });

    expect(config).toEqual({
      clientId: 'setup-client-id',
      clientSecret: 'setup-client-secret',
      redirectUri: 'env://callback',
      authBaseUrl: 'https://prelive-oauth2.quran.foundation',
      apiBaseUrl: 'https://apis-prelive.quran.foundation',
      contentApiBaseUrl: 'https://api.quran.com/api/v4',
      backendBaseUrl: undefined,
    });
  });

  it('prefers env redirect URI over persisted setup redirect when using a local secret', () => {
    const state = createDefaultAyahLensState();
    state.quranConfig.redirectUri = 'ayati://oauth/callback';

    const config = resolveQuranClientConfig({
      state,
      env: {
        QF_CLIENT_ID: 'env-client-id',
        QF_CLIENT_SECRET: 'env-client-secret',
        QURAN_REDIRECT_URI: 'https://ayati-website.vercel.app/oauth/callback',
      },
      decryptSecret: () => null,
    });

    expect(config.redirectUri).toBe('https://ayati-website.vercel.app/oauth/callback');
    expect(config.backendBaseUrl).toBeUndefined();
  });

  it('uses env client secret for direct exchange and skips the Vercel proxy', () => {
    const config = resolveQuranClientConfig({
      state: createDefaultAyahLensState(),
      env: {
        QURAN_CLIENT_ID: 'env-client-id',
        QF_CLIENT_SECRET: 'env-client-secret',
        QURAN_REDIRECT_URI: 'https://ayati-website.vercel.app/oauth/callback',
        QURAN_FOUNDATION_ENV: 'prelive',
      },
      decryptSecret: () => null,
    });

    expect(config.clientId).toBe('env-client-id');
    expect(config.clientSecret).toBe('env-client-secret');
    expect(config.redirectUri).toBe('https://ayati-website.vercel.app/oauth/callback');
    expect(config.authBaseUrl).toBe('https://prelive-oauth2.quran.foundation');
    expect(config.backendBaseUrl).toBeUndefined();
  });

  it('falls back to env vars when setup credentials are blank', () => {
    const config = resolveQuranClientConfig({
      state: createDefaultAyahLensState(),
      env: {
        QURAN_CLIENT_ID: 'env-client-id',
        QURAN_REDIRECT_URI: 'https://ayati-website.vercel.app/oauth/callback',
        QURAN_AUTH_BASE_URL: 'https://auth.example.test',
        QURAN_API_BASE_URL: 'https://api.example.test',
        QURAN_CONTENT_API_BASE_URL: 'https://content.example.test/api/v4',
        QURAN_BACKEND_BASE_URL: 'https://ayati-website.vercel.app',
      },
      decryptSecret: () => null,
    });

    expect(config).toEqual({
      clientId: 'env-client-id',
      clientSecret: undefined,
      redirectUri: 'https://ayati-website.vercel.app/oauth/callback',
      authBaseUrl: 'https://auth.example.test',
      apiBaseUrl: 'https://api.example.test',
      contentApiBaseUrl: 'https://content.example.test/api/v4',
      backendBaseUrl: 'https://ayati-website.vercel.app',
    });
  });

  it('uses env-selected production endpoints when setup credentials are blank', () => {
    const config = resolveQuranClientConfig({
      state: createDefaultAyahLensState(),
      env: {
        QURAN_CLIENT_ID: 'env-client-id',
        QURAN_FOUNDATION_ENV: 'production',
      },
      decryptSecret: () => null,
    });

    expect(config.authBaseUrl).toBe('https://oauth2.quran.foundation');
    expect(config.apiBaseUrl).toBe('https://apis.quran.foundation');
    expect(config.contentApiBaseUrl).toBe('https://api.quran.com/api/v4');
  });

  it('ignores env client secret when using the bundled public client id', () => {
    const config = resolveQuranClientConfig({
      state: createDefaultAyahLensState(),
      env: {
        QF_CLIENT_ID: DEFAULT_PUBLIC_QURAN_CLIENT_ID,
        QF_CLIENT_SECRET: 'personal-secret',
        QURAN_REDIRECT_URI: 'https://ayati-website.vercel.app/oauth/callback',
      },
      decryptSecret: () => null,
    });

    expect(config.clientId).toBe(DEFAULT_PUBLIC_QURAN_CLIENT_ID);
    expect(config.clientSecret).toBeUndefined();
    expect(config.backendBaseUrl).toBe('https://ayati-website.vercel.app');
  });

  it('uses public production backend defaults when setup and env credentials are blank', () => {
    const config = resolveQuranClientConfig({
      state: createDefaultAyahLensState(),
      env: {},
      decryptSecret: () => null,
    });

    expect(config.clientId).toBe('0059acb5-8d81-4535-8070-02c072166ff8');
    expect(config.clientSecret).toBeUndefined();
    expect(config.redirectUri).toBe('https://ayati-website.vercel.app/oauth/callback');
    expect(config.authBaseUrl).toBe('https://oauth2.quran.foundation');
    expect(config.apiBaseUrl).toBe('https://apis.quran.foundation');
    expect(config.contentApiBaseUrl).toBe('https://api.quran.com/api/v4');
    expect(config.backendBaseUrl).toBe('https://ayati-website.vercel.app');
  });

  it('matches release build defaults with empty env (packaged app profile)', () => {
    const state = createDefaultAyahLensState();
    state.quranConfig = {
      clientId: '',
      encryptedClientSecret: null,
      redirectUri: 'https://ayati-website.vercel.app/oauth/callback',
      environment: 'production',
    };

    const config = resolveQuranClientConfig({
      state,
      env: {},
      decryptSecret: () => null,
    });

    expect(config.clientSecret).toBeUndefined();
    expect(config.backendBaseUrl).toBe('https://ayati-website.vercel.app');
    expect(config.authBaseUrl).toBe('https://oauth2.quran.foundation');
    expect(config.apiBaseUrl).toBe('https://apis.quran.foundation');
  });
});
