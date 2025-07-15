import { canvasProductSizeM } from './constants';

export enum SideMode {
  CLIP = "clip",
  PRESERVE = "preserve", 
  FLIP = "flip"
}

export type SideProcessing =
  | {
      type: "none";
    }
  | {
      type: "clip";
    }
  | {
      type: "color";
      color: string;
    }
  | {
      type: "flip";
    };


// UV 좌표 범위 타입
export type UVBounds = {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
};

// 옆면 정보 타입
export type SideFaceInfo = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
};

// 면 방향 타입
export type FaceDirection = "left" | "top" | "right" | "bottom";

// 면 방향 상수
export const FACE_DIRECTIONS = ["left", "top", "right", "bottom"] as const;

// 캔버스 크기 상수들
const w = canvasProductSizeM.widthM;
const h = canvasProductSizeM.heightM;
const t = canvasProductSizeM.thicknessM;

// 옆면 위치 정보
export const SIDE_FACE_POSITIONS = {
  left: [-w / 2, 0, 0],
  top: [0, h / 2, 0],
  right: [w / 2, 0, 0],
  bottom: [0, -h / 2, 0],
} as const;

// 옆면 회전 정보
export const SIDE_FACE_ROTATIONS = {
  left: [0, -Math.PI / 2, 0],
  top: [-Math.PI / 2, 0, 0],
  right: [0, Math.PI / 2, 0],
  bottom: [Math.PI / 2, 0, 0],
} as const;

// 옆면 크기 정보
export const SIDE_FACE_SIZES = {
  left: [t, h],
  top: [w, t],
  right: [t, h],
  bottom: [w, t],
} as const;

// CanvasView 메인 Props 타입
export interface CanvasViewProps {
  imageSource: string | File | HTMLImageElement;
  rotation: { x: number; y: number };
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
}