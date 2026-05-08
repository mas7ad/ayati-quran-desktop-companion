import type { FC } from 'react';
import type { OnboardingData } from '../Onboarding';

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
    <div className="onboarding-welcome-root">
      <div className="mb-8 relative">
        <div className="relative p-1 rounded-[42px] bg-gradient-to-b from-white to-[#7CF0BD]/20 border border-[#67E0A3]/15">
          <div className="h-40 w-40 rounded-[38px] overflow-hidden bg-white/50 flex items-center justify-center lobster-container sprite-pet-root">
            <SpritePet appearanceId="ayah" clip="idle" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="onboarding-kicker">Step 01 — Welcome</p>
        <h1 className="brand-display text-[40px] font-semibold tracking-tight text-[#1a2a24] leading-[1.1] text-balance">
          Welcome to Ayati
        </h1>
        <p className="brand-ui text-[16px] text-[#1a2a24]/60 max-w-[460px] mx-auto leading-relaxed font-medium">
          Ayati keeps the Quran within reach while you work. After a
          few days, the question you land on is: how did I ever work without this?
        </p>
      </div>
    </div>
  );
};
