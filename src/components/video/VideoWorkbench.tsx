'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import VideoSourcePanel from './VideoSourcePanel';
import VideoPromptEditor from './VideoPromptEditor';
import VideoModelSelector from './VideoModelSelector';
import VideoPreview from './VideoPreview';
import { generateVideoPrompt, getRecommendedEffects } from '@/lib/video/videoPromptGenerator';
import { getImageAspectRatio } from '@/lib/jimengOutpaint';

// 视频工作台状态类型
export interface VideoSourceImage {
  id: string;
  base64: string;
  filename: string;
  source: 'upload' | 'scene';  // 来源：上传 或 场景工作台
  sceneTags?: string[];  // 场景标签（从场景工作台转入时）
}

export interface VideoProductInfo {
  name: string;
  category: string;
  description: string;
}

export interface GeneratedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  cameraMotion: string;
  effects: string[];
  duration: number;
  timestamp: number;
}

export interface VideoState {
  // 图片来源
  sourceImage: VideoSourceImage | null;
  sourceImageRatio: string;  // 源图宽高比
  productInfo: VideoProductInfo;
  // 视频配置
  cameraMotion: string;
  selectedEffects: string[];
  customPrompt: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';  // 目标视频比例
  prompt: string;
  // 生成状态
  isGenerating: boolean;
  generationStatus: 'idle' | 'submitting' | 'outpainting' | 'processing' | 'success' | 'failed';
  generationProgress: number;
  currentVideo: GeneratedVideo | null;
  history: GeneratedVideo[];
  // 错误
  error: string | null;
}

const initialState: VideoState = {
  sourceImage: null,
  sourceImageRatio: '1:1',
  productInfo: { name: '', category: '', description: '' },
  cameraMotion: 'push_in',
  selectedEffects: [],
  customPrompt: '',
  duration: 5,
  aspectRatio: '16:9',  // 默认横屏
  prompt: '',
  isGenerating: false,
  generationStatus: 'idle',
  generationProgress: 0,
  currentVideo: null,
  history: [],
  error: null,
};

interface VideoTransferData {
  image: VideoSourceImage;
  productInfo: VideoProductInfo;
  sceneTags: string[];
}

interface VideoWorkbenchProps {
  transferData?: VideoTransferData | null;
  onClearTransfer?: () => void;
}

