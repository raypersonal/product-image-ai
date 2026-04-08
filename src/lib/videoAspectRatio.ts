/**
 * 视频宽高比相关的类型和工具函数
 * 可在客户端和服务端使用
 */

// 视频宽高比配置
export const VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 横屏', width: 1920, height: 1080, icon: '📺' },
  { id: '9:16', label: '9:16 竖屏', width: 1080, height: 1920, icon: '📱' },
  { id: '1:1', label: '1:1 方形', width: 1080, height: 1080, icon: '⬜' },
] as const;

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

/**
 * 计算图片宽高比类型
 */
export function getImageAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (ratio > 1.5) return '16:9';
  if (ratio < 0.7) return '9:16';
  return '1:1';
}
