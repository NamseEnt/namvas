import { Upload } from "lucide-react";

export function UploadArea({ onFile }: { onFile: (file: File) => void }) {
  const onDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      onFile(files[0]);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`
        bg-gray-50 
        flex items-center justify-center 
        p-4
        h-[calc(100vh-56px)]
      `}
      onDrop={onDragDrop}
      onDragOver={onDragOver}
    >
      <label className="cursor-pointer w-full max-w-md lg:max-w-lg">
        <input
          type="file"
          accept="image/*,.psd"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="hidden"
        />
        <div
          className="
          text-center 
          p-8 lg:p-12
          border-2 border-dashed border-gray-300 
          rounded-lg 
          hover:border-gray-400 
          transition-colors
          bg-white
        "
        >
          <Upload className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-sm lg:text-base">
            여기에 사진을 드래그 앤 드롭 하거나
            <br />
            클릭하여 업로드하세요
          </p>
          <p className="text-gray-500 text-xs lg:text-sm mt-2">
            JPG, PNG, PSD 파일을 지원합니다
          </p>
        </div>
      </label>
    </div>
  );
}
