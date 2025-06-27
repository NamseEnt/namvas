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
