import { useState, useEffect } from "react";
import * as THREE from "three";

export function useTextureLoader(imageSource: string | File):
  | {
      type: "loading";
    }
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "success";
      texture: THREE.Texture;
    } {
  const [texture, setTexture] = useState<THREE.Texture>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    function loadTexture() {
      (async () => {
        setIsLoading(true);

        const image =
          imageSource instanceof File
            ? await createImageBitmap(imageSource, {
                imageOrientation: "flipY",
              })
            : await loadImageFromUrl(imageSource);

        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        texture.generateMipmaps = false;
        setTexture(texture);
      })()
        .catch((error) => {
          console.log(imageSource);
          console.error("Failed to load texture:", error);
          setError(error);
        })
        .then(() => {
          setIsLoading(false);
        });
    },
    [imageSource]
  );

  return isLoading
    ? { type: "loading" }
    : error
      ? { type: "error", error }
      : { type: "success", texture: texture! };
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load image from URL: ${url}`));
    img.src = url;
  });
}
