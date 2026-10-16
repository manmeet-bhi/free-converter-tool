import { LoadedImageInfo, ProcessResult } from './utils/imageProcessor';
import { ImageFormat } from './utils/formatSupport';

export type ActiveTab = 
  | 'home' 
  | 'converter' 
  | 'compressor' 
  | 'resizer' 
  | 'features' 
  | 'formats' 
  | 'privacy' 
  | 'faq' 
  | 'about' 
  | 'contact' 
  | 'terms' 
  | 'cookies'
  | 'png-to-jpg'
  | 'jpg-to-png'
  | 'png-to-webp'
  | 'webp-to-png'
  | 'jpg-to-webp'
  | 'webp-to-jpg'
  | 'png-to-ico';

export interface ImageItem {
  id: string;
  file: File;
  originalInfo: LoadedImageInfo;
  originalSize: number;
  originalDimensions: {
    width: number;
    height: number;
  };
  customFilename: string;
  targetFormat: ImageFormat;
  targetQuality: number; // 0.1 to 1.0
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  backgroundColor: string; // hex string, default '#ffffff'
  targetSizeBytes?: number; // optional target in bytes
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
  result?: ProcessResult;
}

export type CompressionPreset = 'max' | 'balanced' | 'high' | 'custom';
