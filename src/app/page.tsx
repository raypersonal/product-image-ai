'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import AnalysisPanel from '@/components/AnalysisPanel';
import SceneWorkbench from '@/components/scene/SceneWorkbench';
import VideoWorkbench from '@/components/video/VideoWorkbench';
import { VideoSourceImage, VideoProductInfo } from '@/components/video/VideoWorkbench';

type AppMode = 'batch' | 'scene' | 'video';

// 场景工作台到视频工作台的转入数据
interface VideoTransferData {
  image: VideoSourceImage;
  productInfo: VideoProductInfo;
  sceneTags: string[];
}

export default function Home() {
  const [activeMode, setActiveMode] = useState<AppMode>('batch');
  const [videoTransferData, setVideoTransferData] = useState<VideoTransferData | null>(null);

  // 从场景工作台转入视频工作台
  const handleTransferToVideo = useCallback((data: VideoTransferData) => {
    setVideoTransferData(data);
    setActiveMode('video');
  }, []);

  // 清除转入数据
  const handleClearVideoTransfer = useCallback(() => {
    setVideoTransferData(null);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Tab Navigation */}
      <div className="flex-shrink-0 bg-[#0d1117] border-b border-gray-700">
        <div className="flex items-center justify-center gap-4 p-3">
          <button
            onClick={() => setActiveMode('batch')}
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
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
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
              activeMode === 'scene'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-2">🎨</span>
            场景工作台
          </button>
          <button
            onClick={() => setActiveMode('video')}
            className={`px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
              activeMode === 'video'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-2">🎬</span>
            视频工作台
          </button>
        </div>
      </div>

      {/* Content Area - 使用 display 切换而非条件渲染，保留组件状态 */}
      <div className="flex-1 overflow-hidden relative">
        {/* 批量生成模式 */}
        <div
          className={`flex h-full absolute inset-0 ${
            activeMode === 'batch' ? 'visible' : 'invisible pointer-events-none'
          }`}
          style={{ display: activeMode === 'batch' ? 'flex' : 'none' }}
        >
          <Sidebar />
          <MainContent />
          <AnalysisPanel />
        </div>

        {/* 场景工作台模式 */}
        <div
          className={`h-full absolute inset-0 ${
            activeMode === 'scene' ? 'visible' : 'invisible pointer-events-none'
          }`}
          style={{ display: activeMode === 'scene' ? 'block' : 'none' }}
        >
          <SceneWorkbench onTransferToVideo={handleTransferToVideo} />
        </div>

        {/* 视频工作台模式 */}
        <div
          className={`h-full absolute inset-0 ${
            activeMode === 'video' ? 'visible' : 'invisible pointer-events-none'
          }`}
          style={{ display: activeMode === 'video' ? 'block' : 'none' }}
        >
          <VideoWorkbench
            transferData={videoTransferData}
            onClearTransfer={handleClearVideoTransfer}
          />
        </div>
      </div>
    </div>
  );
}
