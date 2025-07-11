/*
### **컴포넌트 명세: 좌측 프리뷰 영역 (Left Preview Area)**

#### **1. 개념 및 명칭**

* **컨셉:** 3D 프리뷰

#### **2. 컴포넌트 (초기 상태 - 이미지 업로드 전)**

* **업로드 유도 박스 (Upload Prompt Box):**
    * **기능:** 이 영역 전체가 하나의 완전한 업로드 컴포넌트로 작동한다. 파일 드래그 앤 드롭과 **클릭 시 파일 탐색기 열기 기능을 모두 지원**한다.
    * **안내 텍스트:** 박스 내부에 다음의 텍스트를 명확하게 표시한다.
        > **"여기에 사진을 드래그 앤 드롭 하거나 클릭하여 업로드하세요."**

#### **3. 컴포넌트 (활성 상태 - 이미지 업로드 후)**

이미지 업로드 시, 프리뷰 영역은 3D 프리뷰가 된다.

# 캔버스 액자에 대한 정의
- 캔버스 액자의 모든 면은 기본적으로 흰색이다.
- 캔버스 액자의 크기는 좌우 100mm, 상하 150mm, 두께 6mm이다.

이러한 상황에 맞게 캔버스의 미리보기를 보여주어야 한다.

마우스를 드래그 한 상태에서 움직이면 캔버스가 회전한다.
단, 캔버스의 뒷면은 보여지지 않아야한다. 그러기 위해서 회전 각도를 조절해야한다.
납득 가능한 UX로 이 회전 각도를 조절하라.

*/
import { useEffect, useState, useRef } from "react";
import { useStudioContext, useCanvasViewsContext } from "../StudioPage";
import { CAMERA_ROTATION_LIMITS } from "../types";
import { UploadPromptBox } from "./UploadPromptBox";
import { CrossTextureMinimap } from "./CrossTextureMinimap";
import { CameraRotationButtons } from "./CameraRotationButtons";
import { backgroundOptions } from "../constants/backgroundOptions";
import { CanvasView } from "@/components/common/CanvasView/CanvasView";

export default function CanvasViews() {
  const { state: studioState } = useStudioContext();
  const [hasCanvasError, setHasCanvasError] = useState(false);

  return (
    <div className="w-full h-full">
      {!studioState.uploadedImage ? (
        <UploadPromptBox />
      ) : hasCanvasError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              3D 프리뷰를 로드할 수 없습니다.
            </p>
            <button
              onClick={() => setHasCanvasError(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <PerspectiveCollage />
      )}
    </div>
  );
}

function PerspectiveCollage() {
  const { state, updateState, handleUVTransformChange } = useCanvasViewsContext();
  const { handleImageUpload, state: studioState } = useStudioContext();
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) {
      return;
    }

    const deltaX = e.clientX - lastMousePosition.current.x;
    const deltaY = e.clientY - lastMousePosition.current.y;

    const sensitivity = 0.3;
    const newRotationX = state.rotation.x + deltaY * sensitivity;
    const newRotationY = state.rotation.y + deltaX * sensitivity;

    // 뒷면이 보이지 않도록 자연스럽게 제한
    const maxXRotation = CAMERA_ROTATION_LIMITS.maxXRotation;
    const maxYRotation = CAMERA_ROTATION_LIMITS.maxYRotation;

    // 부드러운 제한을 위한 비선형 함수 적용
    const limitRotation = (value: number, max: number) => {
      const ratio = Math.abs(value) / max;
      if (ratio <= 1) {
        return value;
      }

      // 제한 구역에서는 점진적으로 저항 증가
      const resistance = 1 + (ratio - 1) * 3;
      return Math.sign(value) * max * (1 + Math.log(ratio) / resistance);
    };

    updateState({
      rotation: {
        x: Math.max(
          -maxXRotation * 1.2,
          Math.min(
            maxXRotation * 1.2,
            limitRotation(newRotationX, maxXRotation)
          )
        ),
        y: Math.max(
          -maxYRotation * 1.5,
          Math.min(
            maxYRotation * 1.5,
            limitRotation(newRotationY, maxYRotation)
          )
        ),
      },
    });

    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  useEffect(function handleGlobalMouseEvents() {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // 선택된 배경 스타일 가져오기
  const selectedBackground = backgroundOptions.find(
    (option) => option.value === studioState.canvasBackgroundColor
  );

  return (
    <div
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      style={selectedBackground?.style || {}}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <CanvasView
        rotation={state.rotation}
        src={
          studioState.uploadedImage
            ? { type: "image", image: studioState.uploadedImage }
            : undefined
        }
        settings={{
          dpi: studioState.dpi,
          imageCenterXyInch: studioState.imageCenterXyInch,
          sideProcessing: studioState.sideProcessing,
          canvasBackgroundColor: studioState.canvasBackgroundColor,
        }}
        uvTransform={state.uvTransform}
        onUVTransformChange={handleUVTransformChange}
      />
      <CrossTextureMinimap />
      <CameraRotationButtons />
    </div>
  );
}
