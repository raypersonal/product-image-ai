'use client';

import { useApp } from '@/context/AppContext';
import {
  Step1ProductInfo,
  Step2Analysis,
  Step3Prompts,
  Step4Generate,
  Step5Download,
} from './steps';
import StepNavigation from './StepNavigation';

export default function MainContent() {
  const { currentStep } = useApp();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ProductInfo />;
      case 2:
        return <Step2Analysis />;
      case 3:
        return <Step3Prompts />;
      case 4:
        return <Step4Generate />;
      case 5:
        return <Step5Download />;
      default:
        return <Step1ProductInfo />;
    }
  };

  return (
    <main className="flex-1 h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {renderStep()}
      </div>
      <StepNavigation />
    </main>
  );
}
