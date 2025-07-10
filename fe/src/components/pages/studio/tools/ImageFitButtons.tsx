import { Button } from "@/components/ui/button";
import { useStudioContext } from "../StudioPage";

type FitType = "top" | "bottom" | "left" | "right";
type FitScope = "front" | "side";

export function ImageFitButtons() {
  const { state: studioState, updateState: updateStudioState } =
    useStudioContext();

  if (!studioState.uploadedImage) {
    return null;
  }

  const calculateFitDpi = (fitType: FitType, fitScope: FitScope) => {
    const img = studioState.uploadedImage;
    if (!img) {
      return 300;
    }

    // Image dimensions in pixels
    const imageWidth = img.width;
    const imageHeight = img.height;

    // Image center coordinates in inches
    const centerXInch = studioState.imageCenterXyInch.x;
    const centerYInch = studioState.imageCenterXyInch.y;

    // Canvas dimensions in inches
    const frontWidthInch = 4; // 4 inches
    const frontHeightInch = 6; // 6 inches
    const sideThicknessInch = 0.236; // ~6mm in inches

    let canvasWidthInch: number, canvasHeightInch: number;

    if (fitScope === "front") {
      canvasWidthInch = frontWidthInch;
      canvasHeightInch = frontHeightInch;
    } else {
      canvasWidthInch = frontWidthInch + sideThicknessInch * 2;
      canvasHeightInch = frontHeightInch + sideThicknessInch * 2;
    }

    let dpi: number;

    switch (fitType) {
      case "left":
        // Left fit: image left edge touches canvas left edge
        // centerXInch - (imageWidth/2) / dpi = -canvasWidthInch/2
        // dpi = (imageWidth/2) / (centerXInch + canvasWidthInch/2)
        dpi = imageWidth / 2 / (centerXInch + canvasWidthInch / 2);
        break;

      case "right":
        // Right fit: image right edge touches canvas right edge
        // centerXInch + (imageWidth/2) / dpi = canvasWidthInch/2
        // dpi = (imageWidth/2) / (canvasWidthInch/2 - centerXInch)
        dpi = imageWidth / 2 / (canvasWidthInch / 2 - centerXInch);
        break;

      case "top":
        // Top fit: image top edge touches canvas top edge
        // centerYInch + (imageHeight/2) / dpi = canvasHeightInch/2
        // dpi = (imageHeight/2) / (canvasHeightInch/2 - centerYInch)
        dpi = imageHeight / 2 / (canvasHeightInch / 2 - centerYInch);
        break;

      case "bottom":
        // Bottom fit: image bottom edge touches canvas bottom edge
        // centerYInch - (imageHeight/2) / dpi = -canvasHeightInch/2
        // dpi = (imageHeight/2) / (centerYInch + canvasHeightInch/2)
        dpi = imageHeight / 2 / (centerYInch + canvasHeightInch / 2);
        break;

      default:
        return 300;
    }

    return Math.max(50, dpi); // Prevent negative or zero values
  };

  const handleFitClick = (fitType: FitType, fitScope: FitScope) => {
    const newDpi = calculateFitDpi(fitType, fitScope);

    if (newDpi <= 0) {
      return;
    }

    updateStudioState({ dpi: newDpi });
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
