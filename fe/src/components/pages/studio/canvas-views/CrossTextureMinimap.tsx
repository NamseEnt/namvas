import { useEffect, useRef, useState } from "react";
import { useStudioContext } from "../StudioPage";
import { createCanvasTexture } from "@/components/common/CanvasView/utils";
import { canvasProductSizeM } from "@/components/common/CanvasView/constants";
import * as THREE from "three";

export function CrossTextureMinimap() {
  const { state } = useStudioContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crossTexture, setCrossTexture] = useState<THREE.Texture>();
  
  // 이전 값 추적
  const prevRef = useRef<{
    dpi: number;
    centerX: number;
    centerY: number;
    sideProcessingType: string;
    backgroundColor: string;
  }>({ dpi: 0, centerX: 0, centerY: 0, sideProcessingType: '', backgroundColor: '' });

  useEffect(
    function generateCrossTexture() {
      const current = {
        dpi: state.dpi,
        centerX: state.imageCenterXyInch?.x || 0,
        centerY: state.imageCenterXyInch?.y || 0,
        sideProcessingType: state.sideProcessing?.type || '',
        backgroundColor: state.canvasBackgroundColor
      };
      
      prevRef.current = current;
      
      if (!state.uploadedImage) {
        setCrossTexture(undefined);
        return;
      }

      const minimapCanvasSize = { width: 160, height: 160 };
      
      createCanvasTexture({
        src: { type: "image", image: state.uploadedImage },
        settings: {
          dpi: state.dpi,
          imageCenterXyInch: state.imageCenterXyInch,
          sideProcessing: state.sideProcessing,
          canvasBackgroundColor: state.canvasBackgroundColor,
        },
        canvasSize: minimapCanvasSize,
      })
        .then((texture) => {
          setCrossTexture(texture);
        })
        .catch((error) => {
          console.error("❌ Minimap createCanvasTexture error:", error);
          setCrossTexture(undefined);
        });
    },
    [
      state.uploadedImage,
      state.dpi,
      state.imageCenterXyInch?.x,
      state.imageCenterXyInch?.y,
      state.sideProcessing?.type,
      state.canvasBackgroundColor,
    ]
  );

  useEffect(
    function updateCanvas() {
      if (!canvasRef.current || !crossTexture) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // Three.js texture의 canvas 데이터 가져오기
      const textureCanvas = (crossTexture as THREE.CanvasTexture).source
        .data as HTMLCanvasElement;

      // createCanvasTexture가 생성하는 실제 텍스처 크기 사용
      const textureWidth = textureCanvas.width;
      const textureHeight = textureCanvas.height;

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
      // 실제 텍스처에서 픽셀 스케일 역산
      const pixelScale = textureCanvas.width / (canvasProductSizeM.thicknessM * 2 + canvasProductSizeM.widthM);
      const thicknessPx = canvasProductSizeM.thicknessM * pixelScale;
      const frontWidthPx = canvasProductSizeM.widthM * pixelScale;
      const frontHeightPx = canvasProductSizeM.heightM * pixelScale;
      const totalWidthPx = thicknessPx * 2 + frontWidthPx;
      const totalHeightPx = thicknessPx * 2 + frontHeightPx;

      // 텍스처 대비 각 면의 비율
      const frontLeft = thicknessPx / totalWidthPx;
      const frontRight = (thicknessPx + frontWidthPx) / totalWidthPx;
      const frontTop = thicknessPx / totalHeightPx;
      const frontBottom = (thicknessPx + frontHeightPx) / totalHeightPx;

      // 사용하지 않는 변수들 제거됨

      // 텍스처 이미지 기준으로 좌표 계산
      const textureX = x;
      const textureY = y;
      const textureDisplayWidth = scaledWidth;
      const textureDisplayHeight = scaledHeight;

      // 점선 스타일 설정
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 1;

      // Cross texture 구조에 맞는 좌표 계산
      // 1. 상단 면 (점선)
      ctx.strokeRect(
        textureX + textureDisplayWidth * frontLeft,
        textureY + textureDisplayHeight * 0,
        textureDisplayWidth * (frontRight - frontLeft),
        textureDisplayHeight * frontTop
      );

      // 2. 하단 면 (점선)
      ctx.strokeRect(
        textureX + textureDisplayWidth * frontLeft,
        textureY + textureDisplayHeight * frontBottom,
        textureDisplayWidth * (frontRight - frontLeft),
        textureDisplayHeight * (1 - frontBottom)
      );

      // 3. 좌측 면 (점선)
      ctx.strokeRect(
        textureX + textureDisplayWidth * 0,
        textureY + textureDisplayHeight * frontTop,
        textureDisplayWidth * frontLeft,
        textureDisplayHeight * (frontBottom - frontTop)
      );

      // 4. 우측 면 (점선)
      ctx.strokeRect(
        textureX + textureDisplayWidth * frontRight,
        textureY + textureDisplayHeight * frontTop,
        textureDisplayWidth * (1 - frontRight),
        textureDisplayHeight * (frontBottom - frontTop)
      );

      // 5. 정면 (점선)
      ctx.strokeRect(
        textureX + textureDisplayWidth * frontLeft,
        textureY + textureDisplayHeight * frontTop,
        textureDisplayWidth * (frontRight - frontLeft),
        textureDisplayHeight * (frontBottom - frontTop)
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
