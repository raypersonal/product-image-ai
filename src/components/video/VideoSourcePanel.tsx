'use client';

import { useState, useCallback, useRef } from 'react';
import { VideoSourceImage, VideoProductInfo } from './VideoWorkbench';

interface VideoSourcePanelProps {
  sourceImage: VideoSourceImage | null;
  productInfo: VideoProductInfo;
  onSetSourceImage: (image: VideoSourceImage | null) => void;
  onSetProductInfo: (info: Partial<VideoProductInfo>) => void;
}

export default function VideoSourcePanel({
  sourceImage,
  productInfo,
  onSetSourceImage,
  onSetProductInfo,
}: VideoSourcePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 压缩图片
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1920;
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    try {
      const base64 = await compressImage(file);
      const newImage: VideoSourceImage = {
        id: `upload-${Date.now()}`,
        base64,
        filename: file.name,
        source: 'upload',
      };
      onSetSourceImage(newImage);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('图片处理失败');
    }
  }, [onSetSourceImage]);

  // 拖拽事件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <span>📷</span>
        图片来源
      </h2>

      {/* 图片上传区 */}
      {!sourceImage ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-green-500 bg-green-500/10'
              : 'border-border hover:border-green-500/50 hover:bg-secondary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <div className="text-4xl mb-3">📤</div>
          <p className="text-foreground font-medium mb-1">拖拽或点击上传图片</p>
          <p className="text-sm text-muted">支持 JPG、PNG 格式</p>
          <p className="text-xs text-muted mt-2">或从「场景工作台」转入已生成的图片</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 图片预览 */}
          <div className="relative group">
            <img
              src={sourceImage.base64}
              alt="Source"
              className="w-full aspect-video object-cover rounded-lg border border-border"
            />
            {/* 来源标签 */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
              {sourceImage.source === 'scene' ? '🎨 场景工作台' : '📤 上传'}
            </div>
            {/* 删除按钮 */}
            <button
              onClick={() => onSetSourceImage(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>

          {/* 场景标签（如果有） */}
          {sourceImage.sceneTags && sourceImage.sceneTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sourceImage.sceneTags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {sourceImage.sceneTags.length > 5 && (
                <span className="text-xs text-muted">+{sourceImage.sceneTags.length - 5}</span>
              )}
            </div>
          )}

          {/* 更换图片 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-green-500/50 transition-colors"
          >
            更换图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      )}

      {/* 产品信息 */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-medium text-foreground">产品信息（可选）</h3>

        <div>
          <label className="block text-xs text-muted mb-1">产品名称</label>
          <input
            type="text"
            value={productInfo.name}
            onChange={(e) => onSetProductInfo({ name: e.target.value })}
            placeholder="例��：生日派对气球套装"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:border-green-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">产品类别</label>
          <input
            type="text"
            value={productInfo.category}
            onChange={(e) => onSetProductInfo({ category: e.target.value })}
            placeholder="例如：派对装饰"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:border-green-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">简短描述</label>
          <textarea
            value={productInfo.description}
            onChange={(e) => onSetProductInfo({ description: e.target.value })}
            placeholder="简要描述产品特点..."
            rows={2}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:border-green-500 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
