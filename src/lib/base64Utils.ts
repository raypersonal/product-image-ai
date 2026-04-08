/**
 * Base64 工具函数
 * 用于处理即梦API等需要纯base64数据的场景
 */

/**
 * 从 data URL 或带前缀的 base64 字符串中提取纯 base64 数据
 * @param input 可能包含 "data:image/xxx;base64," 前缀的字符串
 * @returns 纯 base64 字符串（不含前缀）
 */
export function stripBase64Prefix(input: string): string {
  if (!input) return '';

  // 如果包含逗号，说明是 data URL 格式，取逗号后面的部分
  if (input.includes(',')) {
    return input.split(',')[1];
  }

  // 如果以 http 开头，说明是 URL，不是 base64
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.warn('stripBase64Prefix: 收到 URL 而非 base64，需要先下载图片');
    return input; // 返回原值，调用方需要处理
  }

  // 已经是纯 base64
  return input;
}

/**
 * 检查字符串是否为远程 URL
 */
export function isRemoteUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * 将远程图片 URL 转换为 base64（仅服务端可用）
 * @param url 图片 URL
 * @param customFetch 可选的自定义 fetch 函数（用于代理等场景）
 * @returns 纯 base64 字符串（不含前缀）
 */
export async function fetchImageAsBase64(
  url: string,
  customFetch?: typeof fetch
): Promise<string> {
  console.log(`>>> fetchImageAsBase64: downloading from ${url.substring(0, 60)}...`);

  const fetchFn = customFetch || fetch;
  const response = await fetchFn(url);
  if (!response.ok) {
    console.error(`>>> fetchImageAsBase64 failed: HTTP ${response.status}`);
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  console.log(`>>> fetchImageAsBase64 success: ${base64.length} chars`);
  return base64;
}

/**
 * 确保返回纯 base64 数据
 * 支持 data URL、纯 base64、远程 URL 三种输入
 * @param input 输入字符串
 * @param customFetch 可选的自定义 fetch 函数（用于代理下载字节系域名）
 * @returns 纯 base64 字符串
 */
export async function ensurePureBase64(
  input: string,
  customFetch?: typeof fetch
): Promise<string> {
  if (!input) {
    throw new Error('输入不能为空');
  }

  // 如果是远程 URL，需要下载
  if (isRemoteUrl(input)) {
    console.log('>>> 检测到远程 URL，正在下载转换为 base64...');
    return await fetchImageAsBase64(input, customFetch);
  }

  // 去除 data URL 前缀
  return stripBase64Prefix(input);
}
