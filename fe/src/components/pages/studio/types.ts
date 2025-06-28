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
