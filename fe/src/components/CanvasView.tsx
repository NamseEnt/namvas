export default function CanvasView({ angle, textureUrl, className }: {
  angle: 'front' | 'rightBottomUp' | 'leftTopDown';
  textureUrl?: string;
  className?: string;
}) {
  const getViewInfo = () => {
    switch (angle) {
      case 'front':
        return { name: '정면', color: 'bg-blue-200', rotation: 'x: 0°, y: 0°' };
      case 'rightBottomUp':
        return { name: '우측 하단', color: 'bg-green-200', rotation: 'x: -20°, y: 45°' };
      case 'leftTopDown':
        return { name: '좌측 상단', color: 'bg-purple-200', rotation: 'x: 20°, y: -45°' };
    }
  };

  const viewInfo = getViewInfo();

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className={`w-full aspect-[3/4] ${viewInfo.color} flex flex-col items-center justify-center`}>
        <div className="text-center">
          <div className="font-semibold text-gray-700">{viewInfo.name}</div>
          <div className="text-xs text-gray-500 mt-1">{viewInfo.rotation}</div>
          {textureUrl && (
            <div className="text-xs text-blue-600 mt-1 truncate max-w-24">
              텍스처 로드됨
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-gray-400">
        {angle}
      </div>
    </div>
  );
}