/**
 * 支持代理的 fetch 工具
 * 用于下载火山引擎/字节域名的文件
 *
 * 使用 undici 的 ProxyAgent（Node.js 18+ 内置的 fetch 基于 undici）
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici';

// 需要代理的域名列表
const PROXY_DOMAINS = [
  'tosv.byted.org',
  'byteimg.com',
  'bytedance.com',
  'volcengine.com',
];

/**
 * 检查 URL 是否需要代理
 */
function needsProxy(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return PROXY_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * 支持代理的 fetch
 * 自动检测 HTTP_PROXY 环境变量和需要代理的域名
 */
export async function proxyFetch(urlInput: string | URL | RequestInfo, options?: RequestInit): Promise<Response> {
  const url = typeof urlInput === 'string' ? urlInput : urlInput instanceof URL ? urlInput.toString() : urlInput.url;
  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;

  // 如果有代理配置且 URL 需要代理
  if (proxyUrl && needsProxy(url)) {
    console.log(`>>> Using proxy: ${proxyUrl} for ${new URL(url).hostname}`);

    const dispatcher = new ProxyAgent(proxyUrl);

    // 使用 undici 的 fetch，它原生支持 dispatcher
    const response = await undiciFetch(url, {
      ...options,
      dispatcher,
    } as Parameters<typeof undiciFetch>[1]);

    // 转换为标准 Response（类型兼容）
    return response as unknown as Response;
  }

  // 不需要代理，直接请求
  return fetch(url, options);
}

/**
 * 下载文件并返回 Buffer
 */
export async function downloadFile(url: string): Promise<Buffer> {
  console.log(`>>> Downloading: ${url.substring(0, 80)}...`);

  const response = await proxyFetch(url);

  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
