/**
 * 火山引擎 V4 签名算法
 * 参考 AWS Signature Version 4，适配火山引擎 visual.volcengineapi.com
 */

import crypto from 'crypto';

// 签名配置
const ALGORITHM = 'HMAC-SHA256';
const SERVICE = 'cv';
const REGION = 'cn-north-1';

interface SignatureConfig {
  accessKeyId: string;
  secretAccessKey: string;
  method: string;
  host: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  timestamp?: Date;
}

/**
 * 计算 HMAC-SHA256
 */
function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

/**
 * 计算 SHA256 哈希
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * 格式化日期为 YYYYMMDD
 */
function formatDateShort(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 格式化日期为 ISO8601 基础格式 YYYYMMDDTHHmmssZ
 */
function formatDateISO8601(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * URI 编码（符合 AWS 规范）
 */
function uriEncode(str: string, encodeSlash = true): string {
  const result = encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');

  return encodeSlash ? result : result.replace(/%2F/g, '/');
}

/**
 * 构建规范请求字符串
 */
function buildCanonicalRequest(
  method: string,
  path: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  signedHeaders: string[],
  payloadHash: string
): string {
  // 规范化查询字符串（按参数名排序）
  const canonicalQueryString = Object.keys(query)
    .sort()
    .map(key => `${uriEncode(key)}=${uriEncode(query[key])}`)
    .join('&');

  // 规范化请求头（按名称排序，小写）
  const canonicalHeaders = signedHeaders
    .map(name => `${name.toLowerCase()}:${headers[name].trim()}\n`)
    .join('');

  const signedHeadersStr = signedHeaders.map(h => h.toLowerCase()).join(';');

  return [
    method,
    uriEncode(path, false),
    canonicalQueryString,
    canonicalHeaders,
    signedHeadersStr,
    payloadHash,
  ].join('\n');
}

/**
 * 构建待签名字符串
 */
function buildStringToSign(
  timestamp: string,
  credentialScope: string,
  canonicalRequestHash: string
): string {
  return [
    ALGORITHM,
    timestamp,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');
}

/**
 * 计算签名密钥
 */
function deriveSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSha256(secretKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'request');
  return kSigning;
}

/**
 * 生成火山引擎 V4 签名
 */
export function signRequest(config: SignatureConfig): {
  headers: Record<string, string>;
  authorization: string;
} {
  const timestamp = config.timestamp || new Date();
  const dateStamp = formatDateShort(timestamp);
  const amzDate = formatDateISO8601(timestamp);

  // Payload hash
  const payloadHash = sha256(config.body);

  // 准备要签名的请求头（不包含 x-content-sha256，测试脚本证明不需要）
  const headersToSign: Record<string, string> = {
    ...config.headers,
    host: config.host,
    'x-date': amzDate,
  };

  // 签名头列表（必须包含 host 和 x-date）
  const signedHeaders = Object.keys(headersToSign)
    .filter(h => ['host', 'content-type', 'x-date'].includes(h.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // 构建规范请求
  const canonicalRequest = buildCanonicalRequest(
    config.method,
    config.path,
    config.query,
    headersToSign,
    signedHeaders,
    payloadHash
  );

  // Credential Scope
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/request`;

  // 构建待签名字符串
  const stringToSign = buildStringToSign(
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  );

  // 计算签名
  const signingKey = deriveSigningKey(config.secretAccessKey, dateStamp, REGION, SERVICE);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  // 构建 Authorization 头
  const authorization = [
    `${ALGORITHM} Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders.map(h => h.toLowerCase()).join(';')}`,
    `Signature=${signature}`,
  ].join(', ');

  return {
    headers: {
      'X-Date': amzDate,
      'Authorization': authorization,
    },
    authorization,
  };
}

/**
 * 发送已签名的请求到火山引擎
 */
export async function sendSignedRequest(
  accessKeyId: string,
  secretAccessKey: string,
  action: string,
  version: string,
  body: object
): Promise<Response> {
  const host = 'visual.volcengineapi.com';
  const path = '/';
  const method = 'POST';

  const query: Record<string, string> = {
    Action: action,
    Version: version,
  };

  const bodyStr = JSON.stringify(body);

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const { headers: signedHeaders } = signRequest({
    accessKeyId,
    secretAccessKey,
    method,
    host,
    path,
    query,
    headers: baseHeaders,
    body: bodyStr,
  });

  const queryString = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `https://${host}${path}?${queryString}`;

  return fetch(url, {
    method,
    headers: {
      ...baseHeaders,
      ...signedHeaders,
    },
    body: bodyStr,
  });
}
