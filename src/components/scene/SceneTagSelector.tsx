'use client';

import { SCENE_TAG_CATEGORIES, SceneTag } from '@/lib/scene/sceneTags';

interface SceneTagSelectorProps {
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearAll: () => void;
}

export default function SceneTagSelector({
  selectedTags,
  onToggleTag,
  onClearAll,
}: SceneTagSelectorProps) {
  const hasSelection = selectedTags.length > 0;

  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          场景快捷标签
          {hasSelection && (
            <span className="ml-2 text-xs text-primary">
              已选 {selectedTags.length} 个
            </span>
          )}
        </label>
        {hasSelection && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted hover:text-error transition-colors"
          >
            清空选择
          </button>
        )}
      </div>

      {/* 分类标签区 */}
      <div className="space-y-3">
        {SCENE_TAG_CATEGORIES.map((category) => (
          <div key={category.id}>
            {/* 分类名称 */}
            <div className="text-xs text-muted mb-1.5">{category.name}</div>

            {/* 标签按钮 */}
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map((tag: SceneTag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary text-background shadow-sm shadow-primary/30'
                        : 'bg-secondary text-muted hover:text-foreground hover:bg-secondary-hover'
                    }`}
                  >
                    <span className="mr-1">{tag.emoji}</span>
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 选中标签预览 */}
      {hasSelection && (
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted mb-1">已选场景组合:</div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagId) => {
              const tag = SCENE_TAG_CATEGORIES
                .flatMap(c => c.tags)
                .find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded text-xs"
                >
                  {tag.emoji} {tag.en}
                  <button
                    onClick={() => onToggleTag(tagId)}
                    className="ml-0.5 hover:text-error"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
