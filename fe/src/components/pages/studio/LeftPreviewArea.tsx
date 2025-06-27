import { useStudioContext } from "./index";
import CanvasViews from "./canvas-views";
import { CanvasBackgroundSelector } from "./CanvasBackgroundSelector";

export function LeftPreviewArea() {
  const { state } = useStudioContext();

  const backgroundOptions = [
    {
      name: "어두운 회색",
      value: "dark-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
          #1e293b
        `,
        backgroundSize: "60px 60px",
      },
    },
    {
      name: "베이지",
      value: "bg-amber-50",
      style: {},
    },
    {
      name: "나무결",
      value: "wood-texture",
      style: {
        background: `
          linear-gradient(90deg, #d4a574 0%, #c89e66 15%, #d4a574 30%, #be9560 45%, #d4a574 60%, #c89e66 75%, #d4a574 100%),
          repeating-linear-gradient(180deg, rgba(190, 149, 96, 0.1) 0px, rgba(190, 149, 96, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(0deg, rgba(200, 158, 102, 0.05) 0px, rgba(200, 158, 102, 0.05) 2px, transparent 2px, transparent 15px)
        `,
        backgroundColor: "#d4a574",
      },
    },
    {
      name: "종이",
      value: "paper-texture",
      style: {
        background: `
          radial-gradient(circle at 25% 25%, #f5f5dc 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #f0f0e6 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, #faf0e6 0%, transparent 50%),
          #fefefe
        `,
        backgroundSize: "20px 20px, 25px 25px, 15px 15px, 100%",
      },
    },
    {
      name: "콘크리트",
      value: "concrete-texture",
      style: {
        background: `
          radial-gradient(circle at 20% 20%, rgba(200, 200, 200, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 80% 80%, rgba(180, 180, 180, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 60% 40%, rgba(220, 220, 220, 0.2) 0%, transparent 30%),
          linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
          #f0f0f0
        `,
        backgroundSize: "50px 50px, 30px 30px, 40px 40px, 10px 10px, 100%",
      },
    },
    {
      name: "패브릭",
      value: "fabric-texture",
      style: {
        background: `
          repeating-linear-gradient(45deg, #f8f8f8 0px, #f8f8f8 2px, #e0e0e0 2px, #e0e0e0 4px),
          repeating-linear-gradient(-45deg, transparent 0px, transparent 2px, rgba(200, 200, 200, 0.1) 2px, rgba(200, 200, 200, 0.1) 4px),
          #f5f5f5
        `,
      },
    },
    {
      name: "도트",
      value: "dot-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, #e0e0e0 1.5px, transparent 1.5px),
          #f8f8f8
        `,
        backgroundSize: "25px 25px",
      },
    },
  ];

  const currentOption = backgroundOptions.find(
    (opt) => opt.value === state.canvasBackgroundColor
  );
  const canvasStyle =
    currentOption && !state.canvasBackgroundColor.startsWith("bg-")
      ? currentOption.style
      : {};

  return (
    <div className="flex-1 p-6 bg-background relative overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">미리보기</h2>
        <CanvasBackgroundSelector />
      </div>

      <div
        className={`w-full flex-1 border border-border rounded-lg ${state.canvasBackgroundColor.startsWith("bg-") ? state.canvasBackgroundColor : ""}`}
        style={canvasStyle}
      >
        <CanvasViews />
      </div>

      {state.qualityWarning && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
          <p className="text-sm text-yellow-800">
            ⚠️ 현재 해상도가 권장 해상도보다 낮습니다. 인쇄 품질이 저하될 수
            있어요.
          </p>
        </div>
      )}
    </div>
  );
}