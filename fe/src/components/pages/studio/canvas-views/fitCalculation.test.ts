// Fit Calculation Test Suite
// This tests the mathematical correctness of the fit calculation logic

type FitType = "top" | "bottom" | "left" | "right";
type FitScope = "front" | "side";

interface TestCase {
  name: string;
  imageWidth: number;
  imageHeight: number;
  centerX: number;  // mm
  centerY: number;  // mm
  fitType: FitType;
  fitScope: FitScope;
  expectedMmPerPixel?: number;  // Optional for manual verification
}

function calculateFitMmPerPixel(
  imageWidth: number,
  imageHeight: number,
  centerX: number,
  centerY: number,
  fitType: FitType,
  fitScope: FitScope
): number {
  // Canvas dimensions in mm
  const frontWidth = 101.6; // mm (4 inches)
  const frontHeight = 152.4; // mm (6 inches)
  const sideThickness = 6; // mm
  
  let canvasWidth: number, canvasHeight: number;
  
  if (fitScope === "front") {
    canvasWidth = frontWidth;
    canvasHeight = frontHeight;
  } else {
    canvasWidth = frontWidth + sideThickness * 2;
    canvasHeight = frontHeight + sideThickness * 2;
  }
  
  let mmPerPixel: number;
  
  switch (fitType) {
    case "left":
      // Left fit: image left edge touches canvas left edge
      // centerX - (imageWidth/2) * mmPerPixel = -canvasWidth/2
      // mmPerPixel = (centerX + canvasWidth/2) / (imageWidth/2)
      mmPerPixel = (centerX + canvasWidth/2) / (imageWidth/2);
      break;
    
    case "right":
      // Right fit: image right edge touches canvas right edge
      // centerX + (imageWidth/2) * mmPerPixel = canvasWidth/2
      // mmPerPixel = (canvasWidth/2 - centerX) / (imageWidth/2)
      mmPerPixel = (canvasWidth/2 - centerX) / (imageWidth/2);
      break;
    
    case "top":
      // Top fit: image top edge touches canvas top edge
      // centerY + (imageHeight/2) * mmPerPixel = canvasHeight/2
      // mmPerPixel = (canvasHeight/2 - centerY) / (imageHeight/2)
      mmPerPixel = (canvasHeight/2 - centerY) / (imageHeight/2);
      break;
    
    case "bottom":
      // Bottom fit: image bottom edge touches canvas bottom edge
      // centerY - (imageHeight/2) * mmPerPixel = -canvasHeight/2
      // mmPerPixel = (centerY + canvasHeight/2) / (imageHeight/2)
      mmPerPixel = (centerY + canvasHeight/2) / (imageHeight/2);
      break;
    
    default:
      return 1;
  }
  
  return Math.max(0.001, mmPerPixel);
}

function verifyFit(
  imageWidth: number,
  imageHeight: number,
  centerX: number,
  centerY: number,
  mmPerPixel: number,
  fitType: FitType,
  fitScope: FitScope
): { success: boolean; actualEdgePosition: number; expectedEdgePosition: number } {
  // Canvas dimensions
  const frontWidth = 101.6;
  const frontHeight = 152.4;
  const sideThickness = 6;
  
  let canvasWidth: number, canvasHeight: number;
  
  if (fitScope === "front") {
    canvasWidth = frontWidth;
    canvasHeight = frontHeight;
  } else {
    canvasWidth = frontWidth + sideThickness * 2;
    canvasHeight = frontHeight + sideThickness * 2;
  }
  
  let actualEdgePosition: number;
  let expectedEdgePosition: number;
  
  switch (fitType) {
    case "left":
      actualEdgePosition = centerX - (imageWidth/2) * mmPerPixel;
      expectedEdgePosition = -canvasWidth/2;
      break;
    case "right":
      actualEdgePosition = centerX + (imageWidth/2) * mmPerPixel;
      expectedEdgePosition = canvasWidth/2;
      break;
    case "top":
      actualEdgePosition = centerY + (imageHeight/2) * mmPerPixel;
      expectedEdgePosition = canvasHeight/2;
      break;
    case "bottom":
      actualEdgePosition = centerY - (imageHeight/2) * mmPerPixel;
      expectedEdgePosition = -canvasHeight/2;
      break;
    default:
      return { success: false, actualEdgePosition: 0, expectedEdgePosition: 0 };
  }
  
  const tolerance = 0.01; // 0.01mm tolerance
  const success = Math.abs(actualEdgePosition - expectedEdgePosition) < tolerance;
  
  return { success, actualEdgePosition, expectedEdgePosition };
}

