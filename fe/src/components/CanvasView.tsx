import { useEffect, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

type ViewAngle = 'front' | 'rightBottomUp' | 'leftTopDown';

export default function CanvasView({ angle, textureUrl, texture, className }: {
  angle: ViewAngle;
  textureUrl?: string;
  texture?: THREE.Texture;
  className?: string;
}) {
  const [canvasTextureImg, setCanvasTextureImg] = useState<HTMLImageElement | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(function loadCanvasTexture() {
    const img = new Image();
    img.onload = () => setCanvasTextureImg(img);
    img.src = "./canvas-texture.jpg";
  }, []);

  useEffect(function loadUploadedImage() {
    if (!textureUrl || texture) {
      setUploadedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setUploadedImage(img);
    img.onerror = () => setUploadedImage(null);
    img.src = textureUrl;
  }, [textureUrl, texture]);

  useEffect(function initializeThreeJS() {
    RectAreaLightUniformsLib.init();
  }, []);

  const getRotation = () => {
    switch (angle) {
      case 'front':
        return { x: 0, y: 0 };
      case 'rightBottomUp':
        return { x: -20, y: 45 };
      case 'leftTopDown':
        return { x: 20, y: -45 };
    }
  };

  const rotation = getRotation();

  if (!canvasTextureImg) {
    return (
      <div className={`w-full aspect-[3/4] bg-gray-200 flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[3/4] rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 0.25],
          fov: 35,
        }}
        style={{ width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[-1, 1, 1]} intensity={1.5} />
        <directionalLight position={[0, 0, 1]} intensity={1.0} />
        <directionalLight
          position={[2, 1, 0]}
          intensity={0.8}
          color="#fffacd"
        />
        <directionalLight
          position={[1, 2, 0]}
          intensity={0.6}
          color="#f0f8ff"
        />
        <CanvasFrame 
          rotation={rotation}
          uploadedImage={uploadedImage}
          canvasTextureImg={canvasTextureImg}
          providedTexture={texture}
        />
      </Canvas>
    </div>
  );
}

function CanvasFrame({ 
  rotation, 
  uploadedImage, 
  canvasTextureImg,
  providedTexture 
}: { 
  rotation: { x: number; y: number };
  uploadedImage: HTMLImageElement | null;
  canvasTextureImg: HTMLImageElement;
  providedTexture?: THREE.Texture;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const crossTexture = useMemo(() => {
    // If texture is provided directly, use it
    if (providedTexture) {
      return providedTexture;
    }
    
    // Otherwise, create texture from image
    if (!uploadedImage) {
      return createDefaultTexture(canvasTextureImg);
    }
    return createCrossTextureFromUrl({
      uploadedImage,
      canvasTextureImg,
    });
  }, [uploadedImage, canvasTextureImg, providedTexture]);

  useEffect(function updateMeshRotation() {
    if (meshRef.current) {
      meshRef.current.rotation.x = (rotation.x * Math.PI) / 180;
      meshRef.current.rotation.y = (rotation.y * Math.PI) / 180;
    }
  }, [rotation]);

  if (!crossTexture) {
    return null;
  }

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <CustomCanvasGeometry crossTexture={crossTexture} />
    </group>
  );
}

// 4x6 inch canvas frame = 101.6mm × 152.4mm
const canvasProductSize = {
  width: 0.1016,
  height: 0.1524,
  depth: 0.006,
};

function CustomCanvasGeometry({
  crossTexture,
}: {
  crossTexture: THREE.Texture;
}) {
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

    uvArray[0] = frontLeft;
    uvArray[1] = frontBottom;
    uvArray[2] = frontRight;
    uvArray[3] = frontBottom;
    uvArray[4] = frontLeft;
    uvArray[5] = frontTop;
    uvArray[6] = frontRight;
    uvArray[7] = frontTop;

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, frontTop, frontBottom]);

  const rightGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.depth,
      canvasProductSize.height
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, rightLeft, frontBottom);
    uvAttribute.setXY(1, rightRight, frontBottom);
    uvAttribute.setXY(2, rightLeft, frontTop);
    uvAttribute.setXY(3, rightRight, frontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [rightLeft, rightRight, frontTop, frontBottom]);

  const leftGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.depth,
      canvasProductSize.height
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, leftLeft, frontBottom);
    uvAttribute.setXY(1, leftRight, frontBottom);
    uvAttribute.setXY(2, leftLeft, frontTop);
    uvAttribute.setXY(3, leftRight, frontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [leftLeft, leftRight, frontTop, frontBottom]);

  const topGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.width,
      canvasProductSize.depth
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, frontLeft, bottomBottom);
    uvAttribute.setXY(1, frontRight, bottomBottom);
    uvAttribute.setXY(2, frontLeft, bottomTop);
    uvAttribute.setXY(3, frontRight, bottomTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, bottomTop, bottomBottom]);

  const bottomGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSize.width,
      canvasProductSize.depth
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, frontLeft, topBottom);
    uvAttribute.setXY(1, frontRight, topBottom);
    uvAttribute.setXY(2, frontLeft, topTop);
    uvAttribute.setXY(3, frontRight, topTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, topTop, topBottom]);

  return (
    <>
      <mesh
        position={[0, 0, canvasProductSize.depth / 2]}
        geometry={frontGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[canvasProductSize.width / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={rightGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[-canvasProductSize.width / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={leftGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[0, canvasProductSize.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={topGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

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

function createDefaultTexture(canvasTextureImg: HTMLImageElement): THREE.Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const pixelScale = 4000;
  const frontWidth = canvasProductSize.width * pixelScale;
  const frontHeight = canvasProductSize.height * pixelScale;
  const thickness = canvasProductSize.depth * pixelScale;

  canvas.width = frontWidth + thickness * 2;
  canvas.height = frontHeight + thickness * 2;

  const texturePattern = ctx.createPattern(canvasTextureImg, "repeat")!;
  ctx.fillStyle = texturePattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createCrossTextureFromUrl({
  uploadedImage,
  canvasTextureImg,
}: {
  uploadedImage: HTMLImageElement;
  canvasTextureImg: HTMLImageElement;
}): THREE.Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const pixelScale = 4000;
  const frontWidth = canvasProductSize.width * pixelScale;
  const frontHeight = canvasProductSize.height * pixelScale;
  const thickness = canvasProductSize.depth * pixelScale;

  canvas.width = frontWidth + thickness * 2;
  canvas.height = frontHeight + thickness * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply canvas texture background
  const texturePattern = ctx.createPattern(canvasTextureImg, "repeat")!;
  ctx.save();
  ctx.fillStyle = texturePattern;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Calculate scaling to fit image within front area while maintaining aspect ratio
  const frontAspect = frontWidth / frontHeight;
  const imageAspect = uploadedImage.width / uploadedImage.height;
  
  let drawWidth, drawHeight;
  if (imageAspect > frontAspect) {
    // Image is wider, fit to width
    drawWidth = frontWidth;
    drawHeight = frontWidth / imageAspect;
  } else {
    // Image is taller, fit to height
    drawHeight = frontHeight;
    drawWidth = frontHeight * imageAspect;
  }

  const frontCenterX = thickness + frontWidth / 2;
  const frontCenterY = thickness + frontHeight / 2;

  // Draw image centered on front face
  ctx.save();
  ctx.drawImage(
    uploadedImage,
    frontCenterX - drawWidth / 2,
    frontCenterY - drawHeight / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}