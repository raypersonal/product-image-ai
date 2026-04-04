'use client';

import { useApp } from '@/context/AppContext';

export default function AnalysisPanel() {
  const { analysisResult, currentStep } = useApp();

  return (
    <aside className="w-[280px] h-screen bg-secondary border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-foreground">📊 产品分析</h2>
        <p className="text-xs text-muted mt-1">AI分析结果将在Step 2完成后显示</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!analysisResult ? (
          <div className="text-center py-8 text-muted">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">完成产品信息填写后</p>
            <p className="text-sm">点击「开始分析」查看结果</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 视觉风格 */}
            <div className="bg-background rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <span>🎨</span> 视觉风格
              </h3>
              <p className="text-sm text-foreground">{analysisResult.style}</p>
            </div>

            {/* 色彩方向 */}
            <div className="bg-background rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <span>🌈</span> 色彩方向
              </h3>
              <p className="text-sm text-foreground">{analysisResult.colorPalette}</p>
            </div>

            {/* 目标人群 */}
            <div className="bg-background rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <span>👥</span> 目标人群
              </h3>
              <p className="text-sm text-foreground">{analysisResult.targetAudience}</p>
            </div>

            {/* 差异化卖点 */}
            <div className="bg-background rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <span>⭐</span> 差异化卖点
              </h3>
              <ul className="space-y-1">
                {analysisResult.sellingPoints.map((point, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 建议场景 */}
            <div className="bg-background rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <span>📍</span> 建议场景
              </h3>
              <ul className="space-y-1">
                {analysisResult.scenes.map((scene, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-muted">{index + 1}.</span>
                    <span>{scene}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 参考图片分析 */}
            {analysisResult.referenceAnalysis && (
              <>
                <div className="border-t border-border my-4"></div>
                <div className="bg-background rounded-lg p-3">
                  <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <span>📷</span> 产品外观
                  </h3>
                  <p className="text-sm text-foreground">{analysisResult.referenceAnalysis.appearance}</p>
                </div>

                <div className="bg-background rounded-lg p-3">
                  <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <span>📦</span> 包装特征
                  </h3>
                  <p className="text-sm text-foreground">{analysisResult.referenceAnalysis.packaging}</p>
                </div>

                <div className="bg-background rounded-lg p-3">
                  <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <span>🎯</span> 差异化优势
                  </h3>
                  <p className="text-sm text-foreground">{analysisResult.referenceAnalysis.competitorDiff}</p>
                </div>

                <div className="bg-background rounded-lg p-3">
                  <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <span>✨</span> 设计元素
                  </h3>
                  <p className="text-sm text-foreground">{analysisResult.referenceAnalysis.designElements}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
