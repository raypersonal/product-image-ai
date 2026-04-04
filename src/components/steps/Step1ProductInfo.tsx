'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_OPTIONS, STYLE_OPTIONS, FeishuRecord, ReferenceImage } from '@/types';

// 图片压缩：超过 2MB 时压缩到 1024px 宽度
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

export default function Step1ProductInfo() {
  const {
    productInfo,
    setProductInfo,
    referenceImages,
    addReferenceImage,
    updateReferenceImage,
    removeReferenceImage,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'manual' | 'feishu'>('manual');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 飞书相关状态
  const [feishuAppToken, setFeishuAppToken] = useState('');
  const [feishuTableId, setFeishuTableId] = useState('');
  const [feishuRecords, setFeishuRecords] = useState<FeishuRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [feishuError, setFeishuError] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');

  // 从 localStorage 获取飞书配置
  const [feishuAppId, setFeishuAppId] = useState('');
  const [feishuAppSecret, setFeishuAppSecret] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFeishuAppId(localStorage.getItem('feishuAppId') || '');
      setFeishuAppSecret(localStorage.getItem('feishuAppSecret') || '');
    }
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    console.log(`[Step1] handleInputChange: ${field} = ${typeof value === 'string' ? value.substring(0, 50) : value}`);
    setProductInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSellingPointChange = (index: number, value: string) => {
    const newPoints = [...productInfo.sellingPoints];
    newPoints[index] = value;
    setProductInfo({ ...productInfo, sellingPoints: newPoints });
  };

  const addSellingPoint = () => {
    if (productInfo.sellingPoints.length < 5) {
      setProductInfo({
        ...productInfo,
        sellingPoints: [...productInfo.sellingPoints, ''],
      });
    }
  };

  const removeSellingPoint = (index: number) => {
    if (productInfo.sellingPoints.length > 1) {
      const newPoints = productInfo.sellingPoints.filter((_, i) => i !== index);
      setProductInfo({ ...productInfo, sellingPoints: newPoints });
    }
  };

  const toggleStyle = (style: string) => {
    const current = productInfo.stylePreferences;
    if (current.includes(style)) {
      handleInputChange('stylePreferences', current.filter(s => s !== style));
    } else {
      handleInputChange('stylePreferences', [...current, style]);
    }
  };

  // 处理图片文件
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError('');
    const fileArray = Array.from(files);

    // 检查数量限制
    if (referenceImages.length + fileArray.length > 6) {
      setUploadError(`最多上传6张图片，当前已有${referenceImages.length}张`);
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
        const newImage: ReferenceImage = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          base64,
          description: '',
          filename: file.name,
        };
        addReferenceImage(newImage);
      } catch (err) {
        console.error('Image processing error:', err);
        setUploadError(`处理图片 ${file.name} 失败`);
      }
    }
  }, [referenceImages.length, addReferenceImage]);

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
    console.log('[Step1] handleUploadClick called, fileInputRef:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('[Step1] fileInputRef is null!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Step1] handleFileChange called, files:', e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // 清空以允许重复选择同一文件
    }
  };

  const loadFeishuRecords = async () => {
    if (!feishuAppToken || !feishuTableId) {
      setFeishuError('请填写 App Token 和 Table ID');
      return;
    }

    if (!feishuAppId || !feishuAppSecret) {
      setFeishuError('请先在设置页面配置飞书 App ID 和 App Secret');
      return;
    }

    setIsLoadingRecords(true);
    setFeishuError('');

    try {
      const params = new URLSearchParams({
        appToken: feishuAppToken,
        tableId: feishuTableId,
        appId: feishuAppId,
        appSecret: feishuAppSecret,
      });

      const response = await fetch(`/api/feishu/records?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取记录失败');
      }

      setFeishuRecords(data.records || []);
      if (data.records?.length === 0) {
        setFeishuError('未找到任何记录');
      }
    } catch (error) {
      setFeishuError(error instanceof Error ? error.message : '获取飞书数据失败');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleRecordSelect = (recordId: string) => {
    setSelectedRecordId(recordId);
    const record = feishuRecords.find(r => r.record_id === recordId);
    if (record) {
      const fields = record.fields;
      // 根据字段名映射填充表单（需要根据实际飞书表格字段调整）
      setProductInfo({
        name: String(fields['产品名称'] || fields['name'] || ''),
        category: String(fields['产品类别'] || fields['category'] || 'birthday'),
        description: String(fields['产品描述'] || fields['description'] || ''),
        sellingPoints: Array.isArray(fields['核心卖点'])
          ? fields['核心卖点'] as string[]
          : String(fields['核心卖点'] || fields['sellingPoints'] || '').split('\n').filter(Boolean),
        targetAudience: String(fields['目标人群'] || fields['targetAudience'] || ''),
        stylePreferences: Array.isArray(fields['风格偏好'])
          ? fields['风格偏好'] as string[]
          : [],
      });
    }
  };

  const descriptionLength = productInfo.description?.length || 0;
  const isDescriptionValid = descriptionLength >= 50;

  // Debug log
  console.log('[Step1] productInfo.description:', productInfo.description, 'length:', descriptionLength);

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">📝 Step 1: 产品信息输入</h2>
        <p className="text-sm text-muted mt-1">
          填写产品基本信息，可手动输入或从飞书多维表格读取
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted hover:text-foreground'
          }`}
        >
          ✍️ 手动填写
        </button>
        <button
          onClick={() => setActiveTab('feishu')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'feishu'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted hover:text-foreground'
          }`}
        >
          📊 从飞书读取
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'feishu' && (
          <div className="mb-6 p-4 bg-secondary rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">飞书多维表格配置</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">App Token</label>
                <input
                  type="text"
                  value={feishuAppToken}
                  onChange={(e) => setFeishuAppToken(e.target.value)}
                  placeholder="多维表格的 appToken"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Table ID</label>
                <input
                  type="text"
                  value={feishuTableId}
                  onChange={(e) => setFeishuTableId(e.target.value)}
                  placeholder="表格ID（tbl开头）"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted"
                />
              </div>
              <button
                onClick={loadFeishuRecords}
                disabled={isLoadingRecords}
                className="w-full py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingRecords ? '读取中...' : '📥 读取记录'}
              </button>

              {feishuError && (
                <p className="text-sm text-error">{feishuError}</p>
              )}

              {feishuRecords.length > 0 && (
                <div>
                  <label className="block text-xs text-muted mb-1">选择记录</label>
                  <select
                    value={selectedRecordId}
                    onChange={(e) => handleRecordSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">请选择一条记录</option>
                    {feishuRecords.map((record) => (
                      <option key={record.record_id} value={record.record_id}>
                        {String(record.fields['产品名称'] || record.fields['name'] || record.record_id)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 表单 */}
        <div className="space-y-4">
          {/* 产品名称 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              产品名称 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={productInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="例如：彩虹气球派对套装"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted"
            />
          </div>

          {/* 产品类别 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              产品类别
            </label>
            <select
              value={productInfo.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 产品描述 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              产品描述 <span className="text-error">*</span>
              <span className={`ml-2 text-xs ${isDescriptionValid ? 'text-primary' : 'text-warning'}`}>
                ({descriptionLength}/50字)
              </span>
            </label>
            <textarea
              value={productInfo.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="详细描述产品的特点、材质、用途等信息（至少50字）"
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted resize-none"
            />
            {!isDescriptionValid && descriptionLength > 0 && (
              <p className="text-xs text-warning mt-1">还需要 {50 - descriptionLength} 字</p>
            )}
          </div>

          {/* 核心卖点 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              核心卖点（最多5条）
            </label>
            <div className="space-y-2">
              {productInfo.sellingPoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleSellingPointChange(index, e.target.value)}
                    placeholder={`卖点 ${index + 1}`}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted"
                  />
                  {productInfo.sellingPoints.length > 1 && (
                    <button
                      onClick={() => removeSellingPoint(index)}
                      className="px-3 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {productInfo.sellingPoints.length < 5 && (
              <button
                onClick={addSellingPoint}
                className="mt-2 text-sm text-primary hover:text-primary-hover"
              >
                + 添加卖点
              </button>
            )}
          </div>

          {/* 目标人群 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              目标人群
            </label>
            <input
              type="text"
              value={productInfo.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="例如：25-35岁年轻妈妈，注重派对仪式感"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted"
            />
          </div>

          {/* 风格偏好 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              风格偏好（可多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => toggleStyle(style.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    productInfo.stylePreferences.includes(style.value)
                      ? 'bg-primary text-background'
                      : 'bg-secondary text-muted hover:bg-secondary-hover hover:text-foreground'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* 参考图片上传区 */}
          <div className="mt-6 pt-6 border-t border-border">
            <label className="block text-sm font-medium text-foreground mb-2">
              📷 参考图片（可选，最多6张）
            </label>
            <p className="text-xs text-muted mb-3">
              上传产品实拍图、竞品图或期望风格的参考图，AI将基于这些图片生成更精准的场景
            </p>

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
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              } ${referenceImages.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-primary text-3xl mb-2">📁</div>
              <p className="text-sm text-foreground">
                点击或拖拽图片到此处上传
              </p>
              <p className="text-xs text-muted mt-1">
                支持 JPG、PNG、WebP、GIF，单张最大 10MB
              </p>
            </div>

            {/* 上传错误提示 */}
            {uploadError && (
              <p className="text-sm text-error mt-2">{uploadError}</p>
            )}

            {/* 已上传的图片列表 */}
            {referenceImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {referenceImages.map((img, index) => (
                  <div key={img.id} className="bg-secondary rounded-lg p-3">
                    <div className="relative aspect-video mb-2 rounded overflow-hidden bg-background">
                      <img
                        src={img.base64}
                        alt={img.filename}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeReferenceImage(img.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full text-xs hover:bg-error/80 flex items-center justify-center"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/50 rounded text-xs text-white">
                        #{index + 1}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={img.description}
                      onChange={(e) => updateReferenceImage(img.id, { description: e.target.value })}
                      placeholder="图片描述（如：竞品主图）"
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder-muted"
                    />
                    <p className="text-xs text-muted mt-1 truncate">{img.filename}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
