'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Step2Analysis() {
  const {
    productInfo,
    referenceImages,
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
        body: JSON.stringify({
          productInfo,
          referenceImages,
        }),
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
          AI将分析产品特点{referenceImages.length > 0 ? '和参考图片' : ''}，生成视觉风格、色彩方案、目标人群等建议
        </p>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {!analysisResult && !isAnalyzing && (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-foreground mb-2">准备开始分析</h3>
            <p className="text-muted mb-6">
              AI将根据您填写的产品信息{referenceImages.length > 0 ? `和${referenceImages.length}张参考图片` : ''}，分析视觉风格、色彩方向、目标人群和差异化卖点
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
                {referenceImages.length > 0 && (
                  <div className="flex">
                    <dt className="text-muted w-20">参考图：</dt>
                    <dd className="text-foreground">{referenceImages.length} 张</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 参考图片预览 */}
            {referenceImages.length > 0 && (
              <div className="bg-secondary rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-primary mb-2">参考图片</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {referenceImages.map((img, index) => (
                    <div key={img.id} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded overflow-hidden bg-background relative">
                        <img
                          src={img.base64}
                          alt={img.description || `参考图${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">
                  AI将使用 Gemini Vision 分析这些图片
                </p>
              </div>
            )}

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
            <p className="text-muted">
              {referenceImages.length > 0
                ? '正在分析参考图片和产品信息，通常需要 20-60 秒'
                : '通常需要 10-30 秒，请耐心等待'}
            </p>
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

            {/* 参考图片分析结果 */}
            {analysisResult.referenceAnalysis && (
              <div className="mt-4 bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary mb-3">📷 参考图片分析</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted">产品外观：</span>
                    <span className="text-foreground ml-1">{analysisResult.referenceAnalysis.appearance}</span>
                  </div>
                  <div>
                    <span className="text-muted">包装特征：</span>
                    <span className="text-foreground ml-1">{analysisResult.referenceAnalysis.packaging}</span>
                  </div>
                  <div>
                    <span className="text-muted">差异化：</span>
                    <span className="text-foreground ml-1">{analysisResult.referenceAnalysis.competitorDiff}</span>
                  </div>
                  <div>
                    <span className="text-muted">设计元素：</span>
                    <span className="text-foreground ml-1">{analysisResult.referenceAnalysis.designElements}</span>
                  </div>
                </div>
              </div>
            )}

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
