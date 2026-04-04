'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [feishuAppId, setFeishuAppId] = useState('');
  const [feishuAppSecret, setFeishuAppSecret] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载配置
    if (typeof window !== 'undefined') {
      setOpenrouterApiKey(localStorage.getItem('openrouterApiKey') || '');
      setFeishuAppId(localStorage.getItem('feishuAppId') || '');
      setFeishuAppSecret(localStorage.getItem('feishuAppSecret') || '');
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('openrouterApiKey', openrouterApiKey);
    localStorage.setItem('feishuAppId', feishuAppId);
    localStorage.setItem('feishuAppSecret', feishuAppSecret);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-secondary">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted hover:text-foreground transition-colors"
            >
              ← 返回
            </Link>
            <h1 className="text-lg font-bold text-foreground">API 配置</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* OpenRouter API Key */}
          <section className="bg-secondary rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">OpenRouter API Key</h2>
            <p className="text-sm text-muted mb-4">
              用于调用 AI 模型进行产品分析和图片生成
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                API Key
              </label>
              <input
                type="password"
                value={openrouterApiKey}
                onChange={(e) => setOpenrouterApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted"
              />
            </div>

            <div className="bg-background rounded-lg p-4 text-sm">
              <h3 className="font-medium text-foreground mb-2">如何获取 OpenRouter API Key：</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted">
                <li>访问 <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai</a></li>
                <li>注册/登录账号</li>
                <li>进入 Keys 页面创建新的 API Key</li>
                <li>复制 Key 粘贴到上方输入框</li>
              </ol>
            </div>
          </section>

          {/* Feishu App */}
          <section className="bg-secondary rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">飞书应用配置</h2>
            <p className="text-sm text-muted mb-4">
              用于从飞书多维表格读取产品数据（可选）
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  App ID
                </label>
                <input
                  type="text"
                  value={feishuAppId}
                  onChange={(e) => setFeishuAppId(e.target.value)}
                  placeholder="cli_xxxxxxxx"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  App Secret
                </label>
                <input
                  type="password"
                  value={feishuAppSecret}
                  onChange={(e) => setFeishuAppSecret(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted"
                />
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 text-sm mt-4">
              <h3 className="font-medium text-foreground mb-2">如何获取飞书应用凭证：</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted">
                <li>访问 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">飞书开放平台</a></li>
                <li>创建企业自建应用</li>
                <li>在「凭证与基础信息」中获取 App ID 和 App Secret</li>
                <li>在「权限管理」中添加「多维表格」相关权限</li>
                <li>发布应用并通过审核</li>
              </ol>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary-hover transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-primary text-background rounded-lg font-medium hover:bg-primary-hover transition-colors"
            >
              {saved ? '✓ 已保存' : '保存配置'}
            </button>
          </div>

          {/* Notice */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-sm text-warning">
            <strong>注意：</strong>API Key 保存在浏览器本地存储中，不会上传到服务器。
            但建议不要在公共电脑上保存敏感信息。
          </div>
        </div>
      </main>
    </div>
  );
}
