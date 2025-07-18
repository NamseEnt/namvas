import type { SideMode } from "@shared/types";
import { type UVBounds } from "./types";
import { calculateUvBounds } from "./utils/uvCalculations";

export function getUvBounds({
  imageWh,
  imageOffset,
  sideMode,
}: {
  imageWh: { width: number; height: number };
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
}): UVBounds {
  const result = calculateUvBounds({
    imageWh,
    imageOffset,
    sideMode,
  });

  // SideMode.CLIP일 때만 front만 반환하고, 다른 모드는 front UV 반환
  if (result.front) {
    return {
      uMin: result.front.uMin,
      uMax: result.front.uMax,
      vMax: result.front.vMax,
      vMin: result.front.vMin,
    };
  }

  // fallback - 전체 이미지
  return {
    uMin: 0,
    uMax: 1,
    vMax: 1,
    vMin: 0,
  };
}
