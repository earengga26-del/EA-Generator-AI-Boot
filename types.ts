import React from 'react';

export interface Option {
  value: string;
  label: string;
}

export interface ImageInput {
  data: string; // base64 encoded string
  mimeType: string;
}

export type Tab = 'dashboard' | 'creativeHub' | 'videoPrompt' | 'ctGenerate' | 'tiktokAffiliate' | 'voiceGenerator';

export type ImageEditorSubTab = 'edit' | 'aspectRatio';

// FIX: Updated deprecated model name to 'gemini-2.5-flash-image'.
export type ImageModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';

export type ImageAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type PhotoshootResult = 
  | { status: 'fulfilled'; value: string }
  | { status: 'rejected'; reason: any };

// New types for Video Generator
export type VeoModel = 'veo-3.0-fast-generate-preview' | 'veo-2.0-generate-001' | 'veo-3.0-fast-generate-001' | 'veo-3.0-generate-001' | 'veo-3.0-fast' | 'veo-3.0-ultra';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '1080p' | '720p';
export type VisualStyle = 'Cinematic' | 'Realistic' | 'Anime' | 'Pixar3D' | 'Cyberpunk' | "Retro 80's";
export type CharacterVoice = 'none' | 'english' | 'bahasa-indonesia';

export interface Scene {
  id: number;
  prompt: string;
  usePreviousScene: boolean;
}

// --- NEW TYPES FOR CT-STORY ---

export const ASSET_STYLES = [ "Cinematic", "Photorealistic", "Anime", "Fantasy", "Watercolor", "Pixel Art", "Cartoon", "3D Render", "Vaporwave", "Steampunk", "Cyberpunk", "Impressionistic", "Minimalist" ];

export interface StoryCharacter {
    id: string;
    name: string;
    description: string;
    clothing: string;
    expression: string;
    status: 'pending' | 'generating' | 'done' | 'error';
    imageUrl?: string;
    imageBase64?: string;
}

export interface Universe {
    characters: StoryCharacter[];
}

export interface ImageStudioResultData {
    id: string;
    prompt: string;
    imageUrl: string;
    base64?: string;
}

export interface StoryScene {
    id: string;
    prompt: string;
    status: 'pending' | 'generating-image' | 'image-done' | 'generating-video' | 'done' | 'error';
    imageUrl?: string;
    imageBase64?: string;
    imageFileName?: string;
    videoUrl?: string;
    videoFileName?: string;
    audioUrl?: string;
    audioFileName?: string;
}

export interface StorybookPage {
    id: string;
    pageNumber: number;
    text: string;
    imagePrompt: string;
    imageUrl?: string;
    status: 'pending-image' | 'generating-image' | 'done' | 'error';
}

export interface StorybookProject {
    id: string;
    idea: string;
    pages: StorybookPage[];
    fullStoryText: string;
}

export type LtxTransition = 'none' | 'crossfade';

export interface LtxCharacter extends StoryCharacter {}

export interface LtxScene {
    id: string;
    sceneNumber: number;
    description: string;
    imagePrompt: string;
    videoPrompt: string;
    audioPrompt: string;
    status: 'pending' | 'generating-image' | 'image-done' | 'generating-video' | 'done' | 'error';
    imageUrl?: string;
    imageBase64?: string;
    imageFileName?: string;
    videoUrl?: string;
    videoFileName?: string;
    audioUrl?: string; 
    audioFileName?: string;
    transition: LtxTransition;
}

export interface LtxProject {
    title: string;
    category: string;
    genre: string;
    visualStyle: string;
    duration: string;
    durationUnit: 'seconds' | 'minutes';
    aspectRatio: string;
    resolution: '720p' | '1080p';
    videoModel: string;
    characters: LtxCharacter[];
    scenes: LtxScene[];
}

export interface MediaLibraryItem {
    type: 'image' | 'video' | 'audio';
    previewUrl: string;
    prompt: string;
    model: string;
    sourceComponent: string;
    base64?: string;
    mimeType?: string;
}

export interface SharedFormProps {
    addLog: (message: string, type: 'info' | 'error' | 'warning' | 'status') => void;
    getNextApiKey: () => string | null;
    logUsage: (type: 'text' | 'images' | 'videos' | 'audio') => void;
    universe: Universe;
    setUniverse: React.Dispatch<React.SetStateAction<Universe>>;
    executeApiCallWithKeyRotation: <T>(apiCall: (ai: any) => Promise<T>, description: string) => Promise<[T, { apiKey: string | null }]>;
    addToMediaLibrary: (item: MediaLibraryItem) => void;
    runningRef: React.MutableRefObject<boolean>;
    setStatus: (status: 'Idle' | 'Running' | 'Done') => void;
    setModalVideoUrl?: (url: string) => void;
    setModalImageUrl?: (url: string) => void;
    getFileSaveDirectory: (type: 'images' | 'videos' | 'projects' | 'audio') => Promise<any | null>;
}