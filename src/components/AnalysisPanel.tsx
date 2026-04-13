'use client';

import { useApp } from '@/context/AppContext';

export default function AnalysisPanel() {
  const { analysisResult } = useApp();

  return (
    <aside className="w-[280px] h-screen bg-secondary border-l border-border flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-border-subtle">
        <h2 className="text-heading-md text-foreground">产品分析</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!analysisResult ? (
          <div className="text-center py-8 text-muted">
            <p className="text-body-sm">完成产品信息填写后</p>
            <p className="text-body-sm mt-1">点击「开始分析」查看结果</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 视觉风格 */}
            <div className="bg-surface rounded-card p-3 border border-border">
              <h3 className="text-label text-accent-text mb-2">视觉风格</h3>
              <p className="text-body-sm text-foreground">{analysisResult.style}</p>
            </div>

            {/* 色彩方向 */}
            <div className="bg-surface rounded-card p-3 border border-border">
              <h3 className="text-label text-accent-text mb-2">色彩方向</h3>
              <p className="text-body-sm text-foreground">{analysisResult.colorPalette}</p>
            </div>

            {/* 目标人群 */}
            <div className="bg-surface rounded-card p-3 border border-border">
              <h3 className="text-label text-accent-text mb-2">目标人群</h3>
              <p className="text-body-sm text-foreground">{analysisResult.targetAudience}</p>
            </div>

            {/* 差异化卖点 */}
            <div className="bg-surface rounded-card p-3 border border-border">
              <h3 className="text-label text-accent-text mb-2">差异化卖点</h3>
              <ul className="space-y-1">
                {analysisResult.sellingPoints.map((point: string, index: number) => (
                  <li key={index} className="text-body-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 建议场景 */}
            <div className="bg-surface rounded-card p-3 border border-border">
              <h3 className="text-label text-accent-text mb-2">建议场景</h3>
              <ul className="space-y-1">
                {analysisResult.scenes.map((scene: string, index: number) => (
                  <li key={index} className="text-body-sm text-foreground flex items-start gap-2">
                    <span className="text-muted">{index + 1}.</span>
                    <span>{scene}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 参考图片分析 */}
            {analysisResult.referenceAnalysis && (
              <>
                <div className="border-t border-border-subtle my-3"></div>
                {[
                  { label: '产品外观', value: analysisResult.referenceAnalysis.appearance },
                  { label: '包装特征', value: analysisResult.referenceAnalysis.packaging },
                  { label: '差异化优势', value: analysisResult.referenceAnalysis.competitorDiff },
                  { label: '设计元素', value: analysisResult.referenceAnalysis.designElements },
                ].map((item, i) => (
                  <div key={i} className="bg-surface rounded-card p-3 border border-border">
                    <h3 className="text-label text-accent-text mb-2">{item.label}</h3>
                    <p className="text-body-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
