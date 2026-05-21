import type { OnboardingData } from '../Onboarding';
import { OnboardingIcon } from '../OnboardingIcon';
import { SpritePet } from '../../pet/SpritePet';
import '../../pet/styles.css';

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export const CompleteStep: React.FC<Props> = ({ data, updateData }) => {
  const contextSummary = !data.watchActiveApp
    ? 'Off'
    : data.watchWindowTitles
      ? 'Using active app and window titles'
      : 'Using active application only';

  return (
    <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-4 min-h-0">
      <div className="mb-4 flex items-center justify-center sprite-pet-root">
        <SpritePet appearanceId="ayah" clip="waving" />
      </div>

      <div className="text-center space-y-1.5 max-w-[420px] mb-6">
        <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Finish</p>
        <h2 className="brand-display text-3xl font-semibold text-white text-balance">
          You&apos;re all set
        </h2>
        <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
          Ayati lives in your menu bar. Use your shortcuts anytime, and open the assistant when you want a pause
          for reflection.
        </p>
      </div>

      {/* Summary — flat, containerless, divider-separated */}
      <div className="w-full max-w-[400px] divide-y divide-white/5 mb-4">
        <div className="flex items-start gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="command" size="1rem" />
          </div>
          <div className="min-w-0">
            <span className="block text-base text-neutral-200">Shortcuts</span>
            <p className="text-sm text-neutral-600 mt-0.5 leading-snug">
              Open assistant:{' '}
              <code className="font-mono text-xs text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/5">
                {data.hotkeyOpenAssistant}
              </code>
              {' · '}
              Hide app:{' '}
              <code className="font-mono text-xs text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/5">
                {data.hotkeyHideApp}
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="window" size="1rem" />
          </div>
          <div className="min-w-0">
            <span className="block text-base text-neutral-200">Context</span>
            <p className="text-sm text-neutral-600 mt-0.5 leading-snug">{contextSummary}</p>
          </div>
        </div>
      </div>

      {/* Launch on startup toggle */}
      <label className="w-full max-w-[400px] flex items-center justify-between gap-3 py-3 border-t border-white/5 cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
              <OnboardingIcon name="power" size="1rem" />
            </div>
            <span className="text-base text-neutral-200">Open at login</span>
          </div>
          <span className="block text-sm text-neutral-600 mt-0.5 leading-snug pl-[48px]">
            Start Ayati when you sign in to this Mac (you can change this later).
          </span>
        </div>
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={data.launchOnStartup}
            onChange={(e) => updateData({ launchOnStartup: e.target.checked })}
            className="sr-only peer"
            aria-label="Open Ayati at login"
          />
          <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:bg-[#67E0A3] transition-colors" />
          <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
        </div>
      </label>
    </div>
  );
};
