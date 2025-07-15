import { SideMode } from "../../common/CanvasView/types";

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
  maxYRotation: 60,
} as const;

export { SideMode };


export const CAMERA_PRESETS = [
  { label: "정면", rotation: { x: 0, y: 0 } },
  { label: "우측", rotation: { x: 0, y: 25 } },
  { label: "좌측", rotation: { x: 0, y: -25 } },
  { label: "위에서", rotation: { x: 15, y: 0 } },
];
