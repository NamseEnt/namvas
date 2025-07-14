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

export const sideProcessingTypes = ["none", "clip", "color", "flip"] as const;

export const CAMERA_ROTATION_LIMITS = {
  maxXRotation: 25,
  maxYRotation: 45,
} as const;

// 옆면 처리 모드
export enum SideMode {
  CLIP = "clip", // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip", // 뒤집기
}

export const lrtbs = ["left", "top", "right", "bottom"] as const;
export const w = 0.1; // width
export const h = 0.15; // height
export const t = 0.006; // thickness

export const positions = {
  left: [-w / 2, 0, 0],
  top: [0, h / 2, 0],
  right: [w / 2, 0, 0],
  bottom: [0, -h / 2, 0],
} as const;

export const rotations = {
  left: [0, -Math.PI / 2, 0],
  top: [-Math.PI / 2, 0, 0],
  right: [0, Math.PI / 2, 0],
  bottom: [Math.PI / 2, 0, 0],
} as const;

export const sizes = {
  left: [t, h],
  top: [w, t],
  right: [t, h],
  bottom: [w, t],
} as const;
