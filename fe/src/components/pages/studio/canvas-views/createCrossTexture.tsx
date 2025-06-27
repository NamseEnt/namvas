import * as THREE from "three";
import { canvasProductSize } from ".";
import { type SideProcessing } from "../types";

export function createCrossTexture({
  uploadedImage,
  mmPerPixel,
  imageCenterXy,
  sideProcessing,
  canvasTextureImg,
}: {
  uploadedImage: HTMLImageElement;
  mmPerPixel: number; // millimeters per pixel ratio
  imageCenterXy: { x: number; y: number }; // in millimeters
  sideProcessing: SideProcessing;
  canvasTextureImg: HTMLImageElement;
}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const pixelScale = 4000;

  const frontWidth = canvasProductSize.width * pixelScale;
  const frontHeight = canvasProductSize.height * pixelScale;
  const thickness = canvasProductSize.depth * pixelScale;

  canvas.width = frontWidth + thickness * 2; // 좌 + 정면 + 우
  canvas.height = frontHeight + thickness * 2; // 상 + 정면 + 하

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const texturePattern = ctx.createPattern(canvasTextureImg, "repeat")!;
  ctx.save();
  ctx.fillStyle = texturePattern;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const frontCenterX = thickness + frontWidth / 2;
  const frontCenterY = thickness + frontHeight / 2;

  function clipFront(func: () => void) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(thickness, thickness, frontWidth, frontHeight);
    ctx.clip();
    func();
    ctx.restore();
  }

  function drawImage() {
    ctx.save();
    ctx.translate(frontCenterX, frontCenterY);
    ctx.translate(centerXpx, centerYpx);
    ctx.scale(canvasScale, canvasScale);
    ctx.drawImage(
      uploadedImage,
      -uploadedImage.width / 2,
      -uploadedImage.height / 2
    );
    ctx.restore();
  }

  // Convert mm to pixels for canvas drawing
  // imageCenterXy is already in mm, pixelScale converts to canvas pixels
  const centerXpx = imageCenterXy.x * pixelScale / 1000;
  const centerYpx = imageCenterXy.y * pixelScale / 1000;
  
  // Convert mmPerPixel to canvas scale
  // mmPerPixel is mm/pixel, pixelScale is pixels/meter, so: mm/pixel * pixels/meter / 1000 = dimensionless scale
  const canvasScale = mmPerPixel * pixelScale / 1000;

  ctx.save();

  switch (sideProcessing.type) {
    case "none":
      {
        drawImage();
      }
      break;
    case "clip":
      {
        clipFront(() => {
          drawImage();
        });
      }
      break;
    case "color":
      {
        ctx.save();
        ctx.fillStyle = sideProcessing.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        clipFront(() => {
          drawImage();
        });
      }
      break;
    case "flip":
      {
        drawImage();

        // left
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(-canvasScale, canvasScale);
        ctx.translate(centerXpx + uploadedImage.width, centerYpx);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // right
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(-canvasScale, canvasScale);
        ctx.translate(centerXpx - uploadedImage.width, centerYpx);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // up
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(canvasScale, -canvasScale);
        ctx.translate(centerXpx, centerYpx + uploadedImage.height);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // down
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(canvasScale, -canvasScale);
        ctx.translate(centerXpx, centerYpx - uploadedImage.height);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();
      }
      break;
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
