'use client';

import { useApp } from '@/context/AppContext';
import { STEPS } from '@/types';
import Link from 'next/link';

export default function Sidebar() {
  const { currentStep, setCurrentStep, canProceedToStep } = useApp();

  return (
    <aside className="w-[220px] h-screen bg-secondary flex flex-col border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-primary">🎨 产品图AI生成</h1>
        <p className="text-xs text-muted mt-1">跨境电商产品图工具</p>
      </div>

      {/* Steps Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {STEPS.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const canAccess = canProceedToStep(step.number) || step.number <= currentStep;

            return (
              <li key={step.number}>
                <button
                  onClick={() => canAccess && setCurrentStep(step.number)}
                  disabled={!canAccess}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/20 border border-primary text-primary'
                      : isCompleted
                      ? 'bg-secondary-hover text-foreground hover:bg-border'
                      : canAccess
                      ? 'text-muted hover:bg-secondary-hover hover:text-foreground'
                      : 'text-muted/50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive
                          ? 'bg-primary text-background'
                          : isCompleted
                          ? 'bg-primary/50 text-white'
                          : 'bg-border text-muted'
                      }`}
                    >
                      {isCompleted ? '✓' : step.number}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{step.title}</div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings Link */}
      <div className="p-3 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-muted hover:text-foreground hover:bg-secondary-hover rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm">API 配置</span>
        </Link>
      </div>
    </aside>
  );
}
