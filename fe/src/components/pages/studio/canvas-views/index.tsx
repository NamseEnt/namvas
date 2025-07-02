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
import {
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useStudioContext, useCanvasViewsContext } from "..";
import { CAMERA_ROTATION_LIMITS } from "../types";
import { UploadPromptBox } from "./UploadPromptBox";
import { createCrossTexture } from "./createCrossTexture";
import { CrossTextureMinimap } from "./CrossTextureMinimap";
import { CameraRotationButtons } from "./CameraRotationButtons";
import { backgroundOptions } from "../constants/backgroundOptions";


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
            <p className="text-gray-600 mb-2">3D 프리뷰를 로드할 수 없습니다.</p>
            <button 
              onClick={() => setHasCanvasError(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <PerspectiveCollage onError={() => setHasCanvasError(true)} />
      )}
    </div>
  );
}

function PerspectiveCollage({ onError }: { onError?: () => void }) {
  const { state, updateState } = useCanvasViewsContext();
  const { handleImageUpload, state: studioState } = useStudioContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  // 초기 카메라 거리도 캔버스 크기에 비례하게 설정
  const initialCameraDistance = Math.sqrt(canvasProductSize.width ** 2 + canvasProductSize.height ** 2) * 1.5;
  const [cameraDistance, setCameraDistance] = useState(initialCameraDistance);

  // 카메라 거리 설정 변수들 - 캔버스 크기에 비례
  const canvasDiagonal = Math.sqrt(canvasProductSize.width ** 2 + canvasProductSize.height ** 2);
  const baseCameraDistance = canvasDiagonal * 1.5; // 캔버스 대각선의 1.5배
  const cameraDistanceMultiplier = canvasDiagonal * 0.003;

  useEffect(
    function updateCameraDistance() {
      const distance =
        baseCameraDistance +
        (Math.abs(state.rotation.y) + Math.abs(state.rotation.x)) *
          cameraDistanceMultiplier;
      setCameraDistance(distance);
    },
    [
      state.rotation.x,
      state.rotation.y,
      baseCameraDistance,
      cameraDistanceMultiplier,
    ]
  );

  useEffect(function initializeThreeJS() {
    RectAreaLightUniformsLib.init();
  }, []);

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
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, initialCameraDistance],
          fov: 35,
        }}
        style={{ width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true }}
        onError={(error) => {
          console.error('Three.js Canvas Error:', error);
          onError?.();
        }}
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-600">3D 캔버스를 로딩중...</p>
          </div>
        }
      >
        <CameraController cameraDistance={cameraDistance} />
        <ambientLight intensity={1.0} />
        <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
        <directionalLight position={[0, 0, 1]} intensity={1.0} />
        {/* 오른쪽 자연광 */}
        <directionalLight
          position={[2, 1, 0]}
          intensity={0.8}
          color="#fffacd"
        />
        {/* 상단 형광등 느낌 */}
        <directionalLight
          position={[1, 2, 0]}
          intensity={0.6}
          color="#f0f8ff"
        />
        <CanvasFrame />
        <OrbitControls
          enabled={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
      <CrossTextureMinimap />
      <CameraRotationButtons />
    </div>
  );
}

function CameraController({ cameraDistance }: { cameraDistance: number }) {
  useThree(({ camera }) => {
    camera.position.setZ(cameraDistance);
  });
  return null;
}

function CanvasFrame() {
  const { state: studioState } = useStudioContext();
  const { state } = useCanvasViewsContext();
  const meshRef = useRef<THREE.Mesh>(null);

  const [canvasTextureImg, setCanvasTextureImg] =
    useState<HTMLImageElement>();

  useEffect(function loadCanvasTexture() {
    const img = new Image();
    img.onload = () => setCanvasTextureImg(img);
    img.src = "./canvas-texture.jpg";
  }, []);

  const crossTexture = useMemo(() => {
    if (!studioState.uploadedImage || !canvasTextureImg) {
      return null;
    }
    return createCrossTexture({
      uploadedImage: studioState.uploadedImage,
      mmPerPixel: studioState.mmPerPixel,
      imageCenterXy: studioState.imageCenterXy,
      sideProcessing: studioState.sideProcessing,
      canvasTextureImg: canvasTextureImg,
    });
  }, [
    studioState.uploadedImage,
    studioState.mmPerPixel,
    studioState.imageCenterXy,
    studioState.sideProcessing,
    canvasTextureImg,
  ]);

  useEffect(
    function updateMeshRotation() {
      if (meshRef.current) {
        meshRef.current.rotation.x = (state.rotation.x * Math.PI) / 180;
        meshRef.current.rotation.y = (state.rotation.y * Math.PI) / 180;
      }
    },
    [state.rotation]
  );

  if (!crossTexture) {
    return null;
  }

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <CustomCanvasGeometry crossTexture={crossTexture} />
    </group>
  );
}

/**
 * meter unit
 */
