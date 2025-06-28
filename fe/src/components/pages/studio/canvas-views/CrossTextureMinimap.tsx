import { useEffect, useRef, useState, useMemo } from "react";
import { useStudioContext } from "..";
import { createCrossTexture } from "./createCrossTexture";
import { canvasProductSize } from ".";
import * as THREE from "three";

export function CrossTextureMinimap() {
  const { state } = useStudioContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasTextureImg, setCanvasTextureImg] =
    useState<HTMLImageElement | null>(null);

  useEffect(function loadCanvasTexture() {
    const img = new Image();
    img.onload = () => setCanvasTextureImg(img);
    img.src = "./canvas-texture.jpg";
  }, []);

  const crossTexture = useMemo(() => {
    if (!state.uploadedImage || !canvasTextureImg) {
      return null;
    }
    return createCrossTexture({
      uploadedImage: state.uploadedImage,
      mmPerPixel: state.mmPerPixel,
      imageCenterXy: state.imageCenterXy,
      sideProcessing: state.sideProcessing,
      canvasTextureImg: canvasTextureImg,
    });
  }, [
    state.uploadedImage,
    state.mmPerPixel,
    state.imageCenterXy,
    state.sideProcessing,
    canvasTextureImg,
  ]);

  useEffect(
    function updateCanvas() {
      if (!canvasRef.current || !crossTexture) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // 십자형 텍스처의 실제 크기 계산
      const pixelScale = 4000;
      const frontWidth = canvasProductSize.width * pixelScale;
      const frontHeight = canvasProductSize.height * pixelScale;
      const thickness = canvasProductSize.depth * pixelScale;
      const textureWidth = frontWidth + thickness * 2;
      const textureHeight = frontHeight + thickness * 2;
      
      // 종횡비 유지하며 캔버스 크기 조정 (최대 160x160)
      const maxSize = 160;
      const aspectRatio = textureWidth / textureHeight;
      
      let canvasWidth, canvasHeight;
      if (aspectRatio > 1) {
        // 가로가 더 긴 경우
        canvasWidth = maxSize;
        canvasHeight = maxSize / aspectRatio;
      } else {
        // 세로가 더 긴 경우
        canvasWidth = maxSize * aspectRatio;
        canvasHeight = maxSize;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 배경 지우기
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Three.js texture의 canvas 데이터 가져오기
      const textureCanvas = (crossTexture as THREE.CanvasTexture).source.data as HTMLCanvasElement;

      // 십자형 텍스처를 미니맵에 맞게 스케일링해서 그리기
      const scale =
        Math.min(
          canvas.width / textureCanvas.width,
          canvas.height / textureCanvas.height
        ) * 0.9; // 약간의 여백을 위해 0.9 곱하기

      const scaledWidth = textureCanvas.width * scale;
      const scaledHeight = textureCanvas.height * scale;

      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(textureCanvas, x, y, scaledWidth, scaledHeight);

      // 십자형 구조의 테두리와 가이드라인 그리기
      // createCrossTexture와 동일한 비율 사용
      const frontWidthScaled = canvasProductSize.width * pixelScale * scale;
      const frontHeightScaled = canvasProductSize.height * pixelScale * scale;
      const sideThicknessScaled = canvasProductSize.depth * pixelScale * scale;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 점선 스타일 설정
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 1;
      
      // 1. 상단 면 (점선)
      ctx.strokeRect(
        centerX - frontWidthScaled / 2,
        centerY - frontHeightScaled / 2 - sideThicknessScaled,
        frontWidthScaled,
        sideThicknessScaled
      );
      
      // 2. 하단 면 (점선)
      ctx.strokeRect(
        centerX - frontWidthScaled / 2,
        centerY + frontHeightScaled / 2,
        frontWidthScaled,
        sideThicknessScaled
      );
      
      // 3. 좌측 면 (점선)
      ctx.strokeRect(
        centerX - frontWidthScaled / 2 - sideThicknessScaled,
        centerY - frontHeightScaled / 2,
        sideThicknessScaled,
        frontHeightScaled
      );
      
      // 4. 우측 면 (점선)
      ctx.strokeRect(
        centerX + frontWidthScaled / 2,
        centerY - frontHeightScaled / 2,
        sideThicknessScaled,
        frontHeightScaled
      );
      
      // 5. 정면 (점선)
      ctx.strokeRect(
        centerX - frontWidthScaled / 2,
        centerY - frontHeightScaled / 2,
        frontWidthScaled,
        frontHeightScaled
      );
      
      // 점선 스타일 해제
      ctx.setLineDash([]);
    },
    [crossTexture]
  );

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-medium mb-2 text-gray-700">펼친 모습</h4>
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded"
          style={{ maxWidth: "160px", maxHeight: "160px" }}
        />
      </div>
    </div>
  );
}
