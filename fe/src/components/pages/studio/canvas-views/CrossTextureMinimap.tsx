import { useEffect, useRef, useState, useMemo } from "react";
import { useStudioContext } from "..";
import { createCrossTexture } from "./createCrossTexture";

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
      imageScale: state.imageScale,
      imageCenterXy: state.imageCenterXy,
      sideProcessing: state.sideProcessing,
      canvasTextureImg: canvasTextureImg,
    });
  }, [
    state.uploadedImage,
    state.imageScale,
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

      // 캔버스 크기 설정
      canvas.width = 200;
      canvas.height = 200;

      // 배경 지우기
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Three.js texture의 image 데이터 가져오기
      const textureCanvas = crossTexture.image as HTMLCanvasElement;

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
          style={{ width: "200px", height: "200px" }}
        />
      </div>
    </div>
  );
}