const testCases: TestCase[] = [
  {
    name: "Basic Left Fit - Center at origin",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 0,
    centerY: 0,
    fitType: "left",
    fitScope: "front"
  },
  {
    name: "Left Fit - Image moved right",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 20,  // moved 20mm to the right
    centerY: 0,
    fitType: "left",
    fitScope: "front"
  },
  {
    name: "Left Fit - Image moved left",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: -15,  // moved 15mm to the left
    centerY: 0,
    fitType: "left",
    fitScope: "front"
  },
  {
    name: "Left Fit - Image moved far left (-20mm)",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: -20,  // moved 20mm to the left
    centerY: 0,
    fitType: "left",
    fitScope: "front"
  },
  {
    name: "REAL APP TEST - Left Fit with actual image size",
    imageWidth: 1024,
    imageHeight: 679,
    centerX: -20,  // exactly like the real app
    centerY: 0,
    fitType: "left",
    fitScope: "front"
  },
  {
    name: "Right Fit - Center at origin",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 0,
    centerY: 0,
    fitType: "right",
    fitScope: "front"
  },
  {
    name: "Top Fit - Center at origin",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 0,
    centerY: 0,
    fitType: "top",
    fitScope: "front"
  },
  {
    name: "Bottom Fit - Center at origin",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 0,
    centerY: 0,
    fitType: "bottom",
    fitScope: "front"
  },
  {
    name: "Left Fit Side Scope - Center at origin",
    imageWidth: 1408,
    imageHeight: 768,
    centerX: 0,
    centerY: 0,
    fitType: "left",
    fitScope: "side"
  }
];

function runTests() {
  console.log("=== FIT CALCULATION TESTS ===\n");
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Input: ${testCase.imageWidth}×${testCase.imageHeight} px, center(${testCase.centerX}, ${testCase.centerY}) mm`);
    console.log(`  Fit: ${testCase.fitType}-${testCase.fitScope}`);
    
    const calculatedMmPerPixel = calculateFitMmPerPixel(
      testCase.imageWidth,
      testCase.imageHeight,
      testCase.centerX,
      testCase.centerY,
      testCase.fitType,
      testCase.fitScope
    );
    
    console.log(`  Calculated mmPerPixel: ${calculatedMmPerPixel.toFixed(4)}`);
    
    const verification = verifyFit(
      testCase.imageWidth,
      testCase.imageHeight,
      testCase.centerX,
      testCase.centerY,
      calculatedMmPerPixel,
      testCase.fitType,
      testCase.fitScope
    );
    
    console.log(`  Verification: ${verification.success ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`    Expected edge: ${verification.expectedEdgePosition.toFixed(2)}mm`);
    console.log(`    Actual edge: ${verification.actualEdgePosition.toFixed(2)}mm`);
    console.log(`    Difference: ${Math.abs(verification.actualEdgePosition - verification.expectedEdgePosition).toFixed(4)}mm`);
    
    if (verification.success) {
      passedTests++;
    }
    
    console.log("");
  });
  
  console.log(`=== RESULTS: ${passedTests}/${totalTests} tests passed ===`);
  
  return passedTests === totalTests;
}

// Run the tests
runTests();