import {
  KEYCHAIN_CONSENT_BULLETS,
  KEYCHAIN_CONSENT_LEDE,
  KEYCHAIN_CONSENT_TITLE,
} from '../../shared/keychain-consent';

interface KeychainConsentModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function KeychainConsentModal({ isOpen, onContinue, onCancel }: KeychainConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      <div className="relative bg-[#0f0f0f] w-full max-w-lg mx-4 p-6">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-6 right-6 text-neutral-600 hover:text-neutral-400 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-base font-semibold text-white pr-8">{KEYCHAIN_CONSENT_TITLE}</h2>
        <p className="text-sm text-neutral-300 mt-3">{KEYCHAIN_CONSENT_LEDE}</p>

        <ul className="mt-4 space-y-2.5 text-sm text-neutral-400 list-disc pl-5">
          {KEYCHAIN_CONSENT_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="mt-6 border-t border-neutral-900 pt-5">
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            After you tap Continue, macOS may ask for your login password to unlock Keychain access. That prompt comes from Apple; Ayati cannot change its wording.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="text-sm text-[#67E0A3] hover:text-[#67E0A3]/80 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
