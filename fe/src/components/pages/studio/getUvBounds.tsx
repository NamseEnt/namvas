import { h, w } from "./types";

export function getUvBounds({
  imageWh,
  imageOffset,
}: {
  imageWh: { width: number; height: number };
  imageOffset: { x: number; y: number };
}) {
  const imageAspect = imageWh.width / imageWh.height;
  const canvasAspect = w / h;

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
