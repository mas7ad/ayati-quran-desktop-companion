import type { AyahLensState } from './ayah-types';

export interface QuranRuntimeConfigEnv {
  QURAN_CLIENT_ID?: string;
  QF_CLIENT_ID?: string;
  QURAN_CLIENT_SECRET?: string;
  QF_CLIENT_SECRET?: string;
  QURAN_REDIRECT_URI?: string;
  QURAN_FOUNDATION_ENV?: string;
  QURAN_AUTH_BASE_URL?: string;
  QURAN_API_BASE_URL?: string;
  QURAN_CONTENT_API_BASE_URL?: string;
  QURAN_BACKEND_BASE_URL?: string;
  AYATI_QURAN_BACKEND_BASE_URL?: string;
}

export interface QuranRuntimeConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authBaseUrl?: string;
  apiBaseUrl?: string;
  contentApiBaseUrl?: string;
  backendBaseUrl?: string;
}

interface ResolveQuranClientConfigOptions {
  state: AyahLensState;
  env: QuranRuntimeConfigEnv;
  decryptSecret: (value: string | null | undefined) => string | null;
}

function getDefaultAuthBaseUrl(environment?: string): string {
  return environment === 'prelive'
    ? 'https://prelive-oauth2.quran.foundation'
    : 'https://oauth2.quran.foundation';
}

function getDefaultApiBaseUrl(environment?: string): string {
  return environment === 'prelive'
    ? 'https://apis-prelive.quran.foundation'
    : 'https://apis.quran.foundation';
}

function getDefaultContentApiBaseUrl(): string {
  return 'https://api.quran.com/api/v4';
}

/** Public Ayati client id for release builds (no desktop secret; token exchange via Vercel). */
export const DEFAULT_PUBLIC_QURAN_CLIENT_ID = '0059acb5-8d81-4535-8070-02c072166ff8';
const DEFAULT_QURAN_REDIRECT_URI = 'https://ayati-website.vercel.app/oauth/callback';
const DEFAULT_QURAN_BACKEND_BASE_URL = 'https://ayati-website.vercel.app';
/** Release builds default to production Quran Foundation endpoints. */
export const DEFAULT_QURAN_FOUNDATION_ENV = 'production' as const;

function pickNonBlank(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function normalizeQuranEnvironment(environment?: string): 'prelive' | 'production' {
  const normalized = environment?.trim().toLowerCase();
  if (normalized === 'production') return 'production';
  return 'prelive';
}

export function resolveQuranClientConfig({
  state,
  env,
  decryptSecret,
}: ResolveQuranClientConfigOptions): QuranRuntimeConfig {
  const setupConfig = state.quranConfig;
  const setupSecret = decryptSecret(setupConfig.encryptedClientSecret);
  const envClientId = pickNonBlank(env.QURAN_CLIENT_ID, env.QF_CLIENT_ID);
  const envClientSecret = pickNonBlank(env.QURAN_CLIENT_SECRET, env.QF_CLIENT_SECRET);
  const hasSetupCredentials = Boolean(
    pickNonBlank(setupConfig.clientId, setupConfig.encryptedClientSecret),
  );
  const explicitClientId = pickNonBlank(setupConfig.clientId, envClientId);
  const clientId = explicitClientId ?? DEFAULT_PUBLIC_QURAN_CLIENT_ID;
  const usesBundledPublicClient = clientId === DEFAULT_PUBLIC_QURAN_CLIENT_ID;

  let localClientSecret = pickNonBlank(setupSecret, envClientSecret);
  if (usesBundledPublicClient && !setupSecret) {
    localClientSecret = undefined;
  }
  const usesLocalConfidentialClient = Boolean(localClientSecret);

  const environment = normalizeQuranEnvironment(hasSetupCredentials
    ? setupConfig.environment
    : (env.QURAN_FOUNDATION_ENV || DEFAULT_QURAN_FOUNDATION_ENV));
  const authBaseUrl = pickNonBlank(env.QURAN_AUTH_BASE_URL) ?? getDefaultAuthBaseUrl(environment);
  const apiBaseUrl = pickNonBlank(env.QURAN_API_BASE_URL) ?? getDefaultApiBaseUrl(environment);
  const contentApiBaseUrl = pickNonBlank(env.QURAN_CONTENT_API_BASE_URL) ?? getDefaultContentApiBaseUrl();
  const backendBaseUrl = usesLocalConfidentialClient
    ? undefined
    : (pickNonBlank(env.QURAN_BACKEND_BASE_URL, env.AYATI_QURAN_BACKEND_BASE_URL)
      ?? DEFAULT_QURAN_BACKEND_BASE_URL);

  const redirectUri = pickNonBlank(
    env.QURAN_REDIRECT_URI,
    hasSetupCredentials ? setupConfig.redirectUri : undefined,
  ) ?? DEFAULT_QURAN_REDIRECT_URI;

  return {
    clientId,
    clientSecret: usesLocalConfidentialClient ? localClientSecret : undefined,
    redirectUri,
    authBaseUrl,
    apiBaseUrl,
    contentApiBaseUrl,
    backendBaseUrl,
  };
}
