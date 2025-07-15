import { useState, useEffect } from "react";
import * as THREE from "three";
import { createOptimizedTexture } from "../utils/textureOptimization";

export function useTextureLoader(imageSource: string | File | HTMLImageElement) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(function loadTexture() {
    if (!imageSource) {
      setTexture(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        let image: HTMLImageElement;

        if (imageSource instanceof HTMLImageElement) {
          image = imageSource;
        } else if (imageSource instanceof File) {
          image = await loadImageFromFile(imageSource);
        } else {
          image = await loadImageFromUrl(imageSource);
        }

        const optimizedTexture = createOptimizedTexture(image);
        setTexture(optimizedTexture);
      } catch (err) {
        console.error("Failed to load texture:", err);
        setError(err instanceof Error ? err : new Error("Failed to load texture"));
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imageSource]);

  return { texture, loading, error };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image from file"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
    img.src = url;
  });
}