// Texture optimization utilities for CanvasView
import { canvasProductSizeM } from "../constants";
import * as THREE from "three";

// 화면에서 보이는 실제 픽셀 크기를 기반으로 최적의 pixelsPerThreeUnit 계산
export function calculateOptimalPixelsPerThreeUnit(canvasSize: { width: number; height: number }): number {
  // 정면 뷰에서의 카메라 거리
  const canvasDiagonal = Math.sqrt(
    canvasProductSizeM.widthM ** 2 + canvasProductSizeM.heightM ** 2
  );
  const cameraDistance = canvasDiagonal * 1.5; // 0.26625m
  
  // Three.js 투영 계산 (FOV 35도)
  const fovRad = (35 * Math.PI) / 180; // 0.6109 라디안
  const viewHeight = 2 * Math.tan(fovRad / 2) * cameraDistance; // 0.1691 Three.js unit
  const aspectRatio = canvasSize.width / canvasSize.height;
  const viewWidth = viewHeight * aspectRatio; // 0.3382 Three.js unit (300/150 = 2 기준)
  
  // 캔버스 액자가 화면에서 차지하는 픽셀 계산
  const canvasPixelHeight = canvasSize.height * (canvasProductSizeM.heightM / viewHeight);
  const canvasPixelWidth = canvasSize.width * (canvasProductSizeM.widthM / viewWidth);
  
  // 1:1 픽셀 매칭을 위한 기본값
  const basePixelsPerUnit = Math.max(
    canvasPixelWidth / canvasProductSizeM.widthM,
    canvasPixelHeight / canvasProductSizeM.heightM
  );
  
  // 2배 품질 적용
  return basePixelsPerUnit * 2;
}

// 카메라 거리 계산
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

// 사용자 이미지 텍스처 생성 (원본 크기 유지)
export function createOptimizedTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4; // 적당한 품질로 조정
  return texture;
}

// 기본 텍스처 설정 적용
export function applyOptimalTextureSettings(texture: THREE.Texture): void {
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
}