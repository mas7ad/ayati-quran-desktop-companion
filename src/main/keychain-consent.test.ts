import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
  },
}));

function createMockStore() {
  const data: Record<string, unknown> = {
    'privacy.keychainSecretsAcknowledged': false,
  };
  return {
    get: (key: string) => data[key],
    set: (key: string, value: unknown) => {
      data[key] = value;
    },
  };
}

describe('keychain-consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects stored secrets in ayah lens state', async () => {
    const { hasStoredKeychainSecrets } = await import('./keychain-consent');
    const { createDefaultAyahLensState } = await import('./ayah-reflection-store');
    const state = createDefaultAyahLensState();
    expect(hasStoredKeychainSecrets(state)).toBe(false);
    state.quranAuth.encryptedAccessToken = 'abc';
    expect(hasStoredKeychainSecrets(state)).toBe(true);
  });

  it('tracks acknowledgement in the store', async () => {
    const {
      acknowledgeKeychainConsent,
      isKeychainConsentAcknowledged,
      resetKeychainConsentAcknowledgement,
    } = await import('./keychain-consent');
    const store = createMockStore();
    expect(isKeychainConsentAcknowledged(store as never)).toBe(false);
    acknowledgeKeychainConsent(store as never);
    expect(isKeychainConsentAcknowledged(store as never)).toBe(true);
    resetKeychainConsentAcknowledgement(store as never);
    expect(isKeychainConsentAcknowledged(store as never)).toBe(false);
  });

  it('skips consent when keychain encryption is unavailable', async () => {
    const { ensureKeychainConsent } = await import('./keychain-consent');
    const store = createMockStore();
    const dialog = { showMessageBox: vi.fn() };
    await expect(ensureKeychainConsent(store as never, dialog as never)).resolves.toBe(true);
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('prompts once and records acknowledgement when macOS encryption is available', async () => {
    const electron = await import('electron');
    const isEncryptionAvailable = electron.safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>;
    isEncryptionAvailable.mockReturnValue(true);
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const { ensureKeychainConsent, isKeychainConsentAcknowledged } = await import('./keychain-consent');
    const store = createMockStore();
    const dialog = {
      showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
    };

    await expect(ensureKeychainConsent(store as never, dialog as never)).resolves.toBe(true);
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    expect(isKeychainConsentAcknowledged(store as never)).toBe(true);

    await expect(ensureKeychainConsent(store as never, dialog as never)).resolves.toBe(true);
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
    isEncryptionAvailable.mockReturnValue(false);
  });

  it('reports consent status for the renderer', async () => {
    const { getKeychainConsentStatus } = await import('./keychain-consent');
    const { createDefaultAyahLensState } = await import('./ayah-reflection-store');
    const store = createMockStore();
    const state = createDefaultAyahLensState();
    const status = getKeychainConsentStatus(store as never, state);
    expect(status).toMatchObject({
      acknowledged: false,
      hasStoredSecrets: false,
    });
    expect(typeof status.required).toBe('boolean');
  });
});
