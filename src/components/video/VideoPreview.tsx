'use client';

import { useRef, useEffect } from 'react';
import { GeneratedVideo, VideoSourceImage } from './VideoWorkbench';
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
  onSelectHistory: (video: GeneratedVideo) => void;
  onClearError: () => void;
}

function getProxiedVideoUrl(url: string): string {
  return url;
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
  onSelectHistory,
  onClearError,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 视频生成完成后自动播放
  useEffect(() => {
    if (currentVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideo]);

  const handleDownload = async () => {
    if (!currentVideo) return;
    try {
      const proxyUrl = getProxiedVideoUrl(currentVideo.videoUrl);
      const resp = await fetch(proxyUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${currentVideo.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

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
        <div className="p-3 bg-error/10 border border-error/25 rounded-control flex items-center justify-between">
          <span className="text-body-sm text-error">{error}</span>
          <button
            onClick={onClearError}
            className="text-error hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/* 生成按钮 */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !sourceImage}
        className="w-full py-3 bg-primary text-white rounded-control font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {getStatusText()}
          </>
        ) : (
          'Generate Video'
        )}
      </button>

      {/* 进度条 */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full h-[3px] bg-[rgba(255,255,255,0.08)] rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
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
        <span className="text-accent-text">免费试用</span>
        <span>|</span>
        <span>即梦AI 视频3.0</span>
        <span>|</span>
        <span>1080P</span>
      </div>

      {/* 视频预览区 */}
      <div className="aspect-video bg-surface rounded-card overflow-hidden border border-border">
        {currentVideo ? (
          <video
            ref={videoRef}
            src={getProxiedVideoUrl(currentVideo.videoUrl)}
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
            <p className="text-body-sm">上传图片后生成视频</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {currentVideo && (
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full py-[7px] bg-primary text-white rounded-control font-medium hover:bg-primary-hover transition-colors"
          >
            下载视频
          </button>
          <p className="text-xs text-center text-muted">
            提示：如下载失败，请右键视频 → 另存为
          </p>
        </div>
      )}

      {/* 当前视频信息 */}
      {currentVideo && (
        <div className="p-3 bg-surface rounded-control border border-border space-y-1">
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
          <h3 className="text-label text-foreground mb-2">历史记录</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.map((video, index) => (
              <div
                key={video.id}
                onClick={() => onSelectHistory(video)}
                className={`flex-shrink-0 w-24 cursor-pointer rounded-card overflow-hidden transition-colors ${
                  currentVideo?.id === video.id
                    ? 'border-2 border-primary'
                    : 'border border-border hover:border-border-strong'
                }`}
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={`Video ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-surface flex items-center justify-center text-muted text-caption">
                    Video
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
