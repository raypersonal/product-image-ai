import { NextRequest, NextResponse } from 'next/server';

interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface FeishuRecordsResponse {
  code: number;
  msg: string;
  data?: {
    items: Array<{
      record_id: string;
      fields: Record<string, unknown>;
    }>;
    has_more: boolean;
    page_token?: string;
    total: number;
  };
}

async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });

  const data: FeishuTokenResponse = await response.json();

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取飞书Token失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appToken = searchParams.get('appToken');
    const tableId = searchParams.get('tableId');
    // 优先使用环境变量，其次使用前端传来的参数
    const appId = process.env.FEISHU_APP_ID || searchParams.get('appId');
    const appSecret = process.env.FEISHU_APP_SECRET || searchParams.get('appSecret');

    if (!appToken || !tableId) {
      return NextResponse.json(
        { error: '缺少必要参数：appToken 或 tableId' },
        { status: 400 }
      );
    }

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: '请先配置飞书 App ID 和 App Secret' },
        { status: 400 }
      );
    }

    // 获取 tenant_access_token
    const tenantAccessToken = await getTenantAccessToken(appId, appSecret);

    // 获取多维表格记录
    const recordsResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=100`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tenantAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const recordsData: FeishuRecordsResponse = await recordsResponse.json();

    if (recordsData.code !== 0) {
      return NextResponse.json(
        { error: `获取飞书记录失败: ${recordsData.msg}` },
        { status: 500 }
      );
    }

    const records = recordsData.data?.items || [];

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Feishu API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取飞书数据失败，请检查配置' },
      { status: 500 }
    );
  }
}
