import { useState } from 'react';
import type { OnboardingData } from '../Onboarding';
import { OnboardingIcon } from '../OnboardingIcon';

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export const WatchStep: React.FC<Props> = ({ data, updateData }) => {
  const [showPermissionHint, setShowPermissionHint] = useState(false);

  const requestAccessibilityPermission = () => {
    void window.ayati.checkAccessibilityPermission(true).catch((error) => {
      console.error('Failed to request accessibility permission:', error);
    });
  };

  const handleWatchActiveAppChange = (enabled: boolean) => {
    if (enabled) {
      setShowPermissionHint(true);
      updateData({ watchActiveApp: true });
      requestAccessibilityPermission();
    } else {
      updateData({ watchActiveApp: false, watchWindowTitles: false });
      setShowPermissionHint(false);
    }
  };

  const handleWatchWindowTitlesChange = (enabled: boolean) => {
    if (enabled && !data.watchActiveApp) {
      setShowPermissionHint(true);
      updateData({ watchActiveApp: true, watchWindowTitles: true });
      requestAccessibilityPermission();
    } else {
      updateData({ watchWindowTitles: enabled });
    }
  };

  return (
    <div className="onboarding-step-column">
      <div className="space-y-3 mb-10 text-left">
        <p className="onboarding-kicker">Step 03 — Context</p>
        <h2 className="onboarding-step-title">Optional context awareness</h2>
        <p className="onboarding-step-lede">
          This step is optional. When enabled, Ayati can read which app is in front (and optionally window titles)
          so reflections can feel more grounded in what you are doing. Nothing leaves your device.
        </p>
      </div>

      {/* Permission notice */}
      <div className="bg-[#67E0A3]/[0.05] border border-[#67E0A3]/15 rounded-[32px] p-5 mb-10 group hover:bg-[#67E0A3]/10 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="warning" size="1.25rem" />
          </div>
          <div className="brand-ui text-[13px] text-[#1a2a24]/60 leading-relaxed font-medium py-1">
            These options need{' '}
            <span className="text-[#1a2a24] font-bold underline decoration-[#67E0A3]/30">Accessibility permission</span>
            {' '}
            on macOS. Turning one on opens System Settings so you can approve Ayati.
          </div>
        </div>
      </div>

      {showPermissionHint && (
        <div className="bg-[#67E0A3] border border-white/20 rounded-[32px] p-5 mb-10">
          <div className="flex items-start gap-4 text-white">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <OnboardingIcon name="check" size="1.25rem" />
            </div>
            <div className="brand-ui text-[13px] leading-relaxed font-semibold py-1">
              We asked for access. In System Settings → Privacy & Security → Accessibility, turn Ayati{' '}
              <span className="underline decoration-white/30">on</span> if you want these features.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 rounded-[36px] bg-white border border-[#1a2a24]/[0.03]">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3]">
              <OnboardingIcon name="window" size="1.5rem" />
            </div>
            <div>
              <div className="brand-display text-[15px] font-bold text-[#1a2a24]">Active application</div>
              <div className="brand-ui text-[12px] text-[#1a2a24]/45 mt-0.5 font-semibold leading-snug">
                Know which app is focused (no window titles).
              </div>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative scale-110">
              <input
                type="checkbox"
                aria-label="Active application"
                className="sr-only peer"
                checked={data.watchActiveApp}
                onChange={(e) => handleWatchActiveAppChange(e.target.checked)}
              />
              <div className="w-12 h-7 bg-[#1a2a24]/[0.05] rounded-full peer peer-checked:bg-[#1a2a24] transition-colors" />
              <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between p-5 rounded-[36px] bg-white border border-[#1a2a24]/[0.03]">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-[#7CF0BD]/15 flex items-center justify-center text-[#67E0A3]">
              <OnboardingIcon name="chat" size="1.5rem" />
            </div>
            <div>
              <div className="brand-display text-[15px] font-bold text-[#1a2a24]">Window titles</div>
              <div className="brand-ui text-[12px] text-[#1a2a24]/45 mt-0.5 font-semibold leading-snug">
                Requires active application. Adds the front window title for finer context.
              </div>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative scale-110">
              <input
                type="checkbox"
                aria-label="Window titles"
                className="sr-only peer"
                checked={data.watchWindowTitles}
                onChange={(e) => handleWatchWindowTitlesChange(e.target.checked)}
              />
              <div className="w-12 h-7 bg-[#1a2a24]/[0.05] rounded-full peer peer-checked:bg-[#1a2a24] transition-colors" />
              <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
