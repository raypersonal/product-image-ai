'use client';

import { useRef, useEffect } from 'react';
import { GeneratedVideo, VideoSourceImage } from './VideoWorkbench';
import SavePathSelector from '@/components/SavePathSelector';
import { getCameraMotionById } from '@/lib/video/videoPromptGenerator';

interface VideoPreviewProps {
  isGenerating: boolean;
  generationStatus: 'idle' | 'submitting' | 'outpainting' | 'processing' | 'success' | 'failed';
  generationProgress: number;
  currentVideo: GeneratedVideo | null;
  history: GeneratedVideo[];
  sourceImage: VideoSourceImage | null;
  error: string | null;
  onGenerate: () => void;
  onDownload: (video: GeneratedVideo) => void;
  onSelectHistory: (video: GeneratedVideo) => void;
  isSaving: boolean;
  saveError: string | null;
  onSaveToLocal: (basePath: string) => void;
  onClearError: () => void;
}

export default function VideoPreview({
  isGenerating,
  generationStatus,
  generationProgress,
  currentVideo,
  history,
  sourceImage,
  error,
  onGenerate,
  onDownload,
  onSelectHistory,
  isSaving,
  saveError,
  onSaveToLocal,
  onClearError,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 视频生成完成后自动播放
  useEffect(() => {
    if (currentVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideo]);

  // 获取状态文本
  const getStatusText = () => {
    switch (generationStatus) {
      case 'outpainting':
        return '正在扩展图片...';
      case 'submitting':
        return '正在提交任务...';
      case 'processing':
        return '视频生成中...（预计30秒-2分钟）';
      case 'success':
        return '生成完成！';
      case 'failed':
        return '生成失败';
      default:
        return '';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 错��提示 */}
      {error && (
        <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* 生成按钮 */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !sourceImage}
        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">⏳</span>
            {getStatusText()}
          </>
        ) : (
          <>
            <span>🎬</span>
            生成视频
          </>
        )}
      </button>

      {/* 进度条 */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(generationProgress, 5)}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted">
            {generationStatus === 'submitting' && '提交中...'}
            {generationStatus === 'processing' && '视频生成中，请耐心等待...'}
          </p>
        </div>
      )}

      {/* 费用提示 */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted">
        <span className="text-green-400">🆓 免费试用</span>
        <span>|</span>
        <span>即梦AI 视频3.0</span>
        <span>|</span>
        <span>1080P</span>
      </div>

      {/* 视频预览区 */}
      <div className="aspect-video bg-secondary rounded-xl overflow-hidden border-2 border-border">
        {currentVideo ? (
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            controls
            loop
            className="w-full h-full object-contain"
            poster={currentVideo.thumbnailUrl}
          />
        ) : sourceImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <img
              src={sourceImage.base64}
              alt="Source"
              className="max-w-full max-h-[70%] object-contain rounded-lg opacity-50"
            />
            <p className="mt-3 text-sm text-muted">首帧预览</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
            <span className="text-5xl mb-3">🎬</span>
            <p>上传图片��生成视频</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {currentVideo && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onDownload(currentVideo)}
            className="py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-1"
          >
            📥 下载视频
          </button>
          <SavePathSelector
            onSave={onSaveToLocal}
            isSaving={isSaving}
            buttonText="💾 保存到本地"
            showChangeButton={false}
          />
        </div>
      )}

      {/* 保存错误提示 */}
      {saveError && (
        <div className="p-2 bg-red-600/20 rounded-lg text-sm text-red-400 text-center">
          {saveError}
        </div>
      )}

      {/* 当前视频信息 */}
      {currentVideo && (
        <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>运镜：{getCameraMotionById(currentVideo.cameraMotion)?.name || currentVideo.cameraMotion}</span>
            <span>|</span>
            <span>{currentVideo.duration}秒</span>
            <span>|</span>
            <span>{new Date(currentVideo.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
            <span>📜</span>
            历史记录
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.map((video, index) => (
              <div
                key={video.id}
                onClick={() => onSelectHistory(video)}
                className={`flex-shrink-0 w-24 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  currentVideo?.id === video.id
                    ? 'border-purple-500'
                    : 'border-transparent hover:border-purple-500/50'
                }`}
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={`Video ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-secondary flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                )}
                <div className="p-1 bg-secondary text-center">
                  <span className="text-[10px] text-muted">
                    {video.duration}秒
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
