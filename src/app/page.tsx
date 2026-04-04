'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import AnalysisPanel from '@/components/AnalysisPanel';
import SceneWorkbench from '@/components/scene/SceneWorkbench';

type AppMode = 'batch' | 'scene';

export default function Home() {
  const [activeMode, setActiveMode] = useState<AppMode>('batch');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Tab Navigation */}
      <div className="flex-shrink-0 bg-[#0d1117] border-b border-border">
        <div className="flex items-center justify-center gap-2 p-2">
          <button
            onClick={() => setActiveMode('batch')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeMode === 'batch'
                ? 'bg-primary/15 text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <span className="mr-2">📦</span>
            批量生成
          </button>
          <button
            onClick={() => setActiveMode('scene')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeMode === 'scene'
                ? 'bg-primary/15 text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <span className="mr-2">🎨</span>
            场景工作台
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeMode === 'batch' ? (
          <div className="flex h-full">
            <Sidebar />
            <MainContent />
            <AnalysisPanel />
          </div>
        ) : (
          <SceneWorkbench />
        )}
      </div>
    </div>
  );
}
