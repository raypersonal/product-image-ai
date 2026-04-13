'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'product-image-ai-save-path';
const DEFAULT_PATH = 'D:\\product-images-output';

interface SavePathSelectorProps {
  onSave: (basePath: string) => void;
  onCancel?: () => void;
  isSaving?: boolean;
  buttonText?: string;
  showChangeButton?: boolean;
}

/**
 * 验证路径是否合法
 */
function validatePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim() === '') {
    return { valid: false, error: '路径不能为空' };
  }

  // Windows 非法字符检查 (除了 : 和 \ 是允许的)
  const invalidChars = /[<>"|?*]/;
  if (invalidChars.test(path)) {
    return { valid: false, error: '路径包含非法字符 (<>"|?*)' };
  }

  // 检查是否是绝对路径
  const isAbsolute = /^[A-Za-z]:\\/.test(path) || path.startsWith('/') || path.startsWith('./');
  if (!isAbsolute) {
    return { valid: false, error: '请输入绝对路径（如 D:\\xxx 或 /xxx）' };
  }

  return { valid: true };
}

/**
 * 获取保存的路径
 */
export function getSavedPath(): string {
  if (typeof window === 'undefined') return DEFAULT_PATH;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PATH;
}

/**
 * 保存路径到 localStorage
 */
export function savePath(path: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, path);
}

/**
 * 保存路径选择器组件
 */
export default function SavePathSelector({
  onSave,
  onCancel,
  isSaving = false,
  buttonText = '💾 保存到本地',
  showChangeButton = true,
}: SavePathSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputPath, setInputPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);

  // 初始化时读取保存的路径
  useEffect(() => {
    const saved = getSavedPath();
    setCurrentPath(saved);
    setInputPath(saved);
  }, []);

  const handleOpenModal = () => {
    setInputPath(currentPath);
    setError(null);
    setShowModal(true);
  };

  const handleConfirm = () => {
    const trimmedPath = inputPath.trim();
    const validation = validatePath(trimmedPath);

    if (!validation.valid) {
      setError(validation.error || '路径无效');
      return;
    }

    // 保存到 localStorage
    savePath(trimmedPath);
    setCurrentPath(trimmedPath);
    setShowModal(false);

    // 触发保存
    onSave(trimmedPath);
  };

  const handleSaveClick = () => {
    // 如果已有保存路径，直接保存
    const saved = getSavedPath();
    if (saved && saved !== DEFAULT_PATH) {
      onSave(saved);
    } else {
      // 首次保存，弹出路径选择
      handleOpenModal();
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setError(null);
    onCancel?.();
  };

  return (
    <>
      {/* 保存按钮组 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="animate-spin">⏳</span>
              保存中...
            </>
          ) : (
            buttonText
          )}
        </button>

        {showChangeButton && (
          <button
            onClick={handleOpenModal}
            disabled={isSaving}
            className="px-2 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary-hover transition-colors disabled:opacity-50"
            title={`当前路径: ${currentPath}`}
          >
            📁
          </button>
        )}
      </div>

      {/* 路径选择模态框 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleCancel}
        >
          <div
            className="bg-surface rounded-modal p-6 w-full max-w-lg shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              选择保存路径
            </h3>

            <div className="space-y-4">
              {/* 路径输入 */}
              <div>
                <label className="block text-sm text-muted mb-2">
                  保存根目录
                </label>
                <input
                  type="text"
                  value={inputPath}
                  onChange={(e) => {
                    setInputPath(e.target.value);
                    setError(null);
                  }}
                  placeholder="例如: D:\产品图输出"
                  className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:border-primary focus:outline-none"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-error">{error}</p>
                )}
              </div>

              {/* 说明 */}
              <div className="text-xs text-muted bg-surface rounded-lg p-3">
                <p className="mb-1">实际保存路径格式：</p>
                <code className="text-primary">
                  {inputPath || '...'}/{'{产品名}'}_{'{时间戳}'}/
                </code>
                <p className="mt-2">• 路径不存在会自动创建</p>
                <p>• 路径会记住，下次自动使用</p>
              </div>

              {/* 快捷选项 */}
              <div>
                <label className="block text-sm text-muted mb-2">
                  快捷选择
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setInputPath('D:\\product-images-output')}
                    className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-secondary-hover transition-colors"
                  >
                    D:\product-images-output
                  </button>
                  <button
                    onClick={() => setInputPath('./output')}
                    className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-secondary-hover transition-colors"
                  >
                    ./output (项目目录)
                  </button>
                  <button
                    onClick={() => setInputPath('C:\\Users\\Administrator\\Desktop\\产品图')}
                    className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-secondary-hover transition-colors"
                  >
                    桌面/产品图
                  </button>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary-hover transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
              >
                确认并保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
