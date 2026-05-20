export const KEYCHAIN_CONSENT_TITLE = 'Secure sign-in storage';

export const KEYCHAIN_CONSENT_LEDE =
  'Ayati uses your Mac Keychain to keep your Quran Foundation sign-in private on this device.';

export const KEYCHAIN_CONSENT_BULLETS = [
  'What we store: your Quran Foundation access and refresh tokens after you sign in.',
  'What we do not store in Keychain: your Mac login password, OpenRouter keys, or app secrets from Vercel.',
  'Why macOS asks next: after you continue, Apple may show a Keychain prompt for “ayati-quran-desktop-companion Safe Storage”. Choose Allow or Always Allow so Ayati can read tokens without asking every launch.',
] as const;

export const KEYCHAIN_CONSENT_DENIED_MESSAGE =
  'Keychain access is required to keep your Quran Foundation sign-in on this device. You can try again from Settings → Quran.';

export interface KeychainConsentStatus {
  required: boolean;
  acknowledged: boolean;
  hasStoredSecrets: boolean;
}
