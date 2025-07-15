import { useMemo } from "react";
import * as THREE from "three";
import { SideMode } from "../types";
import { getUvBounds } from "../getUvBounds";

export function useUvBounds({
  texture,
  imageOffset,
  sideMode
}: {
  texture: THREE.Texture | null;
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
}) {
  return useMemo(() => {
    if (!texture || !texture.image) {
      return null;
    }

    return getUvBounds({
      imageWh: {
        width: texture.image.width,
        height: texture.image.height,
      },
      imageOffset,
      sideMode,
    });
  }, [texture, imageOffset, sideMode]);
}