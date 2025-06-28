import { useToolMode } from "./useToolMode";
import { CanvasBackgroundSelector } from "./CanvasBackgroundSelector";
import { ImageUploadTool } from "./ImageUploadTool";
import { ImageSizeTool } from "./ImageSizeTool";
import { ImagePositionTool } from "./ImagePositionTool";
import { SideProcessingTool } from "./SideProcessingTool";
import { CameraRotationTool } from "./CameraRotationTool";

type ToolsAreaProps = {
  viewTools: React.ReactNode;
  imageTools: React.ReactNode;
  backgroundTools?: React.ReactNode;
};

export function ToolsArea({ viewTools, imageTools, backgroundTools }: ToolsAreaProps) {
  const { currentMode } = useToolMode();

  const renderCurrentTools = () => {
    switch (currentMode) {
      case "edit":
        return (
          <div className="space-y-6">
            <ImageUploadTool />
            <ImageSizeTool />
            <ImagePositionTool />
            <SideProcessingTool />
          </div>
        );

      case "view":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                3D 뷰 각도 조절
              </h3>
              {viewTools}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                카메라 회전 조절
              </h3>
              <CameraRotationTool />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                이미지 맞춤 설정
              </h3>
              {imageTools}
            </div>
          </div>
        );

      case "background":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                캔버스 배경 설정
              </h3>
              {backgroundTools || <CanvasBackgroundSelector />}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">도구모음</h2>
      </div>
      {renderCurrentTools()}
    </div>
  );
}