'use client';

import { useState, useMemo, useEffect } from 'react';
import { SCENE_TAG_CATEGORIES, SceneTag, searchTags } from '@/lib/scene/sceneTags';

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

  // 搜索关键词
  const [searchQuery, setSearchQuery] = useState('');

  // 展开状态（默认只展开前两个分类：节日/场合 和 色彩主题）
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SCENE_TAG_CATEGORIES.forEach(cat => {
      initial[cat.id] = cat.defaultExpanded ?? false;
    });
    return initial;
  });

  // 搜索时展开所有分类
  const isSearching = searchQuery.trim().length > 0;

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!isSearching) return null;
    return searchTags(searchQuery);
  }, [searchQuery, isSearching]);

  // 搜索模式下匹配的标签ID集合
  const matchedTagIds = useMemo(() => {
    if (!searchResults) return new Set<string>();
    return new Set(searchResults.map(t => t.id));
  }, [searchResults]);

  // 每个分类的已选数量
  const selectedCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    SCENE_TAG_CATEGORIES.forEach(cat => {
      counts[cat.id] = cat.tags.filter(tag => selectedTags.includes(tag.id)).length;
    });
    return counts;
  }, [selectedTags]);

  // 切换分类展开状态
  const toggleCategory = (categoryId: string) => {
    if (isSearching) return; // 搜索时不允许手动折叠
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 清空搜索时恢复默认折叠状态
  useEffect(() => {
    if (!isSearching) {
      setExpandedCategories(() => {
        const initial: Record<string, boolean> = {};
        SCENE_TAG_CATEGORIES.forEach(cat => {
          initial[cat.id] = cat.defaultExpanded ?? false;
        });
        return initial;
      });
    }
  }, [isSearching]);

  // 判断分类是否应该显示（搜索时只显示有匹配结果的分类）
  const shouldShowCategory = (category: typeof SCENE_TAG_CATEGORIES[0]) => {
    if (!isSearching) return true;
    return category.tags.some(tag => matchedTagIds.has(tag.id));
  };

  // 获取分类中要显示的标签
  const getVisibleTags = (category: typeof SCENE_TAG_CATEGORIES[0]) => {
    if (!isSearching) return category.tags;
    return category.tags.filter(tag => matchedTagIds.has(tag.id));
  };

  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          场景快捷标签
          {hasSelection && (
            <span className="ml-2 text-xs text-green-500">
              已选 {selectedTags.length} 个
            </span>
          )}
        </label>
        {hasSelection && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            清空选择
          </button>
        )}
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索标签（中文/英文）..."
          className="w-full px-3 py-2 pl-9 bg-[#1f2937] border border-gray-700 rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* 搜索结果提示 */}
      {isSearching && (
        <div className="text-xs text-gray-400">
          找到 {searchResults?.length || 0} 个匹配标签
        </div>
      )}

      {/* 分类标签区 */}
      <div className="space-y-2">
        {SCENE_TAG_CATEGORIES.map((category) => {
          if (!shouldShowCategory(category)) return null;

          const isExpanded = isSearching || expandedCategories[category.id];
          const selectedCount = selectedCountByCategory[category.id];
          const hasSelectedInCategory = selectedCount > 0;
          const visibleTags = getVisibleTags(category);

          return (
            <div key={category.id} className="border border-gray-700/50 rounded-lg overflow-hidden">
              {/* 分类标题 - 可点击展开/折叠 */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full px-3 py-2 flex items-center justify-between text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors ${
                  isSearching ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 展开/折叠箭头 */}
                  <span
                    className={`text-xs transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span>{category.name}</span>
                  {/* 已选数量 */}
                  {hasSelectedInCategory && (
                    <span className="text-xs text-green-500">
                      已选{selectedCount}个
                    </span>
                  )}
                </div>
                {/* 折叠时有选中的绿点提示 */}
                {!isExpanded && hasSelectedInCategory && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* 标签按钮区 - 带动画 */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-3 pb-3 pt-1">
                  {/* 标签按钮 - 移动端横向滚动，桌面端换行 */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-700">
                    {visibleTags.map((tag: SceneTag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => onToggleTag(tag.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                            isSelected
                              ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                              : 'bg-[#374151] text-gray-300 hover:text-white hover:bg-[#4b5563]'
                          }`}
                        >
                          <span className="mr-1">{tag.emoji}</span>
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中标签预览 */}
      {hasSelection && (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">已选场景组合:</div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagId) => {
              const tag = SCENE_TAG_CATEGORIES
                .flatMap(c => c.tags)
                .find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs"
                >
                  {tag.emoji} {tag.en}
                  <button
                    onClick={() => onToggleTag(tagId)}
                    className="ml-0.5 hover:text-red-400"
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
