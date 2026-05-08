import type { OnboardingData } from '../Onboarding';
import { OnboardingIcon } from '../OnboardingIcon';
import { HotkeyInput } from '../../components/HotkeyInput';

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export const HotkeysStep: React.FC<Props> = ({ data, updateData }) => {
  return (
    <div className="onboarding-step-column">
      <div className="space-y-3 mb-10 text-left">
        <p className="onboarding-kicker">Step 02 — Shortcuts</p>
        <h2 className="onboarding-step-title">Keyboard shortcuts</h2>
        <p className="onboarding-step-lede">
          Set global shortcuts to open the assistant and to hide or show Ayati. You can change these later in
          settings.
        </p>
      </div>

      <div className="overflow-hidden rounded-[36px] border border-[#1a2a24]/[0.08] bg-white shadow-[0_1px_0_rgba(26,42,36,0.04)] divide-y divide-[#1a2a24]/[0.06]">
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <HotkeyInput
            label="Open Assistant"
            description="Open the full assistant panel"
            value={data.hotkeyOpenAssistant}
            onChange={(value) => updateData({ hotkeyOpenAssistant: value })}
            theme="setupInverted"
          />
        </div>
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <HotkeyInput
            label="Hide App"
            description="Hide or show all Ayati windows (same shortcut toggles)"
            value={data.hotkeyHideApp}
            onChange={(value) => updateData({ hotkeyHideApp: value })}
            theme="setupInverted"
          />
        </div>
      </div>

      <div className="mt-8 px-5 py-4 bg-[#67E0A3]/[0.05] border border-[#67E0A3]/15 rounded-[24px]">
        <p className="brand-ui text-xs text-[#1a2a24]/55 flex items-center gap-3 font-medium leading-snug">
          <OnboardingIcon name="mouse" size="1.25rem" className="text-[#67E0A3] shrink-0" />
          Click a shortcut field, then press the combination you want. Click outside the field to leave recording
          without changing the shortcut.
        </p>
      </div>
    </div>
  );
};
