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

type Step = 'welcome' | 'hotkeys' | 'watch' | 'complete';

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
    <div className="w-full h-full bg-[#0f0f0f] relative flex flex-col overflow-hidden">
      {/* Minimal header — matches assistant tab style per BRAND_GUIDELINES.md */}
      <div className="drag-region h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#0f0f0f]">
        <span className="text-sm font-medium tracking-tight text-white">Ayati Setup</span>
        <div className="flex items-center gap-1.5 no-drag">
          <button
            className="text-neutral-500 hover:text-white transition-colors flex items-center justify-center w-6 h-6"
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <OnboardingIcon name="minus" size="1rem" />
          </button>
          <button
            className="text-neutral-500 hover:text-white transition-colors flex items-center justify-center w-6 h-6"
            onClick={handleSkip}
            aria-label="Close setup"
          >
            <OnboardingIcon name="x" size="1rem" />
          </button>
        </div>
      </div>

      {/* Step content */}
      <div className="no-drag onboarding-scroll flex-1 overflow-y-auto scrollbar-hide relative w-full">
        <div className="min-h-full flex flex-col">
          {renderStep()}
        </div>
      </div>

      {/* Navigation footer — text links, no containers per brand guidelines */}
      <div className="no-drag border-t border-white/5 bg-[#0f0f0f] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-[80px]">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isCompleting}
                className={`text-base transition-colors ${
                  isCompleting
                    ? 'text-neutral-700 cursor-not-allowed'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="text-xs text-neutral-600">
            {currentStepIndex + 1} of {STEP_ORDER.length}
          </div>
          <div className="min-w-[80px] flex justify-end">
            <button
              onClick={handleNextClick}
              disabled={isCompleting}
              type="button"
              className={`text-base transition-colors flex items-center gap-1.5 ${
                isCompleting
                  ? 'text-neutral-700 cursor-not-allowed'
                  : 'text-[#67E0A3] hover:text-[#7CF0BD]'
              }`}
            >
              {isCompleting && (
                <OnboardingIcon name="spinner" size="0.875rem" className="animate-spin" />
              )}
              {getNextButtonText()}
              {!isCompleting && currentStep !== 'complete' && (
                <OnboardingIcon name="chevron-right" size="1rem" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
