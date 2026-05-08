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
    ? 'Context awareness is off.'
    : data.watchWindowTitles
      ? 'Using active app and window titles.'
      : 'Using active application only.';

  return (
    <div className="onboarding-complete-root">
      <div className="mb-8 relative">
        <div className="relative p-1 rounded-[46px] bg-gradient-to-b from-white to-[#7CF0BD]/20 border border-[#67E0A3]/15">
          <div className="h-[150px] w-[150px] rounded-[42px] overflow-hidden bg-[#FAF9F6] flex items-center justify-center lobster-container sprite-pet-root scale-110">
            <SpritePet appearanceId="ayah" clip="waving" />
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <p className="onboarding-kicker">Step 04 — Finish</p>
        <h2 className="brand-display text-[32px] font-semibold tracking-tight text-[#1a2a24] text-balance">
          You&apos;re all set
        </h2>
        <p className="brand-ui text-[16px] text-[#1a2a24]/60 max-w-[460px] mx-auto leading-relaxed font-medium">
          Ayati lives in your menu bar. Use your shortcuts anytime, and open the assistant when you want a pause
          for reflection.
        </p>
      </div>

      <div className="w-full bg-white border border-[#1a2a24]/[0.03] rounded-[40px] p-8 text-left mb-8 relative overflow-hidden">
        <h3 className="onboarding-kicker text-[#1a2a24]/40 tracking-[0.18em] mb-5">From this setup</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7CF0BD]/15 flex items-center justify-center text-[#67E0A3] shrink-0 mt-0.5">
              <OnboardingIcon name="command" size="1.125rem" />
            </div>
            <div>
              <div className="brand-display text-[13px] font-bold text-[#1a2a24]">Shortcuts</div>
              <p className="brand-ui text-[12px] text-[#1a2a24]/55 font-medium leading-snug mt-0.5">
                Open assistant:{' '}
                <code className="font-mono text-[11px] text-[#1a2a24]/80 bg-[#FAF9F6] px-1.5 py-0.5 rounded-md border border-[#1a2a24]/[0.06]">
                  {data.hotkeyOpenAssistant}
                </code>
                {' · '}
                Hide app:{' '}
                <code className="font-mono text-[11px] text-[#1a2a24]/80 bg-[#FAF9F6] px-1.5 py-0.5 rounded-md border border-[#1a2a24]/[0.06]">
                  {data.hotkeyHideApp}
                </code>
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0 mt-0.5">
              <OnboardingIcon name="window" size="1.125rem" />
            </div>
            <div>
              <div className="brand-display text-[13px] font-bold text-[#1a2a24]">Context</div>
              <p className="brand-ui text-[12px] text-[#1a2a24]/55 font-medium leading-snug mt-0.5">{contextSummary}</p>
            </div>
          </li>
        </ul>
      </div>

      <label className="w-full mb-8 flex items-center justify-between gap-4 rounded-[32px] bg-white border border-[#1a2a24]/[0.03] px-6 py-5 cursor-pointer transition-colors text-left">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="power" size="1.5rem" />
          </div>
          <div className="flex flex-col py-1 min-w-0">
            <span className="brand-display text-[15px] font-bold text-[#1a2a24]">Open at login</span>
            <span className="brand-ui text-[12px] text-[#1a2a24]/45 font-semibold tracking-tight leading-snug">
              Start Ayati when you sign in to this Mac (you can change this later).
            </span>
          </div>
        </div>
        <div className="relative scale-110 shrink-0">
          <input
            type="checkbox"
            checked={data.launchOnStartup}
            onChange={(e) => updateData({ launchOnStartup: e.target.checked })}
            className="sr-only peer"
            aria-label="Open Ayati at login"
          />
          <div className="w-12 h-7 bg-[#1a2a24]/[0.05] rounded-full peer peer-checked:bg-[#1a2a24] transition-colors" />
          <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
        </div>
      </label>
    </div>
  );
};
