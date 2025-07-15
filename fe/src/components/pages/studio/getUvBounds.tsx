import { calculateUvBounds, SideMode } from "./utils/uvCalculations";
import { SideMode as StudioSideMode } from "./types";

export function getUvBounds({
  imageWh,
  imageOffset,
  sideMode = StudioSideMode.CLIP,
}: {
  imageWh: { width: number; height: number };
  imageOffset: { x: number; y: number };
  sideMode?: StudioSideMode;
}) {
  // Convert Studio SideMode to Utils SideMode
  const utilsSideMode = sideMode as SideMode;
  
  const result = calculateUvBounds({
    imageWh,
    imageOffset,
    sideMode: utilsSideMode,
  });

  // For backward compatibility, return front UV bounds in old format
  if (result.front) {
    return {
      left: result.front.uMin,
      right: result.front.uMax,
      bottom: result.front.vMin,
      top: result.front.vMax,
    };
  }

  // Fallback to old calculation for safety
  const imageAspect = imageWh.width / imageWh.height;
  const canvasAspect = 0.1 / 0.15; // w / h

  let scaleX, scaleY;
  if (imageAspect > canvasAspect) {
    scaleY = 1;
    scaleX = canvasAspect / imageAspect;
  } else {
    scaleX = 1;
    scaleY = imageAspect / canvasAspect;
  }

  const maxOffsetX = (1 - scaleX) / 2;
  const maxOffsetY = (1 - scaleY) / 2;
  const offsetX = imageOffset.x * maxOffsetX;
  const offsetY = imageOffset.y * maxOffsetY;

  const left = (1 - scaleX) / 2 - offsetX;
  const right = 1 - (1 - scaleX) / 2 - offsetX;
  const bottom = (1 - scaleY) / 2 - offsetY;
  const top = 1 - (1 - scaleY) / 2 - offsetY;

  return { left, right, bottom, top };
}
