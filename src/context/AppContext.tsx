'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, SetStateAction } from 'react';
import {
  ProductInfo,
  AnalysisResult,
  ImagePrompt,
  GeneratedImage,
  ReferenceImage,
  ALL_IMAGE_TYPES,
  ImageTypeId,
  getTypeConfig,
} from '@/types';

// 初始化默认的 enabledTypes（核心类型启用，附加类型禁用）
function getDefaultEnabledTypes(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  ALL_IMAGE_TYPES.forEach(t => {
    result[t.id] = t.isCore;
  });
  return result;
}

// 初始化默认的 typeSizeMap
function getDefaultTypeSizeMap(): Record<string, string> {
  const result: Record<string, string> = {};
  ALL_IMAGE_TYPES.forEach(t => {
    result[t.id] = t.defaultSize;
  });
  return result;
}

interface AppState {
  currentStep: number;
  productInfo: ProductInfo;
  referenceImages: ReferenceImage[];
  analysisResult: AnalysisResult | null;
  prompts: ImagePrompt[];
  images: GeneratedImage[];
  isAnalyzing: boolean;
  isGeneratingPrompts: boolean;
  // 分析模型（Step 2）
  analyzeModel: string;
  // Vision模型（参考图分析）
  visionModel: string;
  // 图片生成模型（Step 4）
  selectedModel: string;
  // Prompt 生成模型（Step 3）
  promptModel: string;
  // 每个类型的启用状态
  enabledTypes: Record<string, boolean>;
  // 每个类型的尺寸
  typeSizeMap: Record<string, string>;
}

