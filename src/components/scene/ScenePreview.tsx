'use client';

import { useState } from 'react';
import { GeneratedSceneImage } from './SceneWorkbench';

interface ScenePreviewProps {
  // 生成状态
  isGenerating: boolean;
  generationProgress: number; // 0-100
  // 当前图片
  currentImage: GeneratedSceneImage | null;
  // 历史记录
  history: GeneratedSceneImage[];
  // 提示词（用于显示）
  prompt: string;
  // 回调
  onGenerate: () => void;
  onRegenerate: () => void;
  onDownload: (image: GeneratedSceneImage) => void;
  onSelectHistory: (image: GeneratedSceneImage) => void;
  onReplaceToMainFlow: (image: GeneratedSceneImage) => void;
  // 配置信息
  outputSize: string;
  platform: 'dashscope' | 'openrouter';
  imageModel: string;
}

export default function ScenePreview({
  isGenerating,
  generationProgress,
  currentImage,
  history,
  prompt,
  onGenerate,
  onRegenerate,
  onDownload,
  onSelectHistory,
  onReplaceToMainFlow,
  outputSize,
  platform,
  imageModel,
}: ScenePreviewProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 计算费用预估
  const getEstimatedCost = () => {
    if (platform === 'dashscope') return '免费额度';
    if (imageModel.includes('schnell')) return '$0.003';
    if (imageModel.includes('pro')) return '$0.04';
    return '$0.02';
  };

  // 下载图片
  const handleDownload = async (image: GeneratedSceneImage) => {
    try {
      const response = await fetch(image.imageData);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scene_${image.id}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onDownload(image);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: 新窗口打开
      window.open(image.imageData, '_blank');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 生成按钮 */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt}
        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">⏳</span>
            生成中... {generationProgress > 0 ? `${generationProgress}%` : ''}
          </>
        ) : (
          <>
            <span>🎨</span>
            生成场景图
          </>
        )}
      </button>

      {/* 生成进度条 */}
      {isGenerating && (
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(generationProgress, 5)}%` }}
          />
        </div>
      )}

      {/* 状态提示 */}
      {!prompt && !isGenerating && (
        <div className="text-center text-sm text-muted py-2">
          请先选择场景标签或输入提示词
        </div>
      )}

      {/* 配置信息 */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted">
        <span>尺寸: {outputSize}</span>
        <span>|</span>
        <span>费用: {getEstimatedCost()}</span>
        <span>|</span>
        <span>{platform === 'dashscope' ? '百炼' : 'OpenRouter'}</span>
      </div>

      {/* 预览区 */}
      <div
        className={`relative aspect-square bg-secondary rounded-xl border-2 transition-colors overflow-hidden ${
          currentImage ? 'border-green-600/30' : 'border-border'
        }`}
      >
        {currentImage ? (
          <>
            <img
              src={currentImage.imageData}
              alt="Generated scene"
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setPreviewImage(currentImage.imageData)}
            />
            {/* 点击放大提示 */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
              点击放大
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted p-8">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-sm text-center">生成的场景图将显示在这里</p>
            <p className="text-xs mt-2 text-center text-muted/70">
              选择场景标签 → 生成提示词 → 点击生成
            </p>
          </div>
        )}
      </div>

      {/* 当前图片的操作按钮 */}
      {currentImage && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="py-2.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            🔄 重新生成
          </button>
          <button
            onClick={() => handleDownload(currentImage)}
            className="py-2.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary-hover transition-colors flex items-center justify-center gap-1"
          >
            📥 下载
          </button>
          <button
            onClick={() => onReplaceToMainFlow(currentImage)}
            className="py-2.5 bg-green-600/20 text-green-500 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center justify-center gap-1"
          >
            ✅ 用于主流程
          </button>
        </div>
      )}

      {/* 当前图片的提示词 */}
      {currentImage && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">使用的提示词:</span>
            <button
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="text-xs text-primary hover:underline"
            >
              {showFullPrompt ? '收起' : '展开'}
            </button>
          </div>
          <p className={`text-xs text-foreground ${showFullPrompt ? '' : 'line-clamp-2'}`}>
            {currentImage.prompt}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted">
            <span>{currentImage.model}</span>
            <span>•</span>
            <span>{currentImage.size}</span>
            <span>•</span>
            <span>{new Date(currentImage.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* 历史记录区 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>📜</span>
            历史记录
            {history.length > 0 && (
              <span className="text-muted">({history.length}/20)</span>
            )}
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="p-4 bg-secondary/30 rounded-lg text-center text-sm text-muted">
            生成的图片会保存在这里（最多20张）
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {history.slice(0, 20).map((img) => (
              <div
                key={img.id}
                onClick={() => onSelectHistory(img)}
                className={`relative aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-green-500 ${
                  currentImage?.id === img.id ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <img
                  src={img.imageData}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* 序号 */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
                  #{history.indexOf(img) + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-foreground hover:bg-secondary-hover text-lg"
            >
              ✕
            </button>
            {currentImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(currentImage);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500"
                >
                  📥 下载图片
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
