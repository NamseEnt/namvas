import { Button } from "@/components/ui/button";
import { useCanvasViewsContext } from "../canvas-views";

export function ViewAngleButtons() {
  const { updateState } = useCanvasViewsContext();

  const viewAngles = [
    { name: "정면", rotation: { x: 0, y: 0 }, icon: "📷" },
    { name: "우측면", rotation: { x: 0, y: 40 }, icon: "👉" },
    { name: "좌측면", rotation: { x: 0, y: -40 }, icon: "👈" },
    { name: "상단뷰", rotation: { x: 25, y: 0 }, icon: "👆" },
    { name: "우상단", rotation: { x: 20, y: 45 }, icon: "↗️" },
    { name: "좌상단", rotation: { x: 20, y: -45 }, icon: "↖️" },
    { name: "입체감", rotation: { x: -20, y: -45 }, icon: "🎯" },
  ];

  const handleAngleChange = (targetRotation: { x: number; y: number }) => {
    updateState({ rotation: targetRotation });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
      {viewAngles.map((angle) => (
        <Button
          key={angle.name}
          variant="outline"
          size="sm"
          onClick={() => handleAngleChange(angle.rotation)}
          className="text-xs h-10 px-3 flex items-center gap-2 justify-start"
        >
          <span className="text-xs">{angle.icon}</span>
          <span className="hidden sm:inline">{angle.name}</span>
        </Button>
      ))}
    </div>
  );
}