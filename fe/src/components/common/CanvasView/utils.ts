import * as THREE from "three";
import { type ViewAngle, canvasProductSizeM, METER_PER_INCH } from "./constants";
import type { CanvasRenderSettings, CanvasViewSrc } from "./CanvasView";

export function getStaticRotation(angle: ViewAngle): { x: number; y: number } {
  switch (angle) {
    case "front":
      return { x: 0, y: 0 };
    case "rightBottomUp":
      return { x: -20, y: 45 };
    case "leftTopDown":
      return { x: 20, y: -45 };
    case "left":
      return { x: 20, y: 0 };
  }
}

export function calculateCameraDistance(rotation: {
  x: number;
  y: number;
}): number {
  const canvasDiagonal = Math.sqrt(
    canvasProductSizeM.widthM ** 2 + canvasProductSizeM.heightM ** 2
  );
  const baseCameraDistance = canvasDiagonal * 1.5;
  const cameraDistanceMultiplier = canvasDiagonal * 0.003;
  return (
    baseCameraDistance +
    (Math.abs(rotation.y) + Math.abs(rotation.x)) * cameraDistanceMultiplier
  );
}

// UV 기반 줌/팬 유틸리티 함수들
export type UVTransform = {
  zoom: number;
  panX: number;
  panY: number;
};

export function calculateZoomedUV(
  baseLeft: number,
  baseRight: number,
  baseTop: number,
  baseBottom: number,
  transform: UVTransform
): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const centerU = (baseLeft + baseRight) / 2 + transform.panX;
  const centerV = (baseTop + baseBottom) / 2 + transform.panY;
  
  const halfWidthU = (baseRight - baseLeft) / (2 * transform.zoom);
  const halfHeightV = (baseBottom - baseTop) / (2 * transform.zoom);
  
  return {
    left: centerU - halfWidthU,
    right: centerU + halfWidthU,
    top: centerV - halfHeightV,
    bottom: centerV + halfHeightV
  };
}

const canvasTexturePromise = new Promise<HTMLImageElement>(
  (resolve, reject) => {
    const canvasTextureImg = new Image();
    canvasTextureImg.onload = () => resolve(canvasTextureImg);
    canvasTextureImg.onerror = (error) => reject(error);
    canvasTextureImg.src = "./canvas-texture.jpg";
  }
);

