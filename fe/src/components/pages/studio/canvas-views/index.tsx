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
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useStudioContext } from "..";
import { UploadPromptBox } from "./UploadPromptBox";

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
      <div className="w-full h-full">
        {!studioState.uploadedImage ? (
          <UploadPromptBox />
        ) : (
          <PerspectiveCollage />
        )}
      </div>
    </CanvasViewsContext.Provider>
  );
}

function PerspectiveCollage() {
  const { state, updateState } = useCanvasViewsContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
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

  useEffect(() => {
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
        camera={{ position: [0, 0, 0.35], fov: 35 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
        <directionalLight position={[0, 0, 1]} intensity={1.0} />
        {/* 오른쪽 자연광 */}
        <directionalLight position={[2, 1, 0]} intensity={0.8} color="#fffacd" />
        {/* 상단 형광등 느낌 */}
        <directionalLight position={[1, 2, 0]} intensity={0.6} color="#f0f8ff" />
        <CanvasFrame />
        <OrbitControls
          enabled={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}

function CanvasFrame() {
  const { state: studioState } = useStudioContext();
  const { state } = useCanvasViewsContext();
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    if (!studioState.uploadedImage) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 1181;
    canvas.height = 1772;

    ctx.fillStyle =
      studioState.sideProcessing === "white"
        ? "#ffffff"
        : studioState.defaultColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  ]);

  const materials = useMemo(() => {
    const sideColor =
      studioState.sideProcessing === "white"
        ? "#f8f5f0"
        : studioState.defaultColor;

    const canvasTexture = new THREE.CanvasTexture(createCanvasTexture());
    canvasTexture.wrapS = canvasTexture.wrapT = THREE.RepeatWrapping;
    canvasTexture.repeat.set(4, 4);

    return [
      new THREE.MeshStandardMaterial({ 
        color: sideColor, 
        map: canvasTexture,
        toneMapped: false 
      }),
      new THREE.MeshStandardMaterial({ 
        color: sideColor, 
        map: canvasTexture,
        toneMapped: false 
      }),
      new THREE.MeshStandardMaterial({ 
        color: sideColor, 
        map: canvasTexture,
        toneMapped: false 
      }),
      new THREE.MeshStandardMaterial({ 
        color: sideColor, 
        map: canvasTexture,
        toneMapped: false 
      }),
      new THREE.MeshStandardMaterial({ map: texture, toneMapped: false }),
      new THREE.MeshStandardMaterial({ 
        color: sideColor, 
        map: canvasTexture,
        toneMapped: false 
      }),
    ];
  }, [studioState.sideProcessing, studioState.defaultColor, texture]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = (state.rotation.x * Math.PI) / 180;
      meshRef.current.rotation.y = (state.rotation.y * Math.PI) / 180;
    }
  }, [state.rotation]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} material={materials}>
      <boxGeometry args={[0.1, 0.15, 0.006]} />
    </mesh>
  );
}
