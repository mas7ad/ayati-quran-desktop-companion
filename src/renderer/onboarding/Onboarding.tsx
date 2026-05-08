import { useState, useCallback } from 'react';
import { WelcomeStep } from './steps/WelcomeStep';
import { WatchStep } from './steps/WatchStep';
import { HotkeysStep } from './steps/HotkeysStep';
import { CompleteStep } from './steps/CompleteStep';
import { OnboardingIcon } from './OnboardingIcon';

export type WorkspaceType = 'ayati';

export interface OnboardingData {
  workspaceType: WorkspaceType;
  launchOnStartup: boolean;
  watchFolders: string[];
  watchActiveApp: boolean;
  watchWindowTitles: boolean;
  hotkeyOpenAssistant: string;
  hotkeyHideApp: string;
}

const INITIAL_DATA: OnboardingData = {
  workspaceType: 'ayati',
  launchOnStartup: true,
  watchFolders: [],
  watchActiveApp: false,
  watchWindowTitles: false,
  hotkeyOpenAssistant: 'CommandOrControl+Alt+.',
  hotkeyHideApp: 'CommandOrControl+Alt+,',
};

type Step = 'welcome' | 'watch' | 'hotkeys' | 'complete';

const STEP_ORDER: Step[] = ['welcome', 'hotkeys', 'watch', 'complete'];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isCompleting, setIsCompleting] = useState(false);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep, goToStep]);

  const handleSkip = useCallback(async () => {
    try {
      await window.ayati.onboardingSkip();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  }, []);

  const handleMinimize = useCallback(() => {
    window.ayati.onboardingMinimize();
  }, []);

  const handleMaximize = useCallback(() => {
    window.ayati.onboardingMaximize();
  }, []);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);

    try {
      await window.ayati.onboardingComplete({
        ...data,
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  }, [data]);

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    return false;
  };

  // Get next button text
  const getNextButtonText = () => {
    if (currentStep === 'welcome') return 'Get Started';
    if (currentStep === 'complete') {
      if (isCompleting) return 'Waking up…';
      return 'Open Ayati';
    }
    return 'Continue';
  };

  const handleNextClick = () => {
    if (currentStep === 'complete') {
      handleComplete();
    } else {
      goToNextStep();
    }
  };

  const renderStep = () => {
    const props = {
      data,
      updateData,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      onSkip: handleSkip,
    };

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...props} />;
      case 'watch':
        return <WatchStep {...props} />;
      case 'hotkeys':
        return <HotkeysStep {...props} />;
      case 'complete':
        return <CompleteStep {...props} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#FAF9F6] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
         style={{ boxShadow: '0 32px 64px -12px rgba(26, 42, 36, 0.12), 0 0 0 1px rgba(26, 42, 36, 0.05)' }}>

      {/* Top Bar (Draggable) - macOS window chrome — redesigned for premium feel */}
      <div className="drag-region h-14 flex items-center px-6 w-full z-50 select-none bg-white border-b border-[#1a2a24]/[0.05] shrink-0 relative">
        {/* Window Controls */}
        <div className="absolute left-6 flex items-center gap-2">
          <button
            className="no-drag w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff453a] transition-colors cursor-pointer shrink-0 border border-black/05"
            onClick={handleSkip}
            title="Close"
            aria-label="Close setup"
          />
          <button
            className="no-drag w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#e0a926] transition-colors cursor-pointer shrink-0 border border-black/05"
            onClick={handleMinimize}
            title="Minimize"
            aria-label="Minimize"
          />
          <button
            className="no-drag w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#20a134] transition-colors cursor-pointer shrink-0 border border-black/05"
            onClick={handleMaximize}
            title="Zoom"
            aria-label="Zoom"
          />
        </div>

        {/* Brand/Title */}
        <div className="flex-1 flex items-center justify-center">
          <span className="brand-display flex items-baseline gap-1.5 text-[13px] font-bold tracking-tight">
            <span className="text-[#1a2a24]">Ayati</span>
            <span className="text-[#67E0A3]">Setup Companion</span>
          </span>
        </div>

        {/* Step Progress Indicators */}
        <div className="absolute right-6 flex items-center gap-2">
          {STEP_ORDER.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-[background-color,width] duration-150 ease-out ${
                  isActive
                    ? 'bg-[#67E0A3] w-6'
                    : isCompleted
                    ? 'bg-[#AFF9C9] w-1.5'
                    : 'bg-[#1a2a24]/10 w-1.5'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Center Stage Content */}
      <div className="no-drag onboarding-scroll flex-1 overflow-y-auto scrollbar-hide relative w-full pb-20">
        <div className="min-h-full">
          {renderStep()}
        </div>
      </div>

      {/* Action Footer — solid bg, no backdrop-blur to avoid compositing cost */}
      <div className="no-drag h-[88px] absolute bottom-0 w-full flex items-center px-10 bg-[#FAF9F6] border-t border-[#1a2a24]/[0.05] z-50 select-none">
        <div className="flex w-full items-center gap-4">
          <div className="flex flex-1 justify-start min-h-[48px] items-center">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isCompleting}
                className={`brand-ui px-5 py-3 rounded-2xl text-sm font-semibold border transition-[background-color,color,border-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67E0A3]/80 ${
                  isCompleting
                    ? 'border-[#1a2a24]/[0.06] text-[#1a2a24]/25 cursor-not-allowed'
                    : 'border-[#1a2a24]/12 text-[#1a2a24]/75 hover:bg-[#1a2a24]/[0.04] hover:border-[#1a2a24]/18 active:scale-[0.98]'
                }`}
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-1 justify-end">
            <button
              onClick={handleNextClick}
              disabled={isNextDisabled() || isCompleting}
              type="button"
              className={`px-8 py-3.5 rounded-2xl text-sm font-semibold transition-[background-color,transform,box-shadow] duration-150 flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67E0A3]/80 ${
                isNextDisabled() || isCompleting
                  ? 'bg-[#1a2a24]/10 text-[#1a2a24]/30 cursor-not-allowed'
                  : currentStep === 'welcome'
                  ? 'brand-display bg-[#67E0A3] text-[#1a2a24] hover:bg-[#7CF0BD] active:scale-[0.98]'
                  : 'bg-[#1a2a24] text-[#FAF9F6] hover:bg-[#2a3a34] active:scale-[0.98]'
              }`}
            >
              {isCompleting && (
                <OnboardingIcon name="spinner" size="1.125rem" className="animate-spin" />
              )}
              {getNextButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
