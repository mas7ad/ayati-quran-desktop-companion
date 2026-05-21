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
    <div className="onboarding-step-root py-5">
      <div className="space-y-2 mb-6">
        <p className="onboarding-kicker">Shortcuts</p>
        <h2 className="onboarding-step-title">Keyboard shortcuts</h2>
        <p className="onboarding-step-lede">
          Set global shortcuts to open the assistant and to hide or show Ayati. You can change these later in
          settings.
        </p>
      </div>

      <div className="divide-y divide-white/5">
        <HotkeyInput
          label="Open Assistant"
          description="Open the full assistant panel"
          value={data.hotkeyOpenAssistant}
          onChange={(value) => updateData({ hotkeyOpenAssistant: value })}
        />
        <HotkeyInput
          label="Hide App"
          description="Hide or show all Ayati windows (same shortcut toggles)"
          value={data.hotkeyHideApp}
          onChange={(value) => updateData({ hotkeyHideApp: value })}
        />
      </div>

      <p className="mt-6 text-sm text-neutral-600 flex items-start gap-2 leading-snug">
        <OnboardingIcon name="mouse" size="1.125rem" className="text-neutral-500 shrink-0 mt-0.5" />
        Click a shortcut field, then press the combination you want. Click outside the field to leave recording
        without changing the shortcut.
      </p>
    </div>
  );
};
