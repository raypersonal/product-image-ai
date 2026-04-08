'use client';

import { useState } from 'react';
import { GeneratedSceneImage } from './SceneWorkbench';
import SavePathSelector, { getSavedPath } from '@/components/SavePathSelector';
import ReplaceToMainFlowModal from './ReplaceToMainFlowModal';

// 历史记录项组件 - 支持悬停下载和信息展示
function HistoryItem({
  image,
  index,
  isSelected,
  onSelect,
  onDownload,
  onPreview,
}: {
  image: GeneratedSceneImage;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onPreview: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // 截取 prompt 前30个字符
  const shortPrompt = image.prompt.length > 30
    ? image.prompt.substring(0, 30) + '...'
    : image.prompt;

  return (
    <div
      className={`group relative aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-green-500' : 'hover:ring-2 hover:ring-green-500/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <img
        src={image.imageData}
        alt=""
        className="w-full h-full object-cover"
      />

      {/* 序号标签 */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
        #{index + 1}
      </div>

      {/* 悬停遮罩层 */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 p-1">
          {/* 操作按钮 */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs text-white transition-colors"
              title="放大预览"
            >
              🔍
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white transition-colors"
              title="下载图片"
            >
              📥
            </button>
          </div>

          {/* 简要信息 */}
          <div className="text-[10px] text-white/80 text-center mt-1 px-1 line-clamp-2">
            {shortPrompt}
          </div>

          {/* 标签 */}
          {image.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
              {image.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-1 py-0.5 bg-green-600/50 rounded text-[8px] text-white">
                  {tag}
                </span>
              ))}
              {image.tags.length > 2 && (
                <span className="text-[8px] text-white/60">+{image.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SaveResult {
  outputPath: string;
  folderName: string;
  successCount: number;
  failedCount: number;
  totalImages: number;
}

interface ScenePreviewProps {
  // 生成状态
  isGenerating: boolean;
  generationProgress: number; // 0-100
  // 当前图片
  currentImage: GeneratedSceneImage | null;
  currentBatchImages?: GeneratedSceneImage[]; // 当前批次生成的图片
  // 历史记录
  history: GeneratedSceneImage[];
  // 提示词（用于显示）
  prompt: string;
  // 回调
  onGenerate: () => void;
  onRegenerate: () => void;
  onDownload: (image: GeneratedSceneImage) => void;
  onSelectHistory: (image: GeneratedSceneImage) => void;
  // 配置信息
  outputSize: string;
  platform: 'dashscope' | 'openrouter';
  imageModel: string;
  // 是否有产品图（决定使用图生图还是文生图）
  hasProductImages?: boolean;
  // 生成数量
  generationCount?: number;
  onSetGenerationCount?: (count: number) => void;
  // 保存功能
  isSaving?: boolean;
  saveResult?: SaveResult | null;
  saveError?: string | null;
  onSaveToLocal?: (basePath: string) => void;
  onClearSaveError?: () => void;
}

export default function ScenePreview({
  isGenerating,
  generationProgress,
  currentImage,
  currentBatchImages = [],
  history,
  prompt,
  onGenerate,
  onRegenerate,
  onDownload,
  onSelectHistory,
  outputSize,
  platform,
  imageModel,
  hasProductImages = false,
  generationCount = 1,
  onSetGenerationCount,
  isSaving = false,
  saveResult = null,
  saveError = null,
  onSaveToLocal,
  onClearSaveError,
}: ScenePreviewProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  // 预览的图片对象（用于模态框显示和下载）
  const [previewingImage, setPreviewingImage] = useState<GeneratedSceneImage | null>(null);
  // 要替换到主流程的图片
  const [replacingImage, setReplacingImage] = useState<GeneratedSceneImage | null>(null);
  // 替换成功提示
  const [replaceSuccess, setReplaceSuccess] = useState(false);

  // 生成模式
  const generationMode = hasProductImages ? 'img2img' : 'text2img';

  // 计算费用预估（基于模型和生成数量）
  const getEstimatedCost = () => {
    // 图生图或百炼模型都是免费
    if (hasProductImages || platform === 'dashscope') {
      return { text: '免费', isFree: true };
    }

    // OpenRouter 模型定价（每张）
    let pricePerImage = 0;
    if (imageModel.includes('schnell')) {
      pricePerImage = 0.014; // Klein
    } else if (imageModel.includes('1.1-pro')) {
      pricePerImage = 0.08; // Pro
    } else if (imageModel.includes('pro') || imageModel.includes('flex')) {
      pricePerImage = 0.04; // Flex
    } else {
      pricePerImage = 0.02; // 默认
    }

    const totalCost = pricePerImage * generationCount;
    return {
      text: `$${totalCost.toFixed(3)}`,
      isFree: false,
      perImage: pricePerImage,
    };
  };

  const estimatedCost = getEstimatedCost();

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
      {/* 生成数量选择器 */}
      {onSetGenerationCount && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted">生成数量：</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => onSetGenerationCount(count)}
                disabled={isGenerating}
                className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                  generationCount === count
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-secondary text-foreground hover:bg-secondary-hover'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

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
            生成场景图 {generationCount > 1 ? `(${generationCount}张)` : ''}
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

      {/* 配置信息和费用预估 */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted flex-wrap">
        <span className={`px-2 py-0.5 rounded ${hasProductImages ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
          {hasProductImages ? '🖼️ 图生图' : '📝 文生图'}
        </span>
        <span>尺寸: {outputSize}</span>
        <span>|</span>
        <span className={estimatedCost.isFree ? 'text-green-400' : 'text-yellow-400'}>
          {estimatedCost.isFree
            ? '🆓 免费额度'
            : `预估：${estimatedCost.text}（${generationCount}张 × $${estimatedCost.perImage?.toFixed(3)}）`
          }
        </span>
        <span>|</span>
        <span>{hasProductImages ? 'wan2.6-image' : platform === 'dashscope' ? '百炼' : 'OpenRouter'}</span>
      </div>

      {/* 预览区 - 支持批量图片网格显示 */}
      {currentBatchImages.length > 1 ? (
        // 多图网格显示
        <div className={`grid gap-2 ${
          currentBatchImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
        }`}>
          {currentBatchImages.map((img, idx) => (
            <div
              key={img.id}
              className="group relative aspect-square bg-secondary rounded-lg border-2 border-green-600/30 overflow-hidden cursor-pointer"
              onClick={() => setPreviewingImage(img)}
            >
              <img
                src={img.imageData}
                alt={`Generated scene ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* 序号 */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
                #{idx + 1}
              </div>
              {/* 悬停操作 */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewingImage(img);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
                  title="放大"
                >
                  🔍
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(img);
                  }}
                  className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white"
                  title="下载"
                >
                  📥
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 单图显示
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
                onClick={() => setPreviewingImage(currentImage)}
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
      )}

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
            onClick={() => setReplacingImage(currentImage)}
            className="py-2.5 bg-green-600/20 text-green-500 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center justify-center gap-1"
          >
            ✅ 替换到主流程
          </button>
        </div>
      )}

      {/* 替换成功提示 */}
      {replaceSuccess && (
        <div className="p-3 bg-green-600/20 rounded-lg text-sm text-green-400 flex items-center justify-between">
          <span>✓ 已成功替换到批量生成的图片</span>
          <button
            onClick={() => setReplaceSuccess(false)}
            className="text-green-400 hover:text-green-300"
          >
            ✕
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
          /* 移动端横向滚动，桌面端4列网格 */
          <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-700">
            {history.slice(0, 20).map((img, index) => (
              <div key={img.id} className="flex-shrink-0 w-20 h-20 md:w-auto md:h-auto">
                <HistoryItem
                  image={img}
                  index={index}
                  isSelected={currentImage?.id === img.id}
                  onSelect={() => onSelectHistory(img)}
                  onDownload={() => handleDownload(img)}
                  onPreview={() => setPreviewingImage(img)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存到本地 */}
      {history.length > 0 && onSaveToLocal && (
        <div className="border-t border-border pt-4 mt-4">
          {/* 保存结果提示 */}
          {saveResult && (
            <div className="mb-3 p-3 bg-green-600/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span>✓</span>
                <span>已保存到：{saveResult.folderName}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                成功 {saveResult.successCount}/{saveResult.totalImages} 张
              </div>
              <div className="text-xs text-muted mt-1">
                路径：{saveResult.outputPath}
              </div>
            </div>
          )}

          {/* 保存错误提示 */}
          {saveError && (
            <div className="mb-3 p-3 bg-red-500/10 rounded-lg flex items-center justify-between">
              <span className="text-sm text-red-400">❌ {saveError}</span>
              {onClearSaveError && (
                <button
                  onClick={onClearSaveError}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* 保存按钮 - 使用SavePathSelector */}
          {!saveResult && (
            <div className="flex justify-center">
              <SavePathSelector
                onSave={onSaveToLocal}
                isSaving={isSaving}
                buttonText={`💾 保存到本地（${history.length}张图片）`}
                showChangeButton={true}
              />
            </div>
          )}

          <p className="text-xs text-muted text-center mt-2">
            保存到 {getSavedPath()}/{'{产品名}'}_{'{时间}'}_scene/
          </p>
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewingImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewingImage.imageData}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {/* 关闭按钮 */}
            <button
              onClick={() => setPreviewingImage(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-foreground hover:bg-secondary-hover text-lg"
            >
              ✕
            </button>

            {/* 底部信息和操作栏 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              {/* 图片信息 */}
              <div className="text-xs text-white/80 mb-2 line-clamp-2">
                {previewingImage.prompt}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>{previewingImage.model}</span>
                  <span>•</span>
                  <span>{previewingImage.size}</span>
                  <span>•</span>
                  <span>{new Date(previewingImage.timestamp).toLocaleTimeString()}</span>
                  {previewingImage.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{previewingImage.tags.slice(0, 3).join(', ')}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(previewingImage)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
                >
                  📥 下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 替换到主流程模态框 */}
      {replacingImage && (
        <ReplaceToMainFlowModal
          sceneImage={replacingImage}
          onClose={() => setReplacingImage(null)}
          onSuccess={() => setReplaceSuccess(true)}
        />
      )}
    </div>
  );
}
