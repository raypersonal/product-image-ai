/**
 * 视频生成相关常量
 * 可以在客户端和服务端使用
 */

// 视频模型配置
export const JIMENG_VIDEO_MODELS = {
  // 图生视频 3.0 (1080P)
  img2video: {
    reqKey: 'jimeng_i2v_lite_v30_1080',
    name: '即梦AI 图生视频3.0',
    desc: '1080P高清视频生成',
    resolution: '1080P',
  },
  // 文生视频 3.0 (1080P)
  text2video: {
    reqKey: 'jimeng_t2v_v30_1080p',
    name: '即梦AI 文生视频3.0',
    desc: '1080P文字生成视频',
    resolution: '1080P',
  },
};

// 视频时长选项
export const VIDEO_DURATION_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
];
