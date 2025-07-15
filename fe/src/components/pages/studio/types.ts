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

export const CAMERA_ROTATION_LIMITS = {
  maxXRotation: 25,
  maxYRotation: 45,
} as const;

export enum SideMode {
  CLIP = "clip",
  PRESERVE = "preserve",
  FLIP = "flip",
}

export const lrtbs = ["left", "top", "right", "bottom"] as const;
export const w = 0.1;
export const h = 0.15;
export const t = 0.006;

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

export const CAMERA_PRESETS = [
  { label: "정면", rotation: { x: 0, y: 0 } },
  { label: "우측", rotation: { x: 0, y: 25 } },
  { label: "좌측", rotation: { x: 0, y: -25 } },
  { label: "위에서", rotation: { x: 15, y: 0 } },
];