// 4x6 inch canvas frame = 101.6mm × 152.4mm
export const canvasProductSize = {
  width: 0.1016, // 4 inches = 101.6mm
  height: 0.1524, // 6 inches = 152.4mm
  depth: 0.006,
};

function CustomCanvasGeometry({
  crossTexture,
}: {
  crossTexture: THREE.Texture;
}) {
  // 캔버스 크기 (Three.js 단위)

  // 십자형 텍스처 UV 좌표 계산
  const frontWidth = 800;
  const frontHeight = 1200;
  const sideThickness = 50;
  const totalWidth = frontWidth + sideThickness * 2;
  const totalHeight = frontHeight + sideThickness * 2;

  const frontLeft = sideThickness / totalWidth;
  const frontRight = (sideThickness + frontWidth) / totalWidth;
  const frontTop = sideThickness / totalHeight;
  const frontBottom = (sideThickness + frontHeight) / totalHeight;

  const leftLeft = 0;
  const leftRight = frontLeft;
  const rightLeft = frontRight;
  const rightRight = 1;

  const topTop = 0;
  const topBottom = frontTop;
  const bottomTop = frontBottom;
  const bottomBottom = 1;

  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.width,
      canvasProductSize.height
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    const uvArray = uvAttribute.array as Float32Array;

    // 정면 영역 UV 설정
    uvArray[0] = frontLeft;
    uvArray[1] = frontBottom; // 좌하
    uvArray[2] = frontRight;
    uvArray[3] = frontBottom; // 우하
    uvArray[4] = frontLeft;
    uvArray[5] = frontTop; // 좌상
    uvArray[6] = frontRight;
    uvArray[7] = frontTop; // 우상

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, frontTop, frontBottom]);

  const rightGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.depth,
      canvasProductSize.height
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    // Y축 90도 회전 후 정점 위치에 맞는 UV 수정
    uvAttribute.setXY(0, rightLeft, frontBottom); // 정점0 (앞-아래) -> R 좌하단
    uvAttribute.setXY(1, rightRight, frontBottom); // 정점1 (뒤-아래) -> R 우하단
    uvAttribute.setXY(2, rightLeft, frontTop); // 정점2 (앞-위) -> R 좌상단
    uvAttribute.setXY(3, rightRight, frontTop); // 정점3 (뒤-위) -> R 우상단

    uvAttribute.needsUpdate = true;
    return geo;
  }, [rightLeft, rightRight, frontTop, frontBottom]);

  const leftGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.depth,
      canvasProductSize.height
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    // Y축 -90도 회전 후 정점 위치에 맞는 UV 수정
    uvAttribute.setXY(0, leftLeft, frontBottom); // 정점0 (뒤-아래) -> L 좌하단
    uvAttribute.setXY(1, leftRight, frontBottom); // 정점1 (앞-아래) -> L 우하단
    uvAttribute.setXY(2, leftLeft, frontTop); // 정점2 (뒤-위) -> L 좌상단
    uvAttribute.setXY(3, leftRight, frontTop); // 정점3 (앞-위) -> L 우상단

    uvAttribute.needsUpdate = true;
    return geo;
  }, [leftLeft, leftRight, frontTop, frontBottom]);

  const topGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.width,
      canvasProductSize.depth
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    // 상단면: 위쪽을 바라보는 면 - 하단 텍스처 영역 사용
    uvAttribute.setXY(0, frontLeft, bottomBottom); // 정점0 -> B 좌하단
    uvAttribute.setXY(1, frontRight, bottomBottom); // 정점1 -> B 우하단
    uvAttribute.setXY(2, frontLeft, bottomTop); // 정점2 -> B 좌상단
    uvAttribute.setXY(3, frontRight, bottomTop); // 정점3 -> B 우상단

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, bottomTop, bottomBottom]);

  const bottomGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.width,
      canvasProductSize.depth
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    // 하단면: 아래쪽을 바라보는 면 - 상단 텍스처 영역 사용 (위아래 반전 수정)
    uvAttribute.setXY(0, frontLeft, topBottom); // 정점0 -> T 좌하단
    uvAttribute.setXY(1, frontRight, topBottom); // 정점1 -> T 우하단
    uvAttribute.setXY(2, frontLeft, topTop); // 정점2 -> T 좌상단
    uvAttribute.setXY(3, frontRight, topTop); // 정점3 -> T 우상단

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, topTop, topBottom]);

  return (
    <>
      {/* 정면 */}
      <mesh
        position={[0, 0, canvasProductSize.depth / 2]}
        geometry={frontGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 우측면 */}
      <mesh
        position={[canvasProductSize.width / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={rightGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 좌측면 */}
      <mesh
        position={[-canvasProductSize.width / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={leftGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 상단면 */}
      <mesh
        position={[0, canvasProductSize.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={topGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 하단면 */}
      <mesh
        position={[0, -canvasProductSize.height / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={bottomGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>
    </>
  );
}

