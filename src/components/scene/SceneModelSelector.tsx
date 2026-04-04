'use client';

interface SceneModelSelectorProps {
  platform: 'dashscope' | 'openrouter';
  imageModel: string;
  onSetPlatform: (platform: 'dashscope' | 'openrouter') => void;
  onSetImageModel: (model: string) => void;
}

// 模型配置
const DASHSCOPE_MODELS = [
  { id: 'wanx2.1-t2i-turbo', name: 'Wanx 2.1 Turbo', desc: '快速生成，免费额度', free: true },
  { id: 'wanx2.1-t2i-plus', name: 'Wanx 2.1 Plus', desc: '高质量，免费额度', free: true },
  { id: 'wanx-v1', name: 'Wanx V1', desc: '基础版本', free: true },
];

const OPENROUTER_MODELS = [
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', desc: '快速生成', price: '$0.003' },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro', desc: '高质量', price: '$0.04' },
];

export default function SceneModelSelector({
  platform,
  imageModel,
  onSetPlatform,
  onSetImageModel,
}: SceneModelSelectorProps) {
  const models = platform === 'dashscope' ? DASHSCOPE_MODELS : OPENROUTER_MODELS;
  const currentModel = models.find(m => m.id === imageModel) || models[0];

  return (
    <div className="flex items-center gap-3">
      {/* 平台切换 */}
      <div className="flex bg-secondary rounded-lg p-0.5">
        <button
          onClick={() => {
            onSetPlatform('dashscope');
            onSetImageModel(DASHSCOPE_MODELS[0].id);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            platform === 'dashscope'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-foreground'
          }`}
        >
          🆓 百炼
        </button>
        <button
          onClick={() => {
            onSetPlatform('openrouter');
            onSetImageModel(OPENROUTER_MODELS[0].id);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            platform === 'openrouter'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-foreground'
          }`}
        >
          💰 OpenRouter
        </button>
      </div>

      {/* 模型选择 */}
      <select
        value={imageModel}
        onChange={(e) => onSetImageModel(e.target.value)}
        className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground min-w-[180px]"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} {platform === 'openrouter' ? `(${model.price})` : ''}
          </option>
        ))}
      </select>

      {/* 当前模型信息 */}
      <span className="text-xs text-muted hidden lg:inline">
        {currentModel.desc}
      </span>
    </div>
  );
}

// 导出模型配置供其他组件使用
export { DASHSCOPE_MODELS, OPENROUTER_MODELS };
