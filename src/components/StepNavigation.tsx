'use client';

import { useApp } from '@/context/AppContext';
import { STEPS } from '@/types';

export default function StepNavigation() {
  const { currentStep, setCurrentStep, canProceedToStep } = useApp();

  const currentStepInfo = STEPS.find(s => s.number === currentStep);
  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < 5 && canProceedToStep(currentStep + 1);

  return (
    <div className="border-t border-border bg-secondary p-4 flex justify-between items-center">
      <button
        onClick={() => setCurrentStep(currentStep - 1)}
        disabled={!canGoBack}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          canGoBack
            ? 'bg-border text-foreground hover:bg-secondary-hover'
            : 'bg-border/50 text-muted cursor-not-allowed'
        }`}
      >
        ← 上一步
      </button>

      <div className="text-sm text-muted">
        步骤 {currentStep} / 5
      </div>

      <button
        onClick={() => setCurrentStep(currentStep + 1)}
        disabled={!canGoNext}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          canGoNext
            ? 'bg-primary text-background hover:bg-primary-hover'
            : 'bg-primary/30 text-background/50 cursor-not-allowed'
        }`}
      >
        下一步 →
      </button>
    </div>
  );
}
