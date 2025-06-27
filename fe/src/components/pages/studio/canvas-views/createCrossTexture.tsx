import * as THREE from "three";
import { canvasProductSize } from ".";
import { type SideProcessing } from "../types";

export function createCrossTexture({
  uploadedImage,
  imageScale,
  imagePosition,
  sideProcessing,
  canvasTextureImg,
}: {
  uploadedImage: HTMLImageElement;
  imageScale: number;
  imagePosition: { x: number; y: number };
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
    ctx.scale(imageScale, imageScale);
    ctx.translate(imagePosition.x, imagePosition.y);
    ctx.drawImage(
      uploadedImage,
      -uploadedImage.width / 2,
      -uploadedImage.height / 2
    );
    ctx.restore();
  }

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
        ctx.scale(-imageScale, imageScale);
        ctx.translate(imagePosition.x + uploadedImage.width, imagePosition.y);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // right
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(-imageScale, imageScale);
        ctx.translate(imagePosition.x - uploadedImage.width, imagePosition.y);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // up
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(imageScale, -imageScale);
        ctx.translate(imagePosition.x, imagePosition.y + uploadedImage.height);
        ctx.drawImage(
          uploadedImage,
          -uploadedImage.width / 2,
          -uploadedImage.height / 2
        );
        ctx.restore();

        // down
        ctx.save();
        ctx.translate(frontCenterX, frontCenterY);
        ctx.scale(imageScale, -imageScale);
        ctx.translate(imagePosition.x, imagePosition.y - uploadedImage.height);
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
