import { safeStorage, type Dialog } from 'electron';
import type Store from 'electron-store';
import type { AyahLensState } from './ayah-types';
import type { StoreSchema } from './store';
import {
  KEYCHAIN_CONSENT_BULLETS,
  KEYCHAIN_CONSENT_DENIED_MESSAGE,
  KEYCHAIN_CONSENT_LEDE,
  KEYCHAIN_CONSENT_TITLE,
  type KeychainConsentStatus,
} from '../shared/keychain-consent';

type AppStore = Store<StoreSchema>;

let consentPromptInFlight: Promise<boolean> | null = null;

export function isMacKeychainEncryptionAvailable(): boolean {
  return process.platform === 'darwin' && safeStorage.isEncryptionAvailable();
}

export function isKeychainConsentAcknowledged(store: AppStore): boolean {
  return Boolean(store.get('privacy.keychainSecretsAcknowledged'));
}

export function hasStoredKeychainSecrets(state: AyahLensState): boolean {
  return Boolean(
    state.quranAuth.encryptedAccessToken
    || state.quranAuth.encryptedRefreshToken
    || state.contentAuth.encryptedAccessToken
    || state.quranConfig.encryptedClientSecret,
  );
}

export function getKeychainConsentStatus(
  store: AppStore,
  state: AyahLensState,
): KeychainConsentStatus {
  const required = isMacKeychainEncryptionAvailable();
  const acknowledged = isKeychainConsentAcknowledged(store);
  return {
    required,
    acknowledged,
    hasStoredSecrets: hasStoredKeychainSecrets(state),
  };
}

export function acknowledgeKeychainConsent(store: AppStore): void {
  store.set('privacy.keychainSecretsAcknowledged', true);
}

export function resetKeychainConsentAcknowledgement(store: AppStore): void {
  store.set('privacy.keychainSecretsAcknowledged', false);
}

function buildNativeConsentDetail(): string {
  return KEYCHAIN_CONSENT_BULLETS.map((line) => `• ${line}`).join('\n');
}

async function promptKeychainConsentDialog(dialog: Dialog): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: KEYCHAIN_CONSENT_TITLE,
    message: KEYCHAIN_CONSENT_LEDE,
    detail: buildNativeConsentDetail(),
    buttons: ['Continue', 'Not Now'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  return response === 0;
}

/**
 * Ensures the user has seen our explanation before any safeStorage call.
 * Renderer may call acknowledgeKeychainConsent first (in-app modal); otherwise we show a native dialog.
 */
export async function ensureKeychainConsent(
  store: AppStore,
  dialog: Dialog,
): Promise<boolean> {
  if (!isMacKeychainEncryptionAvailable()) {
    return true;
  }
  if (isKeychainConsentAcknowledged(store)) {
    return true;
  }

  if (!consentPromptInFlight) {
    consentPromptInFlight = (async () => {
      const accepted = await promptKeychainConsentDialog(dialog);
      if (accepted) {
        acknowledgeKeychainConsent(store);
      }
      return accepted;
    })().finally(() => {
      consentPromptInFlight = null;
    });
  }

  return consentPromptInFlight;
}

export { KEYCHAIN_CONSENT_DENIED_MESSAGE };
