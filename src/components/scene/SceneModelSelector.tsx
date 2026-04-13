'use client';

// 平台类型（新增 jimeng）
export type ScenePlatform = 'dashscope' | 'openrouter' | 'jimeng';

interface SceneModelSelectorProps {
  platform: ScenePlatform;
  imageModel: string;
  onSetPlatform: (platform: ScenePlatform) => void;
  onSetImageModel: (model: string) => void;
}

// 模型配置
const DASHSCOPE_MODELS = [
  { id: 'wanx2.1-t2i-turbo', name: 'Wanx 2.1 Turbo', desc: '快速生成，免费额度', free: true },
  { id: 'wanx2.1-t2i-plus', name: 'Wanx 2.1 Plus', desc: '高质量，免费额度', free: true },
  { id: 'wanx-v1', name: 'Wanx V1', desc: '基础版本', free: true },
];

const OPENROUTER_MODELS = [
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', desc: '快速生成', price: '$0.014' },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro', desc: '高质量', price: '$0.04' },
];

const JIMENG_MODELS = [
  { id: 'jimeng-4.6', name: '即梦AI 4.6', desc: '最新高美感模型（推荐）', free: true },
  { id: 'jimeng-4.0', name: '即梦AI 4.0', desc: '高美感通用模型', free: true },
  { id: 'jimeng-3.0-i2i', name: '即梦AI 3.0 图生图', desc: '智能参考', free: true },
];

export default function SceneModelSelector({
  platform,
  imageModel,
  onSetPlatform,
  onSetImageModel,
}: SceneModelSelectorProps) {
  const models = platform === 'dashscope'
    ? DASHSCOPE_MODELS
    : platform === 'jimeng'
    ? JIMENG_MODELS
    : OPENROUTER_MODELS;

  const currentModel = models.find(m => m.id === imageModel) || models[0];

  return (
    <div className="flex items-center gap-3 bg-surface rounded-card p-2 border border-border flex-wrap">
      {/* 平台切换 */}
      <div className="flex gap-1">
        <button
          onClick={() => {
            onSetPlatform('dashscope');
            onSetImageModel(DASHSCOPE_MODELS[0].id);
          }}
          className={`px-3 py-[7px] rounded-control text-body-sm font-medium transition-colors ${
            platform === 'dashscope'
              ? 'bg-primary text-white'
              : 'border border-border text-muted hover:text-foreground hover:border-border-strong'
          }`}
        >
          百炼
        </button>
        <button
          onClick={() => {
            onSetPlatform('jimeng');
            onSetImageModel(JIMENG_MODELS[0].id);
          }}
          className={`px-3 py-[7px] rounded-control text-body-sm font-medium transition-colors ${
            platform === 'jimeng'
              ? 'bg-primary text-white'
              : 'border border-border text-muted hover:text-foreground hover:border-border-strong'
          }`}
        >
          即梦AI
        </button>
        <button
          onClick={() => {
            onSetPlatform('openrouter');
            onSetImageModel(OPENROUTER_MODELS[0].id);
          }}
          className={`px-3 py-[7px] rounded-control text-body-sm font-medium transition-colors ${
            platform === 'openrouter'
              ? 'bg-primary text-white'
              : 'border border-border text-muted hover:text-foreground hover:border-border-strong'
          }`}
        >
          OpenRouter
        </button>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-6 bg-border" />

      {/* 模型选择 */}
      <select
        value={imageModel}
        onChange={(e) => onSetImageModel(e.target.value)}
        className="px-3 py-[7px] bg-background border border-border rounded-control text-body-sm text-foreground min-w-[180px] cursor-pointer hover:border-border-strong transition-colors"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} {'price' in model ? `(${model.price})` : ''}
          </option>
        ))}
      </select>

      {/* 当前模型信息 */}
      <span className="text-caption text-muted hidden lg:inline">
        {currentModel.desc}
        {('free' in currentModel && currentModel.free) && (
          <span className="ml-1 text-accent-text">（免费试用）</span>
        )}
      </span>
    </div>
  );
}

// 导出模型配置供其他组件使用
export { DASHSCOPE_MODELS, OPENROUTER_MODELS, JIMENG_MODELS };
