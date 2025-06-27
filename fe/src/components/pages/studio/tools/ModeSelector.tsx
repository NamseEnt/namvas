import { Eye, Image, Palette, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolMode, type ToolMode } from "./useToolMode";

const modes = [
  {
    id: "edit" as ToolMode,
    label: "편집",
    icon: Edit,
    description: "이미지 업로드 및 편집",
  },
  {
    id: "view" as ToolMode,
    label: "뷰",
    icon: Eye,
    description: "3D 뷰 각도 조절",
  },
  {
    id: "image" as ToolMode,
    label: "이미지",
    icon: Image,
    description: "이미지 맞춤 설정",
  },
  {
    id: "background" as ToolMode,
    label: "배경",
    icon: Palette,
    description: "캔버스 배경 설정",
  },
] as const;

export function ModeSelector() {
  const { currentMode, setMode } = useToolMode();

  return (
    <div className="flex space-x-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
            title={mode.description}
          >
            <Icon
              size={18}
              className={cn(
                "transition-colors duration-200",
                isActive ? "text-white" : "text-gray-500"
              )}
            />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}