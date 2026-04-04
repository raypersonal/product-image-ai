'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ProductInfo,
  AnalysisResult,
  ImagePrompt,
  GeneratedImage,
  IMAGE_TYPE_CONFIG,
  ImageType,
  ReferenceImage
} from '@/types';

interface AppState {
  currentStep: number;
  productInfo: ProductInfo;
  referenceImages: ReferenceImage[];
  analysisResult: AnalysisResult | null;
  prompts: ImagePrompt[];
  images: GeneratedImage[];
  isAnalyzing: boolean;
  isGeneratingPrompts: boolean;
  selectedModel: string;
  selectedSize: string;
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
  setImages: (images: GeneratedImage[]) => void;
  updateImage: (id: string, updates: Partial<GeneratedImage>) => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsGeneratingPrompts: (value: boolean) => void;
  setSelectedModel: (model: string) => void;
  setSelectedSize: (size: string) => void;
  initializeImages: () => void;
  canProceedToStep: (step: number) => boolean;
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
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/flux.2-flex');
  const [selectedSize, setSelectedSize] = useState('1:1');

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

  const initializeImages = useCallback(() => {
    setImages(currentImages => {
      // 只有当 images 为空时才初始化
      if (currentImages.length > 0) return currentImages;
      return prompts.map(prompt => ({
        id: `img-${prompt.id}`,
        promptId: prompt.id,
        url: null,
        status: 'pending' as const,
      }));
    });
  }, [prompts]);

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
        selectedModel,
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
        setSelectedModel,
        setSelectedSize,
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

// 辅助函数：生成初始prompts列表
export function generateInitialPrompts(): ImagePrompt[] {
  const prompts: ImagePrompt[] = [];
  let globalIndex = 0;

  (Object.entries(IMAGE_TYPE_CONFIG) as [ImageType, { name: string; count: number }][]).forEach(([type, config]) => {
    for (let i = 0; i < config.count; i++) {
      prompts.push({
        id: `prompt-${type}-${i}`,
        type,
        typeName: config.name,
        index: i + 1,
        prompt: '',
      });
      globalIndex++;
    }
  });

  return prompts;
}
