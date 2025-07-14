import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Upload } from "lucide-react";
import { SideMode } from "../types";

interface ControlsAreaProps {
  state: {
    uploadedImage: HTMLImageElement | undefined;
    uploadedFileName?: string;
    sideMode: SideMode;
    imageOffset: { x: number; y: number };
    rotation: { x: number; y: number };
  };
  CAMERA_PRESETS: Array<{
    label: string;
    rotation: { x: number; y: number };
  }>;
  updateState: (updates: any) => void;
  handleImageUpload: (file: File) => void;
  handleSave: () => void;
  cycleCameraPreset: (direction: 'next' | 'prev') => void;
  imagePositionInfo: {
    isHorizontalMovable: boolean;
    canMove: boolean;
  };
  navigate: (options: any) => void;
  isSaving: boolean;
}

export function ControlsArea({
  state,
  CAMERA_PRESETS,
  updateState,
  handleImageUpload,
  handleSave,
  cycleCameraPreset,
  imagePositionInfo,
  navigate,
  isSaving,
}: ControlsAreaProps) {
  return (
    <div className="
      h-32 lg:h-auto
      lg:w-96
      bg-white
      border-t lg:border-t-0 lg:border-l
      border-gray-200
      p-4 lg:p-6
      flex flex-col
      gap-4 lg:gap-6
      overflow-y-auto
    ">
      {/* 데스크톱: 상세 컨트롤 */}
      <div className="hidden lg:flex flex-col gap-6">
        {/* 이미지 변경 */}
        {state.uploadedImage && (
          <div>
            <Label className="text-sm font-medium mb-2 block">이미지 변경</Label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
              <Button variant="outline" className="w-full" type="button">
                <Upload className="w-4 h-4 mr-2" />
                다른 이미지 선택
              </Button>
            </label>
          </div>
        )}

        {/* 카메라 각도 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">카메라</span>
            <div className="h-4 w-px bg-gray-300" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CAMERA_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  state.rotation.x === preset.rotation.x &&
                  state.rotation.y === preset.rotation.y
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => updateState({ rotation: preset.rotation })}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 액자 옆면 처리 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">옆면</span>
            <div className="h-4 w-px bg-gray-300" />
          </div>
          <ToggleGroup
            type="single"
            value={state.sideMode}
            onValueChange={(value) => value && updateState({ sideMode: value as SideMode })}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem value={SideMode.CLIP} size="sm" className="text-xs">
              자르기
            </ToggleGroupItem>
            <ToggleGroupItem value={SideMode.PRESERVE} size="sm" className="text-xs">
              살리기
            </ToggleGroupItem>
            <ToggleGroupItem value={SideMode.FLIP} size="sm" className="text-xs">
              뒤집기
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* 이미지 위치 조정 */}
        {state.uploadedImage && imagePositionInfo.canMove && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-sm font-medium">위치</Label>
              <div className="h-4 w-px bg-gray-300" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-600">
                  {imagePositionInfo.isHorizontalMovable ? "좌우 이동" : "상하 이동"}
                </span>
                <span className="text-xs text-gray-600">
                  {(
                    (imagePositionInfo.isHorizontalMovable ? state.imageOffset.x : state.imageOffset.y) * 100
                  ).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[imagePositionInfo.isHorizontalMovable ? state.imageOffset.x : state.imageOffset.y]}
                onValueChange={([value]) =>
                  updateState({
                    imageOffset: imagePositionInfo.isHorizontalMovable
                      ? { x: value, y: 0 }
                      : { x: 0, y: value },
                  })
                }
                min={-1}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-auto space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate({ to: "/artworks" })}
              variant="outline"
              className="flex-1"
            >
              내 작품
            </Button>
            <Button
              onClick={handleSave}
              disabled={!state.uploadedImage || isSaving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일: 간단한 컨트롤 */}
      <div className="lg:hidden flex items-center justify-between h-full">
        {/* 이미지 변경 */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <Button variant="outline" size="sm" className="w-12 h-12" type="button">
            🖼️
          </Button>
        </label>

        {/* 이미지 위치 슬라이더 */}
        {state.uploadedImage && imagePositionInfo.canMove && (
          <div className="flex-1 mx-4">
            <Slider
              value={[imagePositionInfo.isHorizontalMovable ? state.imageOffset.x : state.imageOffset.y]}
              onValueChange={([value]) =>
                updateState({
                  imageOffset: imagePositionInfo.isHorizontalMovable
                    ? { x: value, y: 0 }
                    : { x: 0, y: value },
                })
              }
              min={-1}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* 오른쪽 컨트롤 */}
        <div className="flex items-center gap-2">
          {/* 옆면 모드 */}
          <ToggleGroup
            type="single"
            value={state.sideMode}
            onValueChange={(value) => value && updateState({ sideMode: value as SideMode })}
            className="flex"
          >
            <ToggleGroupItem value={SideMode.CLIP} size="sm" className="text-xs px-2">
              자르기
            </ToggleGroupItem>
            <ToggleGroupItem value={SideMode.PRESERVE} size="sm" className="text-xs px-2">
              살리기
            </ToggleGroupItem>
            <ToggleGroupItem value={SideMode.FLIP} size="sm" className="text-xs px-2">
              뒤집기
            </ToggleGroupItem>
          </ToggleGroup>

          {/* 카메라 컨트롤 */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cycleCameraPreset('prev')}
              className="w-8 h-8 p-0"
            >
              ◀
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cycleCameraPreset('next')}
              className="w-8 h-8 p-0"
            >
              ▶
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}