export default function VideoWorkbench({ transferData, onClearTransfer }: VideoWorkbenchProps) {
  const [state, setState] = useState<VideoState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 使用 ref 保存最新的 state
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 处理从场景工作台转入的数据
  useEffect(() => {
    if (transferData) {
      const { cameraMotion, effects } = getRecommendedEffects(transferData.sceneTags);

      setState(prev => ({
        ...prev,
        sourceImage: transferData.image,
        productInfo: transferData.productInfo,
        cameraMotion,
        selectedEffects: effects,
      }));

      // 清除转入数据
      if (onClearTransfer) {
        onClearTransfer();
      }
    }
  }, [transferData, onClearTransfer]);

  // 自动生成 Prompt
  useEffect(() => {
    const newPrompt = generateVideoPrompt({
      productName: state.productInfo.name,
      productCategory: state.productInfo.category,
      productDescription: state.productInfo.description,
      cameraMotion: state.cameraMotion,
      selectedEffects: state.selectedEffects,
      customText: state.customPrompt,
      duration: state.duration,
    });
    setState(prev => ({ ...prev, prompt: newPrompt }));
  }, [state.productInfo, state.cameraMotion, state.selectedEffects, state.customPrompt, state.duration]);

  // 设置图片来源（同时计算宽高比）
  const setSourceImage = useCallback((image: VideoSourceImage | null) => {
    if (image) {
      // 从base64获取图片尺寸
      const img = new Image();
      img.onload = () => {
        const ratio = getImageAspectRatio(img.width, img.height);
        setState(prev => ({
          ...prev,
          sourceImage: image,
          sourceImageRatio: ratio,
        }));
      };
      img.src = image.base64;
    } else {
      setState(prev => ({ ...prev, sourceImage: null, sourceImageRatio: '1:1' }));
    }
  }, []);

  // 设置产品信息
  const setProductInfo = useCallback((info: Partial<VideoProductInfo>) => {
    setState(prev => ({
      ...prev,
      productInfo: { ...prev.productInfo, ...info },
    }));
  }, []);

  // 设置运镜
  const setCameraMotion = useCallback((motion: string) => {
    setState(prev => ({ ...prev, cameraMotion: motion }));
  }, []);

  // 切换动效
  const toggleEffect = useCallback((effectId: string) => {
    setState(prev => ({
      ...prev,
      selectedEffects: prev.selectedEffects.includes(effectId)
        ? prev.selectedEffects.filter(id => id !== effectId)
        : [...prev.selectedEffects, effectId],
    }));
  }, []);

  // 设置自定义文本
  const setCustomPrompt = useCallback((text: string) => {
    setState(prev => ({ ...prev, customPrompt: text }));
  }, []);

  // 设置时长
  const setDuration = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  // 设置视频比例
  const setAspectRatio = useCallback((aspectRatio: '16:9' | '9:16' | '1:1') => {
    setState(prev => ({ ...prev, aspectRatio }));
  }, []);

  // 生成视频（包含自动扩图）
  const handleGenerateVideo = useCallback(async () => {
    const currentState = stateRef.current;

    if (!currentState.sourceImage) {
      setState(prev => ({ ...prev, error: '请先上传图片或从场景工作台转入' }));
      return;
    }

    if (!currentState.prompt) {
      setState(prev => ({ ...prev, error: '请生成视频提示词' }));
      return;
    }

    // 检查是否需要扩图
    const needsOutpaint = currentState.sourceImageRatio !== currentState.aspectRatio;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           STARTING VIDEO GENERATION                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Duration: ${currentState.duration}s`);
    console.log(`║ Camera: ${currentState.cameraMotion}`);
    console.log(`║ Effects: ${currentState.selectedEffects.join(', ') || 'none'}`);
    console.log(`║ Source Ratio: ${currentState.sourceImageRatio}`);
    console.log(`║ Target Ratio: ${currentState.aspectRatio}`);
    console.log(`║ Needs Outpaint: ${needsOutpaint}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationStatus: needsOutpaint ? 'outpainting' : 'submitting',
      generationProgress: 0,
      error: null,
    }));

    try {
      let finalImageBase64 = currentState.sourceImage.base64;

      // Step 1: 如果需要扩图，先调用扩图API
      if (needsOutpaint) {
        console.log('>>> Step 1: Outpainting image...');
        setState(prev => ({
          ...prev,
          generationStatus: 'outpainting',
          generationProgress: 10,
        }));

        const outpaintResponse = await fetch('/api/video/outpaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentState.sourceImage.base64,
            targetAspectRatio: currentState.aspectRatio,
            prompt: 'seamlessly extend the background, maintain consistent lighting and style',
          }),
        });

        if (!outpaintResponse.ok) {
          const errorData = await outpaintResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `扩图失败: HTTP ${outpaintResponse.status}`);
        }

        const outpaintResult = await outpaintResponse.json();
        finalImageBase64 = outpaintResult.imageUrl;

        console.log('✅ Outpainting completed, proceeding to video generation...');
        setState(prev => ({
          ...prev,
          generationStatus: 'submitting',
          generationProgress: 40,
        }));
      }

      // Step 2: 生成视频
      console.log('>>> Step 2: Generating video...');
      setState(prev => ({
        ...prev,
        generationStatus: 'processing',
        generationProgress: needsOutpaint ? 50 : 20,
      }));

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: finalImageBase64,
          prompt: currentState.prompt,
          duration: currentState.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      const newVideo: GeneratedVideo = {
        id: `video-${Date.now()}`,
        videoUrl: result.videoUrl,
        thumbnailUrl: finalImageBase64,  // 使用扩图后的图片作为缩略图
        prompt: currentState.prompt,
        cameraMotion: currentState.cameraMotion,
        effects: currentState.selectedEffects,
        duration: currentState.duration,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationStatus: 'success',
        generationProgress: 100,
        currentVideo: newVideo,
        history: [newVideo, ...prev.history].slice(0, 10),
      }));

      console.log('✅ Video generation completed!');
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationStatus: 'failed',
        error: error instanceof Error ? error.message : '视频生成失败',
      }));
    }
  }, []);

  // 下载视频
  const handleDownload = useCallback(async (video: GeneratedVideo) => {
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${video.id}_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setSaveError('下载失败');
    }
  }, []);

  // 选择历史视频
  const handleSelectHistory = useCallback((video: GeneratedVideo) => {
    setState(prev => ({ ...prev, currentVideo: video }));
  }, []);

  // 保存到本地
  const handleSaveToLocal = useCallback(async (basePath: string) => {
    if (!state.currentVideo) {
      setSaveError('没有可保存的视频');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/video/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: state.currentVideo.videoUrl,
          productName: state.productInfo.name || 'video',
          basePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      console.log('✅ Video saved to:', data.filePath);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [state.currentVideo, state.productInfo.name]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <h1 className="font-bold text-foreground">视频工作台</h1>
          <span className="text-xs text-muted px-2 py-0.5 bg-secondary rounded">Beta</span>
        </div>

        {/* 模型选择器 */}
        <VideoModelSelector />
      </div>

      {/* 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左栏：图片来源 */}
        <div className="w-1/4 min-w-[280px] border-r border-border overflow-y-auto">
          <VideoSourcePanel
            sourceImage={state.sourceImage}
            productInfo={state.productInfo}
            onSetSourceImage={setSourceImage}
            onSetProductInfo={setProductInfo}
          />
        </div>

        {/* 中栏：视频配置 */}
        <div className="w-[35%] min-w-[320px] border-r border-border overflow-y-auto">
          <VideoPromptEditor
            cameraMotion={state.cameraMotion}
            selectedEffects={state.selectedEffects}
            customPrompt={state.customPrompt}
            duration={state.duration}
            prompt={state.prompt}
            aspectRatio={state.aspectRatio}
            sourceImageRatio={state.sourceImageRatio}
            onSetCameraMotion={setCameraMotion}
            onToggleEffect={toggleEffect}
            onSetCustomPrompt={setCustomPrompt}
            onSetDuration={setDuration}
            onSetAspectRatio={setAspectRatio}
          />
        </div>

        {/* 右栏：预览 & 生成 */}
        <div className="flex-1 min-w-[360px] overflow-y-auto">
          <VideoPreview
            isGenerating={state.isGenerating}
            generationStatus={state.generationStatus}
            generationProgress={state.generationProgress}
            currentVideo={state.currentVideo}
            history={state.history}
            sourceImage={state.sourceImage}
            error={state.error}
            onGenerate={handleGenerateVideo}
            onDownload={handleDownload}
            onSelectHistory={handleSelectHistory}
            isSaving={isSaving}
            saveError={saveError}
            onSaveToLocal={handleSaveToLocal}
            onClearError={() => setState(prev => ({ ...prev, error: null }))}
          />
        </div>
      </div>
    </div>
  );
}
