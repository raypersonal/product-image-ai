'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadedImage, SceneProductInfo } from './SceneWorkbench';

interface SceneProductUploadProps {
  productImages: UploadedImage[];
  productInfo: SceneProductInfo;
  onAddImage: (image: UploadedImage) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
  onSetProductInfo: (info: Partial<SceneProductInfo>) => void;
}

// 图片压缩：超过 2MB 时压缩到 1024px 宽度（复用主流程逻辑）
async function compressImage(file: File, maxWidth = 1024, maxSizeKB = 2048): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 检查是否需要压缩
        if (file.size <= maxSizeKB * 1024 && img.width <= maxWidth) {
          resolve(e.target?.result as string);
          return;
        }

        // 计算新尺寸
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // 使用 canvas 压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // 输出为 JPEG（更小的文件）
        const quality = 0.85;
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export default function SceneProductUpload({
  productImages,
  productInfo,
  onAddImage,
  onRemoveImage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateImage,
  onSetProductInfo,
}: SceneProductUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片文件
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError('');
    const fileArray = Array.from(files);

    // 检查数量限制
    if (productImages.length + fileArray.length > 6) {
      setUploadError(`最多上传6张图片，当前已有${productImages.length}张`);
      return;
    }

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = fileArray.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setUploadError('仅支持 JPG、PNG、WebP、GIF 格式');
      return;
    }

    // 处理每个文件
    for (const file of fileArray) {
      try {
        const base64 = await compressImage(file);
        const newImage: UploadedImage = {
          id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          base64,
          description: '',
          filename: file.name,
        };
        onAddImage(newImage);
      } catch (err) {
        console.error('Image processing error:', err);
        setUploadError(`处理图片 ${file.name} 失败`);
      }
    }
  }, [productImages.length, onAddImage]);

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // 点击上传
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // 清空以允许重复选择同一文件
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 标题 */}
      <div>
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <span>📷</span>
          产品图上传
        </h2>
        <p className="text-xs text-muted mt-1">
          上传产品图片，AI将分析产品外观生成场景
        </p>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 拖拽上传区 */}
      <div
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
        } ${productImages.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="text-primary text-2xl mb-1">📁</div>
        <p className="text-sm text-foreground">
          点击或拖拽上传
        </p>
        <p className="text-xs text-muted mt-1">
          最多6张，支持 JPG/PNG/WebP
        </p>
      </div>

      {/* 上传错误提示 */}
      {uploadError && (
        <p className="text-sm text-error">{uploadError}</p>
      )}

      {/* 已上传的图片列表 */}
      {productImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {productImages.map((img, index) => (
            <div key={img.id} className="relative group">
              <div
                className="aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setPreviewImage(img.base64)}
              >
                <img
                  src={img.base64}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                {/* 主参考图标记 */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-background text-xs rounded">
                    主图
                  </div>
                )}
                {/* 序号 */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                  #{index + 1}
                </div>
              </div>
              {/* 删除按钮 */}
              <button
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-error text-white rounded-full text-xs hover:bg-error/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 分隔线 */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span>📝</span>
          产品信息（可选）
        </h3>
        <p className="text-xs text-muted mb-3">
          填写产品信息可帮助AI生成更精准的场景
        </p>

        <div className="space-y-3">
          {/* 产品名称 */}
          <div>
            <label className="block text-xs text-muted mb-1">产品名称</label>
            <input
              type="text"
              value={productInfo.name}
              onChange={(e) => onSetProductInfo({ name: e.target.value })}
              placeholder="例如：彩虹气球套装"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted"
            />
          </div>

          {/* 产品类别 */}
          <div>
            <label className="block text-xs text-muted mb-1">产品类别</label>
            <input
              type="text"
              value={productInfo.category}
              onChange={(e) => onSetProductInfo({ category: e.target.value })}
              placeholder="例如：派对装饰"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted"
            />
          </div>

          {/* 简短描述 */}
          <div>
            <label className="block text-xs text-muted mb-1">简短描述</label>
            <textarea
              value={productInfo.description}
              onChange={(e) => onSetProductInfo({ description: e.target.value })}
              placeholder="产品特点、材质、用途等..."
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted resize-none"
            />
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-foreground hover:bg-secondary-hover"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
