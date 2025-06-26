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
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useStudioContext } from "..";
import { UploadPromptBox } from "./UploadPromptBox";
import { Button } from "@/components/ui/button";

type CanvasViewsState = {
  rotation: { x: number; y: number };
};

const CanvasViewsContext = createContext<{
  state: CanvasViewsState;
  updateState: (updates: Partial<CanvasViewsState>) => void;
}>(null as any);

export const useCanvasViewsContext = () => useContext(CanvasViewsContext);

export default function CanvasViews() {
  const { state: studioState } = useStudioContext();
  const [state, setState] = useState<CanvasViewsState>({
    rotation: { x: 0, y: 0 },
  });

  const updateState = (updates: Partial<CanvasViewsState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <CanvasViewsContext.Provider
      value={{
        state,
        updateState: updateState,
      }}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-1">
          {!studioState.uploadedImage ? (
            <UploadPromptBox />
          ) : (
            <PerspectiveCollage />
          )}
        </div>
        {/* ViewAngleButtons는 PerspectiveCollage 내부에서 렌더링 */}
      </div>
    </CanvasViewsContext.Provider>
  );
}

function PerspectiveCollage() {
  const { state, updateState } = useCanvasViewsContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const [cameraDistance, setCameraDistance] = useState(0.25);

  // 카메라 거리 설정 변수들
  const baseCameraDistance = 0.25;
  const cameraDistanceMultiplier = 0.0005;

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
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMousePosition.current.x;
    const deltaY = e.clientY - lastMousePosition.current.y;

    const sensitivity = 0.3;
    const newRotationX = state.rotation.x + deltaY * sensitivity;
    const newRotationY = state.rotation.y + deltaX * sensitivity;

    // 뒷면이 보이지 않도록 자연스럽게 제한
    const maxXRotation = 25;
    const maxYRotation = 45;

    // 부드러운 제한을 위한 비선형 함수 적용
    const limitRotation = (value: number, max: number) => {
      const ratio = Math.abs(value) / max;
      if (ratio <= 1) return value;

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

  useEffect(function handleGlobalMouseEvents() {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, 0.25],
          fov: 35,
        }}
        style={{ width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true }}
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
      <ViewAngleButtons />
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
    useState<HTMLImageElement | null>(null);

  useEffect(function loadCanvasTexture() {
    const img = new Image();
    img.onload = () => setCanvasTextureImg(img);
    img.src = "./canvas-texture.jpg";
  }, []);

  const texture = useMemo(() => {
    if (!studioState.uploadedImage || !canvasTextureImg) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 1181;
    canvas.height = 1772;

    // 기본 배경색
    ctx.fillStyle =
      studioState.sideProcessing === "white"
        ? "#f8f5f0"
        : studioState.defaultColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 캔버스 텍스처 패턴 생성 및 적용 (더 하얗게)
    const texturePattern = ctx.createPattern(canvasTextureImg, "repeat");
    if (texturePattern) {
      ctx.save();
      ctx.scale(
        canvas.width / (canvasTextureImg.width * 2),
        canvas.height / (canvasTextureImg.height * 3)
      );
      ctx.fillStyle = texturePattern;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        0,
        0,
        canvasTextureImg.width * 2,
        canvasTextureImg.height * 3
      );
      ctx.restore();
    }

    // 업로드한 이미지 그리기
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(studioState.imageScale, studioState.imageScale);
    ctx.translate(studioState.imagePosition.x, studioState.imagePosition.y);
    ctx.rotate((studioState.canvasAngle * Math.PI) / 180);
    ctx.drawImage(
      studioState.uploadedImage,
      -studioState.uploadedImage.width / 2,
      -studioState.uploadedImage.height / 2
    );
    ctx.restore();

    // 이미지 위에 약한 텍스처 오버레이
    if (texturePattern) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.1;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(studioState.imageScale, studioState.imageScale);
      ctx.translate(studioState.imagePosition.x, studioState.imagePosition.y);
      ctx.rotate((studioState.canvasAngle * Math.PI) / 180);

      const imgX = -studioState.uploadedImage.width / 2;
      const imgY = -studioState.uploadedImage.height / 2;
      const imgW = studioState.uploadedImage.width;
      const imgH = studioState.uploadedImage.height;

      ctx.beginPath();
      ctx.rect(imgX, imgY, imgW, imgH);
      ctx.clip();
      ctx.scale(
        imgW / (canvasTextureImg.width * 2),
        imgH / (canvasTextureImg.height * 3)
      );
      ctx.fillStyle = texturePattern;
      ctx.fillRect(
        0,
        0,
        canvasTextureImg.width * 2,
        canvasTextureImg.height * 3
      );
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [
    studioState.uploadedImage,
    studioState.imageScale,
    studioState.imagePosition,
    studioState.canvasAngle,
    studioState.sideProcessing,
    studioState.defaultColor,
    canvasTextureImg,
  ]);

  const materials = useMemo(() => {
    const loader = new THREE.TextureLoader();

    // 각 면에 맞는 텍스처 생성
    const frontBackTexture = loader.load("./canvas-texture.jpg");
    frontBackTexture.wrapS = frontBackTexture.wrapT = THREE.RepeatWrapping;
    frontBackTexture.repeat.set(2, 3); // 정면/뒷면: 100mm x 150mm

    const leftRightTexture = loader.load("./canvas-texture.jpg");
    leftRightTexture.wrapS = leftRightTexture.wrapT = THREE.RepeatWrapping;
    leftRightTexture.repeat.set(0.12, 3); // 좌우면: 6mm x 150mm

    const topBottomTexture = loader.load("./canvas-texture.jpg");
    topBottomTexture.wrapS = topBottomTexture.wrapT = THREE.RepeatWrapping;
    topBottomTexture.repeat.set(2, 0.12); // 상하면: 100mm x 6mm

    // 텍스처에 흰색 오버레이 추가
    leftRightTexture.offset.set(0, 0);
    topBottomTexture.offset.set(0, 0);
    frontBackTexture.offset.set(0, 0);

    // 측면용 텍스처 - 정면과 동일한 스타일
    const sideTexture = createSideTexture(canvasTextureImg);

    return [
      new THREE.MeshStandardMaterial({
        map: sideTexture,
        toneMapped: false,
      }), // 우측면
      new THREE.MeshStandardMaterial({
        map: sideTexture,
        toneMapped: false,
      }), // 좌측면
      new THREE.MeshStandardMaterial({
        map: sideTexture,
        toneMapped: false,
      }), // 상면
      new THREE.MeshStandardMaterial({
        map: sideTexture,
        toneMapped: false,
      }), // 하면
      new THREE.MeshStandardMaterial({ map: texture, toneMapped: false }), // 정면
      new THREE.MeshStandardMaterial({
        map: sideTexture,
        toneMapped: false,
      }), // 뒷면
    ];
  }, [
    studioState.sideProcessing,
    studioState.defaultColor,
    texture,
    canvasTextureImg,
  ]);

  function createSideTexture(canvasTextureImg: HTMLImageElement | null) {
    if (!canvasTextureImg) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 512;
    canvas.height = 512;

    // 정면과 동일한 배경색
    const baseColor =
      studioState.sideProcessing === "white"
        ? "#f8f5f0"
        : studioState.defaultColor;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 정면과 동일한 텍스처 패턴 적용
    const texturePattern = ctx.createPattern(canvasTextureImg, "repeat");
    if (texturePattern) {
      ctx.save();
      ctx.scale(
        canvas.width / (canvasTextureImg.width * 2),
        canvas.height / (canvasTextureImg.height * 3)
      );
      ctx.fillStyle = texturePattern;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        0,
        0,
        canvasTextureImg.width * 2,
        canvasTextureImg.height * 3
      );
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  useEffect(
    function updateMeshRotation() {
      if (meshRef.current) {
        meshRef.current.rotation.x = (state.rotation.x * Math.PI) / 180;
        meshRef.current.rotation.y = (state.rotation.y * Math.PI) / 180;
      }
    },
    [state.rotation]
  );

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} material={materials}>
      <boxGeometry args={[0.1, 0.15, 0.006]} />
    </mesh>
  );
}

function drawCanvasTextureOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 1.0,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const scale = Math.max(width, height) / 128;
  const spacing = Math.max(4, Math.round(4 * scale));

  // 세로 실 (경사)
  for (let x = offsetX; x < offsetX + width; x += spacing) {
    ctx.fillStyle = `rgba(230, 220, 200, ${0.4 * intensity})`;
    ctx.fillRect(x, offsetY, 1, height);
    ctx.fillStyle = `rgba(210, 200, 180, ${0.2 * intensity})`;
    ctx.fillRect(x + 1, offsetY, 1, height);
  }

  // 가로 실 (위사)
  for (let y = offsetY; y < offsetY + height; y += spacing) {
    ctx.fillStyle = `rgba(220, 210, 190, ${0.3 * intensity})`;
    ctx.fillRect(offsetX, y, width, 1);
    ctx.fillStyle = `rgba(200, 190, 170, ${0.2 * intensity})`;
    ctx.fillRect(offsetX, y + 1, width, 1);
  }

  // 직조 교차점 강조
  const crossSpacing = spacing * 2;
  for (let x = offsetX; x < offsetX + width; x += crossSpacing) {
    for (let y = offsetY; y < offsetY + height; y += crossSpacing) {
      ctx.fillStyle = `rgba(190, 180, 160, ${0.15 * intensity})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function createCanvasTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = 128;
  canvas.height = 128;

  // 기본 미색 배경
  ctx.fillStyle = "#f8f5f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 천 텍스처 그리기
  drawCanvasTextureOnCanvas(ctx, canvas.width, canvas.height, 1.0);

  // 자연스러운 노이즈
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function ViewAngleButtons() {
  const { updateState } = useCanvasViewsContext();

  const viewAngles = [
    { name: "정면", rotation: { x: 0, y: 0 }, icon: "📷" },
    { name: "우측면", rotation: { x: 0, y: 40 }, icon: "👉" },
    { name: "좌측면", rotation: { x: 0, y: -40 }, icon: "👈" },
    { name: "상단뷰", rotation: { x: 25, y: 0 }, icon: "👆" },
    { name: "우상단", rotation: { x: 20, y: 45 }, icon: "↗️" },
    { name: "좌상단", rotation: { x: 20, y: -45 }, icon: "↖️" },
    { name: "입체감", rotation: { x: -20, y: -45 }, icon: "🎯" },
  ];

  const handleAngleChange = (targetRotation: { x: number; y: number }) => {
    updateState({ rotation: targetRotation });
  };

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-medium mb-2 text-gray-700">빠른 각도</h4>
        <div className="flex flex-wrap gap-1">
          {viewAngles.map((angle) => (
            <Button
              key={angle.name}
              variant="outline"
              size="sm"
              onClick={() => handleAngleChange(angle.rotation)}
              className="text-xs h-7 px-2 flex items-center gap-1 bg-white/80 hover:bg-white"
            >
              <span className="text-xs">{angle.icon}</span>
              <span className="hidden sm:inline">{angle.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
