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
    <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2 flex-wrap">
      {/* 平台切换 - 三个按钮 */}
      <div className="flex gap-1">
        <button
          onClick={() => {
            onSetPlatform('dashscope');
            onSetImageModel(DASHSCOPE_MODELS[0].id);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            platform === 'dashscope'
              ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
              : 'border border-gray-500 text-gray-400 hover:text-gray-200 hover:border-gray-400'
          }`}
        >
          🆓 百炼
        </button>
        <button
          onClick={() => {
            onSetPlatform('jimeng');
            onSetImageModel(JIMENG_MODELS[0].id);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            platform === 'jimeng'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'border border-gray-500 text-gray-400 hover:text-gray-200 hover:border-gray-400'
          }`}
        >
          🎨 即梦AI
        </button>
        <button
          onClick={() => {
            onSetPlatform('openrouter');
            onSetImageModel(OPENROUTER_MODELS[0].id);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
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

      {/* 模型选择 */}
      <select
        value={imageModel}
        onChange={(e) => onSetImageModel(e.target.value)}
        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-base text-white min-w-[180px] cursor-pointer hover:border-gray-500 focus:border-green-500 focus:outline-none transition-colors"
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
        {('free' in currentModel && currentModel.free) && (
          <span className="ml-1 text-green-400">（免费试用）</span>
        )}
      </span>
    </div>
  );
}

// 导出模型配置供其他组件使用
export { DASHSCOPE_MODELS, OPENROUTER_MODELS, JIMENG_MODELS };
