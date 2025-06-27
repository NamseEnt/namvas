import { Button } from "@/components/ui/button";
import { useStudioContext } from "..";

type FitType = "top" | "bottom" | "left" | "right";
type FitScope = "front" | "side";

export function ImageFitButtons() {
  const { state: studioState, updateState: updateStudioState } =
    useStudioContext();

  if (!studioState.uploadedImage) {
    return null;
  }

  const calculateFitMmPerPixel = (fitType: FitType, fitScope: FitScope) => {
    const img = studioState.uploadedImage;
    if (!img) {
      return 1;
    }

    // Image dimensions in pixels
    const imageWidth = img.width;
    const imageHeight = img.height;

    // Image center coordinates in mm
    const centerX = studioState.imageCenterXy.x;
    const centerY = studioState.imageCenterXy.y;

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
        mmPerPixel = (centerX + canvasWidth / 2) / (imageWidth / 2);
        break;

      case "right":
        // Right fit: image right edge touches canvas right edge
        // centerX + (imageWidth/2) * mmPerPixel = canvasWidth/2
        // mmPerPixel = (canvasWidth/2 - centerX) / (imageWidth/2)
        mmPerPixel = (canvasWidth / 2 - centerX) / (imageWidth / 2);
        break;

      case "top":
        // Top fit: image top edge touches canvas top edge
        // centerY + (imageHeight/2) * mmPerPixel = canvasHeight/2
        // mmPerPixel = (canvasHeight/2 - centerY) / (imageHeight/2)
        mmPerPixel = (canvasHeight / 2 - centerY) / (imageHeight / 2);
        break;

      case "bottom":
        // Bottom fit: image bottom edge touches canvas bottom edge
        // centerY - (imageHeight/2) * mmPerPixel = -canvasHeight/2
        // mmPerPixel = (centerY + canvasHeight/2) / (imageHeight/2)
        mmPerPixel = (centerY + canvasHeight / 2) / (imageHeight / 2);
        break;

      default:
        return 1;
    }

    return Math.max(0.001, mmPerPixel); // Prevent negative or zero values
  };

  const handleFitClick = (fitType: FitType, fitScope: FitScope) => {
    const newMmPerPixel = calculateFitMmPerPixel(fitType, fitScope);

    if (newMmPerPixel <= 0) {
      return;
    }

    updateStudioState({ mmPerPixel: newMmPerPixel });
  };

  const fitButtons = [
    {
      type: "top" as FitType,
      scope: "front" as FitScope,
      icon: "⬆️",
      label: "상단-정면",
    },
    {
      type: "top" as FitType,
      scope: "side" as FitScope,
      icon: "⬆️",
      label: "상단-끝",
    },
    {
      type: "bottom" as FitType,
      scope: "front" as FitScope,
      icon: "⬇️",
      label: "하단-정면",
    },
    {
      type: "bottom" as FitType,
      scope: "side" as FitScope,
      icon: "⬇️",
      label: "하단-끝",
    },
    {
      type: "left" as FitType,
      scope: "front" as FitScope,
      icon: "⬅️",
      label: "좌측-정면",
    },
    {
      type: "left" as FitType,
      scope: "side" as FitScope,
      icon: "⬅️",
      label: "좌측-끝",
    },
    {
      type: "right" as FitType,
      scope: "front" as FitScope,
      icon: "➡️",
      label: "우측-정면",
    },
    {
      type: "right" as FitType,
      scope: "side" as FitScope,
      icon: "➡️",
      label: "우측-끝",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {fitButtons.map((button) => (
        <Button
          key={`${button.type}-${button.scope}`}
          variant="outline"
          size="sm"
          onClick={() => handleFitClick(button.type, button.scope)}
          className="text-xs h-10 px-3 flex items-center gap-2 justify-start"
        >
          <span className="text-xs">{button.icon}</span>
          <span className="text-xs">{button.label}</span>
        </Button>
      ))}
    </div>
  );
}