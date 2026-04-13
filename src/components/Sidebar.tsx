'use client';

import { useApp } from '@/context/AppContext';
import { STEPS } from '@/types';
import Link from 'next/link';

export default function Sidebar() {
  const { currentStep, setCurrentStep, canProceedToStep } = useApp();

  return (
    <aside className="w-[240px] h-screen bg-secondary flex flex-col border-r border-border">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-border-subtle">
        <h1 className="text-heading-md text-foreground tracking-tight">产品图AI生成</h1>
      </div>

      {/* Steps Navigation */}
      <nav className="flex-1 p-2 mt-2">
        <ul className="space-y-0.5">
          {STEPS.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const canAccess = canProceedToStep(step.number) || step.number <= currentStep;

            return (
              <li key={step.number}>
                <button
                  onClick={() => canAccess && setCurrentStep(step.number)}
                  disabled={!canAccess}
                  className={`w-full text-left px-3 py-2 rounded-control transition-colors text-body-sm ${
                    isActive
                      ? 'bg-accent-subtle text-foreground'
                      : isCompleted
                      ? 'text-foreground hover:bg-[rgba(255,255,255,0.05)]'
                      : canAccess
                      ? 'text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground'
                      : 'text-text-disabled cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-caption font-medium ${
                        isActive
                          ? 'bg-primary text-white'
                          : isCompleted
                          ? 'bg-primary/40 text-white'
                          : 'bg-[rgba(255,255,255,0.08)] text-muted'
                      }`}
                    >
                      {isCompleted ? '✓' : step.number}
                    </span>
                    <span className="font-medium">{step.title}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings Link */}
      <div className="p-2 border-t border-border-subtle">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] rounded-control transition-colors text-body-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>API 配置</span>
        </Link>
      </div>
    </aside>
  );
}
