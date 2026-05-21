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
    <div className="onboarding-step-root py-5">
      <div className="space-y-2 mb-6">
        <p className="onboarding-kicker">Context</p>
        <h2 className="onboarding-step-title">Optional context awareness</h2>
        <p className="onboarding-step-lede">
          This step is optional. When enabled, Ayati can read which app is in front (and optionally window titles)
          so reflections can feel more grounded in what you are doing. Nothing leaves your device.
        </p>
      </div>

      {/* Permission notice — flat text, no container */}
      <p className="text-sm text-neutral-600 flex items-start gap-2 mb-5 leading-snug">
        <OnboardingIcon name="warning" size="1.125rem" className="text-neutral-500 shrink-0 mt-0.5" />
        These options need Accessibility permission on macOS. Turning one on opens System Settings so you can
        approve Ayati.
      </p>

      {showPermissionHint && (
        <p className="text-sm text-[#AFF9C9] flex items-start gap-2 mb-5 leading-snug">
          <OnboardingIcon name="check" size="1.125rem" className="text-[#67E0A3] shrink-0 mt-0.5" />
          We asked for access. In System Settings → Privacy & Security → Accessibility, turn Ayati on if you want
          these features.
        </p>
      )}

      <div className="divide-y divide-white/5">
        {/* Active application toggle */}
        <div className="flex items-center justify-between py-4 gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-base text-neutral-200">Active application</span>
            <span className="block text-sm text-neutral-600 mt-0.5 leading-snug">
              Know which app is focused (no window titles).
            </span>
          </div>
          <label className="flex items-center cursor-pointer shrink-0">
            <div className="relative">
              <input
                type="checkbox"
                aria-label="Active application"
                className="sr-only peer"
                checked={data.watchActiveApp}
                onChange={(e) => handleWatchActiveAppChange(e.target.checked)}
              />
              <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:bg-[#67E0A3] transition-colors" />
              <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Window titles toggle */}
        <div className="flex items-center justify-between py-4 gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-base text-neutral-200">Window titles</span>
            <span className="block text-sm text-neutral-600 mt-0.5 leading-snug">
              Adds the front window title for finer context.
            </span>
          </div>
          <label className="flex items-center cursor-pointer shrink-0">
            <div className="relative">
              <input
                type="checkbox"
                aria-label="Window titles"
                className="sr-only peer"
                checked={data.watchWindowTitles}
                onChange={(e) => handleWatchWindowTitlesChange(e.target.checked)}
              />
              <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:bg-[#67E0A3] transition-colors" />
              <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
