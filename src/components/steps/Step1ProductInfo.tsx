'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_OPTIONS, STYLE_OPTIONS, FeishuRecord } from '@/types';

export default function Step1ProductInfo() {
  const { productInfo, setProductInfo } = useApp();
  const [activeTab, setActiveTab] = useState<'manual' | 'feishu'>('manual');

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
    setProductInfo({ ...productInfo, [field]: value });
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

  const descriptionLength = productInfo.description.length;
  const isDescriptionValid = descriptionLength >= 50;

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
        </div>
      </div>
    </div>
  );
}
