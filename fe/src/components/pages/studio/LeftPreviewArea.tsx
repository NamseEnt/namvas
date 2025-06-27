import CanvasViews from "./canvas-views";

export function LeftPreviewArea() {
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-lg font-semibold text-gray-800 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
          3D 미리보기
        </h2>
      </div>
      <CanvasViews />
    </div>
  );
}