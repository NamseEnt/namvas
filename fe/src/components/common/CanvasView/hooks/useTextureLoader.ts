import { useState, useEffect } from "react";
import * as THREE from "three";
import { getImageUrl } from "@/lib/config";
import { isPsdContentType } from "@/utils/isPsdFile";

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
            : await loadImageFromUrlWithPsdDetection(imageSource);

        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        setTexture(texture);
      })()
        .catch((error) => {
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

async function loadImageFromUrlWithPsdDetection(
  url: string
): Promise<HTMLImageElement> {
  const response = await fetch(url, {
    mode: "cors",
    headers: {
      "x-amz-checksum-mode": "ENABLED",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (isPsdContentType(contentType)) {
    const checksumSha256 = response.headers.get("x-amz-checksum-sha256");
    if (!checksumSha256) {
      throw new Error(
        "PSD file found but no checksumSha256 available for sha256 extraction"
      );
    }

    const jpgUrl = getPsdConvertedJpgUrl(checksumSha256);

    return loadImageFromUrl(jpgUrl);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image from ${url}`));
    };
    img.src = objectUrl;
  });
}

function getPsdConvertedJpgUrl(hash: string): string {
  return getImageUrl(`psd-converted/${hash}.jpg`);
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
