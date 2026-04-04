'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Step2Analysis() {
  const {
    productInfo,
    analysisResult,
    setAnalysisResult,
    isAnalyzing,
    setIsAnalyzing,
  } = useApp();

  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }

      setAnalysisResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">🤖 Step 2: AI产品分析</h2>
        <p className="text-sm text-muted mt-1">
          AI将分析产品特点，生成视觉风格、色彩方案、目标人群等建议
        </p>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {!analysisResult && !isAnalyzing && (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-foreground mb-2">准备开始分析</h3>
            <p className="text-muted mb-6">
              AI将根据您填写的产品信息，分析视觉风格、色彩方向、目标人群和差异化卖点
            </p>

            {/* 产品信息摘要 */}
            <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-primary mb-2">产品信息摘要</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex">
                  <dt className="text-muted w-20">名称：</dt>
                  <dd className="text-foreground">{productInfo.name}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted w-20">类别：</dt>
                  <dd className="text-foreground">{productInfo.category}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted w-20">卖点：</dt>
                  <dd className="text-foreground">
                    {productInfo.sellingPoints.filter(Boolean).length} 条
                  </dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-8 py-4 bg-primary text-background rounded-xl font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 开始分析
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-foreground mb-2">AI 正在分析中...</h3>
            <p className="text-muted">通常需要 10-30 秒，请耐心等待</p>
          </div>
        )}

        {analysisResult && !isAnalyzing && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-primary">分析完成！</h3>
              <p className="text-muted text-sm mt-1">
                请查看右侧面板的详细分析结果，确认无误后进入下一步
              </p>
            </div>

            {/* 分析结果摘要卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary mb-2">🎨 视觉风格</h4>
                <p className="text-sm text-foreground line-clamp-2">{analysisResult.style}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary mb-2">🌈 色彩方案</h4>
                <p className="text-sm text-foreground line-clamp-2">{analysisResult.colorPalette}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary mb-2">👥 目标人群</h4>
                <p className="text-sm text-foreground line-clamp-2">{analysisResult.targetAudience}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary mb-2">⭐ 核心卖点</h4>
                <p className="text-sm text-foreground">{analysisResult.sellingPoints.length} 个</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleAnalyze}
                className="text-sm text-muted hover:text-foreground underline"
              >
                重新分析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
