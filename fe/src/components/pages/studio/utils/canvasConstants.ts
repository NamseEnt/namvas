// Canvas constants and unit conversions for studio page

// Unit conversion constants
export const METER_PER_INCH = 0.0254;

// Unit conversion functions
export const inchToMeter = (inch: number) => inch * METER_PER_INCH;
export const mmToMeter = (mm: number) => mm * 0.001;

// CanvasProduct dimensions in meters (for r3f)
export const canvasProductSizeM = {
  widthM: 0.098,
  heightM: 0.148,
  thicknessM: 0.006,
};

// Aliases for easier access
export const CANVAS_WIDTH_M = canvasProductSizeM.widthM;
export const CANVAS_HEIGHT_M = canvasProductSizeM.heightM;
export const CANVAS_THICKNESS_M = canvasProductSizeM.thicknessM;