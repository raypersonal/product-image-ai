'use client';

export default function VideoModelSelector() {
  return (
    <div className="flex items-center gap-3 bg-surface rounded-card p-2 border border-border">
      {/* 即梦AI - 当前可用 */}
      <button
        className="px-3 py-[7px] rounded-control text-body-sm font-medium bg-primary text-white"
      >
        即梦AI 视频3.0
      </button>

      {/* 可灵AI - 即将上线 */}
      <button
        disabled
        className="px-3 py-[7px] rounded-control text-body-sm font-medium border border-border text-text-disabled cursor-not-allowed"
        title="即将上线"
      >
        可灵AI（即将上线）
      </button>

      {/* 分辨率标签 */}
      <span className="text-caption text-muted ml-2">
        1080P | 免费试用
      </span>
    </div>
  );
}
