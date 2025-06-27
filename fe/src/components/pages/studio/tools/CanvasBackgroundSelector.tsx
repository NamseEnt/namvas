import { Button } from "@/components/ui/button";
import { useStudioContext } from "..";
import { backgroundOptions } from "../constants/backgroundOptions";

export function CanvasBackgroundSelector() {
  const { state, updateState } = useStudioContext();

  return (
    <div className="flex gap-1">
      {backgroundOptions.map((option) => (
        <Button
          key={option.value}
          variant={
            state.canvasBackgroundColor === option.value ? "default" : "outline"
          }
          size="sm"
          onClick={() => updateState({ canvasBackgroundColor: option.value })}
          className="text-xs"
        >
          {option.name}
        </Button>
      ))}
    </div>
  );
}