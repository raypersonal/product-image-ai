/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 增加 Server Actions 请求体大小限制，支持大图片上传
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
