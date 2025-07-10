import { useEffect, useRef, useState } from "react";
import { useStudioContext } from "../StudioPage";
import { createCanvasTexture } from "@/components/common/CanvasView/utils";
import { canvasProductSizeM } from "@/components/common/CanvasView/constants";
import * as THREE from "three";

export function CrossTextureMinimap() {
  const { state } = useStudioContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crossTexture, setCrossTexture] = useState<THREE.Texture>();

  useEffect(
    function generateCrossTexture() {
      if (!state.uploadedImage) {
        setCrossTexture(undefined);
        return;
      }

      createCanvasTexture({
        src: { type: "image", image: state.uploadedImage },
        settings: {
          dpi: state.dpi,
          imageCenterXyInch: state.imageCenterXyInch,
          sideProcessing: state.sideProcessing,
          canvasBackgroundColor: state.canvasBackgroundColor,
        },
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
      // createCanvasTexture와 동일한 비율 사용
      const pixelScale = 4000; // utils.ts와 동일한 값
      const frontWidthScaled = canvasProductSizeM.widthM * pixelScale * scale;
      const frontHeightScaled = canvasProductSizeM.heightM * pixelScale * scale;
      const sideThicknessScaled =
        canvasProductSizeM.thicknessM * pixelScale * scale;

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
