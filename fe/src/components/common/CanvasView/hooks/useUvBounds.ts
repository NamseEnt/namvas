import { useMemo } from "react";
import * as THREE from "three";
import { SideMode } from "@shared/types";
import { getUvBounds } from "../getUvBounds";

export function useUvBounds({
  texture,
  imageOffset,
  sideMode,
}: {
  texture: THREE.Texture;
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
}) {
  return useMemo(() => {
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
