import type { FC } from 'react';
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
}

export const WelcomeStep: FC<Props> = () => {
  return (
    <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-4 min-h-0">
      <div className="mb-4 flex items-center justify-center sprite-pet-root">
        <SpritePet appearanceId="ayah" clip="idle" />
      </div>

      <div className="text-center space-y-1.5 max-w-[420px] mb-7">
        <h1 className="brand-display text-3xl font-semibold text-white leading-tight text-balance">
          Welcome to Ayati
        </h1>
        <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
          Ayati keeps the Quran within reach while you work. After a
          few days, the question you land on is: how did I ever work without this?
        </p>
      </div>

      {/* Feature preview — containerless, border-divided, matching assistant settings style */}
      <div className="w-full max-w-[400px] divide-y divide-white/5 border-t border-white/5">
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="chat" size="1rem" />
          </div>
          <div className="min-w-0 text-left">
            <span className="block text-base text-neutral-200">Quran reminders</span>
            <span className="block text-xs text-neutral-600 mt-0.5 leading-snug">
              Timely reflections and verses throughout your day.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="globe" size="1rem" />
          </div>
          <div className="min-w-0 text-left">
            <span className="block text-base text-neutral-200">Prayer times</span>
            <span className="block text-xs text-neutral-600 mt-0.5 leading-snug">
              Accurate schedules and reminders for your location.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="check" size="1rem" />
          </div>
          <div className="min-w-0 text-left">
            <span className="block text-base text-neutral-200">To-do list</span>
            <span className="block text-xs text-neutral-600 mt-0.5 leading-snug">
              Track tasks with due dates, priorities, and reminders.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#67E0A3]/10 flex items-center justify-center text-[#67E0A3] shrink-0">
            <OnboardingIcon name="clock" size="1rem" />
          </div>
          <div className="min-w-0 text-left">
            <span className="block text-base text-neutral-200">Pomodoro focus</span>
            <span className="block text-xs text-neutral-600 mt-0.5 leading-snug">
              Structured focus sessions that respect your prayer breaks.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
