'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_IMAGE_TYPES, calculateEstimatedCost, getTypeConfig, getAspectRatioStyle, isWideAspectRatio } from '@/types';
import JSZip from 'jszip';

interface SaveResult {
  outputPath: string;
  folderName: string;
  successCount: number;
  failedCount: number;
  totalImages: number;
}

export default function Step5Download() {
  const {
    prompts,
    images,
    productInfo,
    referenceImages,
    analysisResult,
    selectedModel,
    enabledTypes,
    typeSizeMap,
  } = useApp();

  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const completedImages = images.filter(img => img.status === 'completed' && img.url);
  const failedImages = images.filter(img => img.status === 'failed');

  // 按启用的类型分组
  const imagesByType = useMemo(() => {
    return ALL_IMAGE_TYPES
      .filter(t => enabledTypes[t.id])
      .map(typeConfig => ({
        type: typeConfig.id,
        name: typeConfig.name,
        images: completedImages.filter(img => {
          const prompt = prompts.find(p => p.id === img.promptId);
          return prompt?.type === typeConfig.id;
        }),
      }))
      .filter(group => group.images.length > 0);
  }, [completedImages, prompts, enabledTypes]);

  // 计算预估费用
  const estimatedCost = useMemo(() => {
    return calculateEstimatedCost(images.length, selectedModel);
  }, [images.length, selectedModel]);

  const downloadSingleImage = async (imageUrl: string, filename: string) => {
    try {
      // 判断是 base64 还是 URL
      if (imageUrl.startsWith('data:')) {
        // Base64 格式：直接转 blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // URL 格式：通过代理 API 下载（避免 CORS 问题）
        try {
          const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
          if (!response.ok) throw new Error('Proxy failed');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch {
          // 代理失败，尝试直接下载（可能有 CORS）
          const response = await fetch(imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      // 最后的回退：在新窗口打开图片让用户右键保存
      window.open(imageUrl, '_blank');
      alert('无法自动下载，已在新窗口打开图片，请右键保存');
    }
  };

  // 获取图片 blob（支持 base64 和 URL）
  const fetchImageBlob = async (imageUrl: string): Promise<Blob | null> => {
    try {
      if (imageUrl.startsWith('data:')) {
        // Base64 格式
        const response = await fetch(imageUrl);
        return await response.blob();
      } else {
        // URL 格式：优先通过代理下载
        try {
          const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
          if (response.ok) {
            return await response.blob();
          }
        } catch {
          // 代理失败，尝试直接下载
        }
        const response = await fetch(imageUrl, { mode: 'cors' });
        return await response.blob();
      }
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return null;
    }
  };

  const downloadAllAsZip = async () => {
    if (completedImages.length === 0) {
      alert('没有可下载的图片');
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // 按类型创建文件夹
      for (const { type, name, images: typeImages } of imagesByType) {
        if (typeImages.length === 0) continue;

        const folder = zip.folder(name);
        if (!folder) continue;

        for (const image of typeImages) {
          if (!image.url) continue;
          const prompt = prompts.find(p => p.id === image.promptId);
          const filename = `${name}_${prompt?.index || 1}.png`;

          const blob = await fetchImageBlob(image.url);
          if (blob) {
            folder.file(filename, blob);
          } else {
            console.error(`Failed to add ${filename}`);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `产品图片_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('ZIP download failed:', error);
      alert('打包下载失败，请尝试单独下载');
    } finally {
      setIsDownloading(false);
    }
  };

  const saveToLocal = async () => {
    if (completedImages.length === 0) {
      alert('没有可保存的图片');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/save-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productInfo.name || '未命名产品',
          model: selectedModel,
          aspectRatio: '1:1', // 向后兼容
          images,
          prompts,
          analysisResult,
          referenceImages,
          enabledTypes,
          typeSizeMap,
          estimatedCost,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      setSaveResult(data);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">📥 Step 5: 查看 & 下载</h2>
        <p className="text-sm text-muted mt-1">
          预览所有生成的图片，下载单张或打包下载全部
        </p>
      </div>

      {/* 工具栏 */}
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-4">
        <div className="text-sm text-muted">
          已生成 <span className="text-primary font-bold">{completedImages.length}</span> 张图片
          {failedImages.length > 0 && (
            <span className="text-error ml-2">（{failedImages.length} 张失败）</span>
          )}
        </div>

        <div className="flex-1"></div>

        {failedImages.length > 0 && (
          <button
            onClick={() => {/* TODO: 重新生成失败的图片 */}}
            className="px-4 py-2 bg-error/20 text-error rounded-lg text-sm hover:bg-error/30 transition-colors"
          >
            🔄 重新生成失败的图片（{failedImages.length}张）
          </button>
        )}

        {/* 保存到本地按钮 */}
        {saveResult ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm">
            <span>✓ 已保存</span>
            <span className="text-xs text-muted">({saveResult.successCount}/{saveResult.totalImages})</span>
          </div>
        ) : (
          <button
            onClick={saveToLocal}
            disabled={isSaving || completedImages.length === 0}
            className="px-4 py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '💾 保存到本地'}
          </button>
        )}

        <button
          onClick={downloadAllAsZip}
          disabled={isDownloading || completedImages.length === 0}
          className="px-6 py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? '打包中...' : '📦 全部下载（ZIP）'}
        </button>
      </div>

      {/* 保存结果提示 */}
      {saveResult && (
        <div className="px-4 py-3 bg-primary/10 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">✓</span>
            <span className="text-foreground">
              已保存到：<code className="bg-secondary px-2 py-0.5 rounded text-xs">{saveResult.folderName}</code>
            </span>
            <span className="text-muted">
              （成功 {saveResult.successCount} 张
              {saveResult.failedCount > 0 && <span className="text-error">，失败 {saveResult.failedCount} 张</span>}）
            </span>
          </div>
          <div className="text-xs text-muted mt-1">
            完整路径：{saveResult.outputPath}
          </div>
        </div>
      )}

      {/* 保存错误提示 */}
      {saveError && (
        <div className="px-4 py-3 bg-error/10 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-error">
            <span>✕</span>
            <span>保存失败：{saveError}</span>
            <button
              onClick={() => setSaveError(null)}
              className="ml-auto text-xs hover:underline"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 图片网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        {completedImages.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div className="text-6xl mb-4">🖼️</div>
            <p>暂无已生成的图片</p>
            <p className="text-sm mt-2">请先在 Step 4 生成图片</p>
          </div>
        ) : (
          <div className="space-y-6">
            {imagesByType.map(({ type, name, images: typeImages }) => {
              if (typeImages.length === 0) return null;

              return (
                <div key={type}>
                  <h3 className="text-sm font-medium text-primary mb-3">
                    {name} <span className="text-muted">（{typeImages.length}张）</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {typeImages.map((image) => {
                      const prompt = prompts.find(p => p.id === image.promptId);
                      const filename = `${name}_${prompt?.index || 1}.png`;

                      // 获取当前类型的宽高比
                      const typeConfig = getTypeConfig(type);
                      const currentSize = typeSizeMap[type] || typeConfig?.defaultSize || '1:1';
                      const sizeOption = typeConfig?.sizeOptions.find(s => s.value === currentSize);
                      const aspectRatio = sizeOption?.aspectRatio || currentSize || '1:1';
                      const aspectStyle = getAspectRatioStyle(aspectRatio);
                      const isWide = isWideAspectRatio(aspectRatio);

                      return (
                        <div
                          key={image.id}
                          className={`group relative bg-secondary rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer ${isWide ? 'col-span-3' : ''}`}
                          style={{ aspectRatio: aspectStyle }}
                          onClick={() => setSelectedImage(image.url)}
                        >
                          <img
                            src={image.url!}
                            alt={filename}
                            className="w-full h-full object-cover"
                          />

                          {/* 悬停遮罩 */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSingleImage(image.url!, filename);
                              }}
                              className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary-hover"
                            >
                              📥 下载
                            </button>
                          </div>

                          {/* 序号标签 */}
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                            #{prompt?.index}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-foreground hover:bg-secondary-hover"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