// 캔버스 배경 텍스처 생성 (한 번만 생성됨)
export async function createCanvasBackgroundTexture(): Promise<THREE.Texture> {
  const canvasTextureImg = await canvasTexturePromise;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = textureWidthPx;
  canvas.height = textureHeightPx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply canvas texture background
  const texturePattern = ctx.createPattern(canvasTextureImg, "repeat")!;
  ctx.save();
  ctx.fillStyle = texturePattern;
  ctx.globalAlpha = 0.15;
  ctx.filter = "brightness(1.3) blur(0.5px)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 사용자 이미지 텍스처 생성 (원본 크기 유지)
export async function createUserImageTexture(
  src: CanvasViewSrc
): Promise<THREE.Texture> {
  const image = await (() => {
    if (src.type === "image") {
      return src.image;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = (src as { type: "url"; url: string }).url;
    return new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  })();

  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// DPI와 위치를 UV transform으로 변환
export function calculateImageUVTransform({
  dpi,
  imageCenterXyInch,
  baseDpi = 300,
}: {
  dpi: number;
  imageCenterXyInch: { x: number; y: number };
  baseDpi?: number;
}): UVTransform {
  // DPI가 높을수록 이미지가 작아져야 하므로 zoom은 반비례
  const zoom = baseDpi / dpi;
  
  // 위치는 캔버스 크기 대비 비율로 계산
  const canvasWidthInch = canvasProductSizeM.widthM / METER_PER_INCH;
  const canvasHeightInch = canvasProductSizeM.heightM / METER_PER_INCH;
  
  const panX = imageCenterXyInch.x / canvasWidthInch;
  const panY = imageCenterXyInch.y / canvasHeightInch;
  
  return { zoom, panX, panY };
}

const pixelScale = 8000; // 텍스처 해상도 대폭 증가
const thicknessPx = canvasProductSizeM.thicknessM * pixelScale;
const frontWidthPx = canvasProductSizeM.widthM * pixelScale;
const frontHeightPx = canvasProductSizeM.heightM * pixelScale;
const textureWidthPx = thicknessPx * 2 + frontWidthPx;
const textureHeightPx = thicknessPx * 2 + frontHeightPx;

export async function createCanvasTexture({
  src,
  settings: { dpi, imageCenterXyInch, sideProcessing },
}: {
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
}): Promise<THREE.Texture> {
  const canvasTextureImg = await canvasTexturePromise;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = textureWidthPx;
  canvas.height = textureHeightPx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply canvas texture background
  const texturePattern = ctx.createPattern(canvasTextureImg, "repeat")!;
  ctx.save();
  ctx.fillStyle = texturePattern;
  ctx.globalAlpha = 0.15;
  ctx.filter = "brightness(1.3) blur(0.5px)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const frontCenterXPx = textureWidthPx / 2;
  const frontCenterYPx = textureHeightPx / 2;

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (!src) {
    return texture;
  }

  const image = await (() => {
    if (src.type === "image") {
      return src.image;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = (src as { type: "url"; url: string }).url;
    return new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  })();

  if (sideProcessing) {
    switch (sideProcessing.type) {
      case "none":
        drawImage();
        break;

      case "clip":
        clipFront(() => {
          drawImage();
        });
        break;

      case "color":
        ctx.save();
        ctx.fillStyle = sideProcessing.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        clipFront(() => {
          drawImage();
        });
        break;

      case "flip":
        {
          drawImage();

          const centerXPx = imageCenterXyInch.x * dpi;
          const centerYPx = imageCenterXyInch.y * dpi;
          const canvasScale = pixelScale / dpi;

          // Left side
          ctx.save();
          ctx.translate(frontCenterXPx, frontCenterYPx);
          ctx.scale(-canvasScale, canvasScale);
          ctx.translate(centerXPx + image.width, centerYPx);
          ctx.drawImage(image, -image.width / 2, -image.height / 2);
          ctx.restore();

          // Right side
          ctx.save();
          ctx.translate(frontCenterXPx, frontCenterYPx);
          ctx.scale(-canvasScale, canvasScale);
          ctx.translate(centerXPx - image.width, centerYPx);
          ctx.drawImage(image, -image.width / 2, -image.height / 2);
          ctx.restore();

          // Top side
          ctx.save();
          ctx.translate(frontCenterXPx, frontCenterYPx);
          ctx.scale(canvasScale, -canvasScale);
          ctx.translate(centerXPx, centerYPx + image.height);
          ctx.drawImage(image, -image.width / 2, -image.height / 2);
          ctx.restore();

          // Bottom side
          ctx.save();
          ctx.translate(frontCenterXPx, frontCenterYPx);
          ctx.scale(canvasScale, -canvasScale);
          ctx.translate(centerXPx, centerYPx - image.height);
          ctx.drawImage(image, -image.width / 2, -image.height / 2);
          ctx.restore();
        }
        break;
    }
  } else {
    // Simple mode - just draw the image
    drawImage();
  }

  return texture;

  function clipFront(func: () => void) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(thicknessPx, thicknessPx, frontWidthPx, frontHeightPx);
    ctx.clip();
    func();
    ctx.restore();
  }

  function drawImage() {
    ctx.save();
    ctx.translate(frontCenterXPx, frontCenterYPx);

    if (dpi && imageCenterXyInch) {
      // Advanced mode - precise positioning and scaling
      const centerXPx = imageCenterXyInch.x * dpi;
      const centerYPx = imageCenterXyInch.y * dpi;
      const canvasScale = (pixelScale * METER_PER_INCH) / dpi;


      ctx.translate(centerXPx, centerYPx);
      ctx.scale(canvasScale, canvasScale);
    } else {
      // Simple mode - auto-fit with aspect ratio
      const frontAspect = frontWidthPx / frontHeightPx;
      const imageAspect = image.width / image.height;

      let drawWidthPx, drawHeightPx;
      if (imageAspect > frontAspect) {
        drawWidthPx = frontWidthPx;
        drawHeightPx = frontWidthPx / imageAspect;
      } else {
        drawHeightPx = frontHeightPx;
        drawWidthPx = frontHeightPx * imageAspect;
      }

      ctx.scale(drawWidthPx / image.width, drawHeightPx / image.height);
    }

    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  }
}