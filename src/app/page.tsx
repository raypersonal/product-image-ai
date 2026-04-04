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
      <div className="flex-shrink-0 bg-[#0d1117] border-b border-gray-700">
        <div className="flex items-center justify-center gap-4 p-3">
          <button
            onClick={() => setActiveMode('batch')}
            className={`px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
              activeMode === 'batch'
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-2">📦</span>
            批量生成
          </button>
          <button
            onClick={() => setActiveMode('scene')}
            className={`px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
              activeMode === 'scene'
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800/50'
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
