import { type SideProcessing } from "@/components/pages/studio/types";
import { clearStorageIfNeeded } from "@/utils/imageCompression";

export type ArtworkDefinition = {
  originalImageDataUrl: string; // Original image as dataURL
  mmPerPixel: number; // Size ratio - millimeters per pixel
  imageCenterXy: { x: number; y: number }; // Center coordinates in millimeters
  sideProcessing: SideProcessing; // How to handle sides (clip, color, flip, none)
  canvasBackgroundColor: string; // Background pattern/color
  uploadedFileName?: string; // Original file name
};

// Metadata without image data for efficient storage
export type ArtworkMetadata = {
  mmPerPixel: number;
  imageCenterXy: { x: number; y: number };
  sideProcessing: SideProcessing;
  canvasBackgroundColor: string;
  uploadedFileName?: string;
};

const ARTWORK_STORAGE_KEY = 'namvas_artwork';
const TEXTURE_STORAGE_KEY = 'namvas_texture';

// Save artwork to localStorage
export const saveArtworkToLocalStorage = (artwork: ArtworkDefinition): void => {
  try {
    localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(artwork));
  } catch {
    // If quota exceeded, clear storage and try again
    clearStorageIfNeeded();
    try {
      localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(artwork));
    } catch (e2) {
      console.error('Failed to save artwork even after clearing storage:', e2);
      throw e2;
    }
  }
};

// Get artwork from localStorage
export const getArtworkFromLocalStorage = (): ArtworkDefinition | null => {
  const stored = localStorage.getItem(ARTWORK_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored) as ArtworkDefinition;
  } catch {
    return null;
  }
};

// Save texture to localStorage
export const saveTextureToLocalStorage = (textureDataUrl: string): void => {
  try {
    localStorage.setItem(TEXTURE_STORAGE_KEY, textureDataUrl);
  } catch {
    // If quota exceeded, clear storage and try again
    clearStorageIfNeeded();
    try {
      localStorage.setItem(TEXTURE_STORAGE_KEY, textureDataUrl);
    } catch (e2) {
      console.error('Failed to save texture even after clearing storage:', e2);
      throw e2;
    }
  }
};

// Get texture from localStorage
export const getTextureFromLocalStorage = (): string | null => {
  return localStorage.getItem(TEXTURE_STORAGE_KEY);
};

// Clear all stored data
export const clearLocalStorage = (): void => {
  localStorage.removeItem(ARTWORK_STORAGE_KEY);
  localStorage.removeItem(TEXTURE_STORAGE_KEY);
};