interface AppContextType extends AppState {
  setCurrentStep: (step: number) => void;
  setProductInfo: (info: ProductInfo) => void;
  setReferenceImages: (images: ReferenceImage[]) => void;
  addReferenceImage: (image: ReferenceImage) => void;
  updateReferenceImage: (id: string, updates: Partial<ReferenceImage>) => void;
  removeReferenceImage: (id: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setPrompts: (prompts: ImagePrompt[]) => void;
  updatePrompt: (id: string, newPrompt: string) => void;
  setImages: (images: SetStateAction<GeneratedImage[]>) => void;
  updateImage: (id: string, updates: Partial<GeneratedImage>) => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsGeneratingPrompts: (value: boolean) => void;
  setAnalyzeModel: (model: string) => void;
  setVisionModel: (model: string) => void;
  setSelectedModel: (model: string) => void;
  setPromptModel: (model: string) => void;
  // 类型启用/禁用
  toggleType: (typeId: string) => void;
  setEnabledTypes: (types: Record<string, boolean>) => void;
  enableAllTypes: () => void;
  disableAllTypes: () => void;
  enableCoreTypesOnly: () => void;
  // 类型尺寸
  setTypeSize: (typeId: string, size: string) => void;
  setTypeSizeMap: (map: Record<string, string>) => void;
  // 计算辅助
  getEnabledTypes: () => string[];
  getTotalImageCount: () => number;
  getEnabledTypeConfigs: () => typeof ALL_IMAGE_TYPES;
  // 初始化和步骤控制
  initializeImages: () => void;
  canProceedToStep: (step: number) => boolean;
  // 向后兼容
  selectedSize: string;
  setSelectedSize: (size: string) => void;
}

const defaultProductInfo: ProductInfo = {
  name: '',
  category: 'birthday',
  description: '',
  sellingPoints: [''],
  targetAudience: '',
  stylePreferences: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [productInfo, setProductInfo] = useState<ProductInfo>(defaultProductInfo);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  // 分析模型：默认使用百炼 qwen-plus
  const [analyzeModel, setAnalyzeModel] = useState('qwen-plus');
  // Vision模型：默认使用百炼 qwen-vl-plus
  const [visionModel, setVisionModel] = useState('qwen-vl-plus');
  // 图片生成模型：默认使用百炼 wanx2.1-t2i-turbo（免费额度）
  const [selectedModel, setSelectedModel] = useState('wanx2.1-t2i-turbo');
  // Prompt生成模型：默认使用百炼 qwen-plus
  const [promptModel, setPromptModel] = useState('qwen-plus');
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>(getDefaultEnabledTypes);
  const [typeSizeMap, setTypeSizeMap] = useState<Record<string, string>>(getDefaultTypeSizeMap);

  // 向后兼容：selectedSize 用第一个启用类型的尺寸
  const selectedSize = useMemo(() => {
    const firstEnabled = ALL_IMAGE_TYPES.find(t => enabledTypes[t.id]);
    return firstEnabled ? (typeSizeMap[firstEnabled.id] || firstEnabled.defaultSize) : '1:1';
  }, [enabledTypes, typeSizeMap]);

  const setSelectedSize = useCallback((size: string) => {
    // 向后兼容：设置所有类型的尺寸
    setTypeSizeMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = size;
      });
      return next;
    });
  }, []);

  const addReferenceImage = useCallback((image: ReferenceImage) => {
    setReferenceImages(prev => [...prev, image]);
  }, []);

  const updateReferenceImage = useCallback((id: string, updates: Partial<ReferenceImage>) => {
    setReferenceImages(prev => prev.map(img =>
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  const removeReferenceImage = useCallback((id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const updatePrompt = useCallback((id: string, newPrompt: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, prompt: newPrompt } : p
    ));
  }, []);

  const updateImage = useCallback((id: string, updates: Partial<GeneratedImage>) => {
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  // 类型启用/禁用
  const toggleType = useCallback((typeId: string) => {
    setEnabledTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  }, []);

  const enableAllTypes = useCallback(() => {
    setEnabledTypes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = true; });
      return next;
    });
  }, []);

  const disableAllTypes = useCallback(() => {
    setEnabledTypes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = false; });
      return next;
    });
  }, []);

  const enableCoreTypesOnly = useCallback(() => {
    setEnabledTypes(getDefaultEnabledTypes());
  }, []);

  // 类型尺寸
  const setTypeSize = useCallback((typeId: string, size: string) => {
    setTypeSizeMap(prev => ({
      ...prev,
      [typeId]: size
    }));
  }, []);

  // 计算辅助函数
  const getEnabledTypes = useCallback((): string[] => {
    return Object.entries(enabledTypes)
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);
  }, [enabledTypes]);

  const getTotalImageCount = useCallback((): number => {
    return getEnabledTypes().reduce((sum, typeId) => {
      const config = getTypeConfig(typeId);
      return sum + (config?.count || 0);
    }, 0);
  }, [getEnabledTypes]);

  const getEnabledTypeConfigs = useCallback(() => {
    return ALL_IMAGE_TYPES.filter(t => enabledTypes[t.id]);
  }, [enabledTypes]);

  const initializeImages = useCallback(() => {
    setImages(currentImages => {
      // 只有当 images 为空时才初始化
      if (currentImages.length > 0) return currentImages;
      return prompts.map(prompt => ({
        id: `img-${prompt.id}`,
        promptId: prompt.id,
        url: null,
        status: 'pending' as const,
        aspectRatio: typeSizeMap[prompt.type] || '1:1',
      }));
    });
  }, [prompts, typeSizeMap]);

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return productInfo.name.trim() !== '' && productInfo.description.length >= 50;
      case 3:
        return analysisResult !== null;
      case 4:
        return prompts.length > 0;
      case 5:
        return images.some(img => img.status === 'completed');
      default:
        return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        productInfo,
        referenceImages,
        analysisResult,
        prompts,
        images,
        isAnalyzing,
        isGeneratingPrompts,
        analyzeModel,
        visionModel,
        selectedModel,
        promptModel,
        enabledTypes,
        typeSizeMap,
        selectedSize,
        setCurrentStep,
        setProductInfo,
        setReferenceImages,
        addReferenceImage,
        updateReferenceImage,
        removeReferenceImage,
        setAnalysisResult,
        setPrompts,
        updatePrompt,
        setImages,
        updateImage,
        setIsAnalyzing,
        setIsGeneratingPrompts,
        setAnalyzeModel,
        setVisionModel,
        setSelectedModel,
        setPromptModel,
        setSelectedSize,
        toggleType,
        setEnabledTypes,
        enableAllTypes,
        disableAllTypes,
        enableCoreTypesOnly,
        setTypeSize,
        setTypeSizeMap,
        getEnabledTypes,
        getTotalImageCount,
        getEnabledTypeConfigs,
        initializeImages,
        canProceedToStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// 辅助函数：生成初始prompts列表（基于启用的类型）
export function generateInitialPrompts(enabledTypes: Record<string, boolean>): ImagePrompt[] {
  const promptsList: ImagePrompt[] = [];

  ALL_IMAGE_TYPES.forEach(typeConfig => {
    if (!enabledTypes[typeConfig.id]) return;

    for (let i = 0; i < typeConfig.count; i++) {
      promptsList.push({
        id: `prompt-${typeConfig.id}-${i}`,
        type: typeConfig.id as ImageTypeId,
        typeName: typeConfig.name,
        index: i + 1,
        prompt: '',
      });
    }
  });

  return promptsList;
}
