import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGemini, analyzeWithGeminiMock, GeminiAnalysisInput } from '@/lib/scene/geminiVision';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productImageBase64,
      productName,
      productCategory,
      productDescription,
      sceneTags,
      styleTags,
      referenceWeight,
      useMock,
    } = body as GeminiAnalysisInput & { useMock?: boolean };

    // 验证必要参数
    if (!productImageBase64) {
      return NextResponse.json(
        { error: '请先上传产品图片' },
        { status: 400 }
      );
    }

    const input: GeminiAnalysisInput = {
      productImageBase64,
      productName: productName || '',
      productCategory: productCategory || '',
      productDescription: productDescription || '',
      sceneTags: sceneTags || [],
      styleTags: styleTags || [],
      referenceWeight: referenceWeight || 50,
    };

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SCENE ANALYZE API - REQUEST RECEIVED              ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Product Name: ${productName || '(empty)'}`);
    console.log(`║ Category: ${productCategory || '(empty)'}`);
    console.log(`║ Scene Tags: ${sceneTags?.join(', ') || '(none)'}`);
    console.log(`║ Style Tags: ${styleTags?.join(', ') || '(none)'}`);
    console.log(`║ Reference Weight: ${referenceWeight}%`);
    console.log(`║ Use Mock: ${useMock}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 使用 Mock 或真实 API
    if (useMock) {
      console.log('>>> Using MOCK Gemini analysis...');
      const result = await analyzeWithGeminiMock(input);
      return NextResponse.json(result);
    }

    // 获取 API Key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 OPENROUTER_API_KEY 以使用 Gemini 分析' },
        { status: 400 }
      );
    }

    console.log('>>> Calling REAL Gemini Vision API...');
    const result = await analyzeWithGemini(input, apiKey);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SCENE ANALYZE API - RESPONSE                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Product Lock Description Length: ${result.productLockDescription.length} chars`);
    console.log(`║ Final Prompt Length: ${result.prompt.length} chars`);
    console.log(`║ Has Negative Prompt: ${!!result.negativePrompt}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    return NextResponse.json(result);
  } catch (error) {
    console.error('\n❌ Scene Analyze API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '分析失败，请重试' },
      { status: 500 }
    );
  }
}
