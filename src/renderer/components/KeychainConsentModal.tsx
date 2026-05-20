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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-[#07120f] border border-[#67E0A3]/20 rounded-lg w-full max-w-lg mx-4 p-5 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-400 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-white pr-8">{KEYCHAIN_CONSENT_TITLE}</h2>
        <p className="text-sm text-[#b9c9c1] mt-2">{KEYCHAIN_CONSENT_LEDE}</p>

        <ul className="mt-4 space-y-3 text-sm text-neutral-300 list-disc pl-5">
          {KEYCHAIN_CONSENT_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-neutral-500">
          After you tap Continue, macOS may ask for your login password to unlock Keychain access. That prompt comes from Apple; Ayati cannot change its wording.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-neutral-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 text-sm bg-[#67E0A3] hover:bg-[#7CF0BD] text-[#07120f] rounded-lg font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
