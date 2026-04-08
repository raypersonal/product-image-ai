'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_IMAGE_TYPES, getTypeConfig } from '@/types';
import { GeneratedSceneImage } from './SceneWorkbench';

interface ReplaceToMainFlowModalProps {
  sceneImage: GeneratedSceneImage;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplaceToMainFlowModal({
  sceneImage,
  onClose,
  onSuccess,
}: ReplaceToMainFlowModalProps) {
  const { images, prompts, updateImage, enabledTypes } = useApp();

  // 按类型分组的已完成图片
  const imagesByType = useMemo(() => {
    const completedImages = images.filter(img => img.status === 'completed' && img.url);

    return ALL_IMAGE_TYPES
      .filter(t => enabledTypes[t.id])
      .map(typeConfig => ({
        type: typeConfig.id,
        name: typeConfig.name,
        images: completedImages.filter(img => {
          const prompt = prompts.find(p => p.id === img.promptId);
          return prompt?.type === typeConfig.id;
        }).map(img => {
          const prompt = prompts.find(p => p.id === img.promptId);
          return { ...img, prompt };
        }),
      }))
      .filter(group => group.images.length > 0);
  }, [images, prompts, enabledTypes]);

  const hasCompletedImages = imagesByType.some(g => g.images.length > 0);

  const handleReplace = (targetImageId: string) => {
    // 替换图片：更新 url 和 source 标记
    updateImage(targetImageId, {
      url: sceneImage.imageData,
      source: 'scene-workbench',
    });
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f2e] rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            选择要替换的图片
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasCompletedImages ? (
            // 没有已生成的图片
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-foreground font-medium mb-2">
                批量生成还没有完成的图片
              </p>
              <p className="text-sm text-muted">
                请先在「批量生成」中完成图片生成后，再使用替换功能
              </p>
            </div>
          ) : (
            // 显示分组的图片
            <div className="space-y-6">
              {/* 预览：要替换的场景图 */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="text-sm text-muted mb-2">将使用此场景图替换：</div>
                <div className="flex items-start gap-4">
                  <img
                    src={sceneImage.imageData}
                    alt="Scene"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-green-500"
                  />
                  <div className="flex-1 text-sm">
                    <p className="text-foreground line-clamp-2 mb-1">
                      {sceneImage.prompt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{sceneImage.model}</span>
                      <span>•</span>
                      <span>{sceneImage.size}</span>
                    </div>
                    {sceneImage.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sceneImage.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 分组的图片列表 */}
              {imagesByType.map(({ type, name, images: typeImages }) => (
                <div key={type}>
                  <h4 className="text-sm font-medium text-primary mb-3">
                    {name}
                    <span className="text-muted ml-2">({typeImages.length}张)</span>
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {typeImages.map((img) => (
                      <div
                        key={img.id}
                        className="group relative aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-green-500 transition-colors"
                        onClick={() => handleReplace(img.id)}
                      >
                        <img
                          src={img.url!}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* 已替换标记 */}
                        {img.source === 'scene-workbench' && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-600 text-white text-[10px] rounded">
                            场景工作台
                          </div>
                        )}
                        {/* 序号 */}
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                          #{img.prompt?.index}
                        </div>
                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-green-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            点击替换
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-secondary text-foreground rounded-lg hover:bg-secondary-hover transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
