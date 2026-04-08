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
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', desc: '快速生成', price: '$0.014' },
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
    <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
      {/* 平台切换 - 更显眼的按钮样式 */}
      <div className="flex gap-1">
        <button
          onClick={() => {
            onSetPlatform('dashscope');
            onSetImageModel(DASHSCOPE_MODELS[0].id);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            platform === 'dashscope'
              ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
              : 'border border-gray-500 text-gray-400 hover:text-gray-200 hover:border-gray-400'
          }`}
        >
          🆓 百炼（免费）
        </button>
        <button
          onClick={() => {
            onSetPlatform('openrouter');
            onSetImageModel(OPENROUTER_MODELS[0].id);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            platform === 'openrouter'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
              : 'border border-gray-500 text-gray-400 hover:text-gray-200 hover:border-gray-400'
          }`}
        >
          💰 OpenRouter
        </button>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-8 bg-gray-600" />

      {/* 模型选择 - 更大的字号 */}
      <select
        value={imageModel}
        onChange={(e) => onSetImageModel(e.target.value)}
        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-base text-white min-w-[200px] cursor-pointer hover:border-gray-500 focus:border-green-500 focus:outline-none transition-colors"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} {'price' in model ? `(${model.price})` : ''}
          </option>
        ))}
      </select>

      {/* 当前模型信息 */}
      <span className="text-sm text-gray-400 hidden lg:inline">
        {currentModel.desc}
      </span>
    </div>
  );
}

// 导出模型配置供其他组件使用
export { DASHSCOPE_MODELS, OPENROUTER_MODELS };
