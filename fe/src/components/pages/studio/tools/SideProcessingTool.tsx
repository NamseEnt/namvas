import { Button } from "@/components/ui/button";
import { useStudioContext } from "..";
import { sideProcessingTypes } from "../types";

export function SideProcessingTool() {
  const { state, updateState } = useStudioContext();

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">사이드 처리</h4>
      <div className="grid grid-cols-2 gap-2">
        {sideProcessingTypes.map((type) => (
          <Button
            key={type}
            variant={
              state.sideProcessing.type === type ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              updateState({
                sideProcessing:
                  type === "color"
                    ? { type: "color", color: "#ffffff" }
                    : { type: type },
              })
            }
            className="text-xs h-8"
          >
            {(() => {
              switch (type) {
                case "none":
                  return "없음";
                case "clip":
                  return "자르기";
                case "color":
                  return "단색";
                case "flip":
                  return "뒤집기";
              }
            })()}
          </Button>
        ))}
      </div>
      {state.sideProcessing.type === "color" && (
        <div className="mt-3">
          <label className="text-xs text-gray-500 block mb-1">색상 선택</label>
          <input
            type="color"
            value={state.sideProcessing.color}
            onChange={(e) =>
              updateState({
                sideProcessing: {
                  type: "color",
                  color: e.target.value,
                },
              })
            }
            className="w-full h-8 rounded border border-border cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}