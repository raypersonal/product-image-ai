'use client';

import { useApp } from '@/context/AppContext';

export default function StepNavigation() {
  const { currentStep, setCurrentStep, canProceedToStep } = useApp();

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < 5 && canProceedToStep(currentStep + 1);

  return (
    <div className="border-t border-border bg-secondary px-4 py-3 flex justify-between items-center">
      <button
        onClick={() => setCurrentStep(currentStep - 1)}
        disabled={!canGoBack}
        className={`px-4 py-[7px] rounded-control text-body font-medium transition-colors ${
          canGoBack
            ? 'text-foreground border border-border hover:bg-[rgba(255,255,255,0.06)]'
            : 'text-text-tertiary border border-border-subtle cursor-not-allowed'
        }`}
      >
        ← 上一步
      </button>

      <div className="text-body-sm text-muted">
        步骤 {currentStep} / 5
      </div>

      <button
        onClick={() => setCurrentStep(currentStep + 1)}
        disabled={!canGoNext}
        className={`px-4 py-[7px] rounded-control text-body font-medium transition-colors ${
          canGoNext
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'bg-primary/30 text-white/40 cursor-not-allowed'
        }`}
      >
        下一步 →
      </button>
    </div>
  );
}
