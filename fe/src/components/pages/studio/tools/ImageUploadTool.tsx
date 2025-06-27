import { useRef } from "react";
import { useStudioContext } from "..";
import { Button } from "@/components/ui/button";

export function ImageUploadTool() {
  const { state, handleImageUpload } = useStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">이미지 업로드</h4>
      
      {!state.imageDataUrl ? (
        <div className="space-y-2">
          <Button
            onClick={handleEditClick}
            variant="outline"
            className="w-full"
          >
            이미지 선택
          </Button>
          <p className="text-xs text-gray-500 text-center">
            JPG, PNG 등의 이미지 파일을 선택해주세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={state.imageDataUrl}
              alt="업로드된 이미지"
              className="w-full h-32 object-contain"
            />
          </div>
          <Button
            onClick={handleEditClick}
            variant="outline"
            size="sm"
            className="w-full"
          >
            다른 이미지 선택
          </Button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}