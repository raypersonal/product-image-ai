'use client';

export default function VideoModelSelector() {
  return (
    <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
      {/* 即梦AI - 当前可用 */}
      <button
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white shadow-md shadow-purple-600/30"
      >
        🎬 即梦AI 视频3.0
      </button>

      {/* 可灵AI - 即将上线 */}
      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-500 text-gray-500 cursor-not-allowed"
        title="即将上线"
      >
        🎥 可灵AI（即将上线）
      </button>

      {/* 分辨率标签 */}
      <span className="text-xs text-gray-400 ml-2">
        1080P | 免费试用
      </span>
    </div>
  );
}
