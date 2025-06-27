import { useRef } from "react";
import { useStudioContext } from "..";

export function UploadPromptBox() {
  const { handleImageUpload } = useStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center border-2 rounded-lg"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <div className="text-center p-8 border-4 border-dashed border-gray-400 hover:border-black hover:rotate-1 transition-all duration-200 rounded-lg cursor-pointer bg-white">
        <div className="mb-4">
          <div className="text-6xl mb-4">📷</div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="text-xl font-semibold text-gray-800">
            여기에 사진을 드래그 앤 드롭
          </p>
        </div>
        <p className="text-lg text-gray-600 mb-4">또는 클릭하여 업로드하세요</p>
        <div className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          파일 선택
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
