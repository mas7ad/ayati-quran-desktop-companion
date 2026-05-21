import { APP_DISPLAY_NAME } from '../../shared/app-branding';

interface GatewaySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckConnection: () => void;
}

export function GatewaySetupModal({ isOpen, onClose, onCheckConnection }: GatewaySetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0f0f0f] w-full max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-white">AI provider required</h2>
          <p className="text-sm text-neutral-300 mt-2">
            {APP_DISPLAY_NAME} needs a connected vision provider before it can understand screenshots for ayah reflections.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="border-b border-neutral-900 pb-4">
            <h3 className="text-sm text-foreground">Check connection settings</h3>
            <p className="text-[11px] text-neutral-600 mt-px leading-relaxed">
              Confirm the base URL includes /v1 and the model name matches the bundled free provider.
            </p>
            <p className="text-[11px] text-neutral-600 mt-2 leading-relaxed">
              Open Settings, update the AI provider fields, then use Check Connection to refresh the status.
            </p>
          </div>

          <div className="border-b border-neutral-900 pb-4">
            <h3 className="text-sm text-foreground">Still disconnected?</h3>
            <p className="text-[11px] text-neutral-600 mt-px leading-relaxed">
              Try the default free model again, then verify the provider account has vision access.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onCheckConnection}
            className="text-sm text-[#67E0A3] hover:text-[#67E0A3]/80 transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Check Connection
          </button>
        </div>
      </div>
    </div>
  );
}
