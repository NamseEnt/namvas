import { Upload } from "lucide-react";

interface UploadAreaProps {
  onImageUpload: (file: File) => void;
  dragAndDrop: {
    handleDrop: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
  };
  className?: string;
}

export function UploadArea({ onImageUpload, dragAndDrop, className = "" }: UploadAreaProps) {
  return (
    <div
      className={`
        bg-gray-50 
        flex items-center justify-center 
        p-4
        ${className}
      `}
      onDrop={dragAndDrop.handleDrop}
      onDragOver={dragAndDrop.handleDragOver}
    >
      <label className="cursor-pointer w-full max-w-md lg:max-w-lg">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])}
          className="hidden"
        />
        <div className="
          text-center 
          p-8 lg:p-12
          border-2 border-dashed border-gray-300 
          rounded-lg 
          hover:border-gray-400 
          transition-colors
          bg-white
        ">
          <Upload className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-sm lg:text-base">
            여기에 사진을 드래그 앤 드롭 하거나
            <br />
            클릭하여 업로드하세요
          </p>
        </div>
      </label>
    </div>
  );
}