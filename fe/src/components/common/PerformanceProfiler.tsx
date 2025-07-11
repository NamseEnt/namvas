import { useEffect, useState, useRef } from 'react';

type PerformanceMetrics = {
  renderTime: number;
  jsHeapUsed: number;
  eventHandlerTime: number;
  frameTime: number;
};

export function PerformanceProfiler() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastFrameTime = useRef(performance.now());

  useEffect(() => {
    const measurePerformance = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime.current;
      lastFrameTime.current = now;

      // 메모리 사용량 (Chrome only)
      const memoryInfo = (performance as any).memory;
      const jsHeapUsed = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

      // 단순화된 성능 측정
      const renderTime = 0; // 비활성화
      const eventHandlerTime = 0; // 비활성화

      setMetrics({
        renderTime: Math.round(renderTime * 100) / 100,
        jsHeapUsed,
        eventHandlerTime: Math.round(eventHandlerTime * 100) / 100,
        frameTime: Math.round(frameTime * 100) / 100,
      });

      requestAnimationFrame(measurePerformance);
    };

    measurePerformance();
  }, []);

  const getFrameTimeColor = (time: number) => {
    if (time <= 16.67) return 'text-green-400'; // 60fps
    if (time <= 33.33) return 'text-yellow-400'; // 30fps
    return 'text-red-400';
  };

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-2 py-1 rounded text-xs"
      >
        📊 성능
      </button>

      {/* 성능 패널 */}
      {isVisible && metrics && (
        <div className="fixed top-16 right-4 z-50 bg-black/90 text-white p-3 rounded text-xs font-mono max-w-xs">
          <div className="border-b border-gray-600 pb-2 mb-2">
            <div className="font-bold text-blue-400">🔍 성능 모니터</div>
          </div>
          
          <div className="space-y-1">
            <div className={`${getFrameTimeColor(metrics.frameTime)}`}>
              <span className="text-gray-400">프레임 시간:</span> {metrics.frameTime.toFixed(2)}ms
              {metrics.frameTime > 16.67 && ' ⚠️'}
            </div>
            
            {metrics.renderTime > 0 && (
              <div className="text-gray-300">
                <span className="text-gray-400">렌더 시간:</span> {metrics.renderTime.toFixed(2)}ms
              </div>
            )}
            
            {metrics.eventHandlerTime > 0 && (
              <div className="text-gray-300">
                <span className="text-gray-400">이벤트 시간:</span> {metrics.eventHandlerTime.toFixed(2)}ms
              </div>
            )}
            
            <div className="text-gray-300">
              <span className="text-gray-400">JS 힙:</span> {metrics.jsHeapUsed}MB
            </div>
          </div>

          <div className="border-t border-gray-600 pt-2 mt-2 text-[10px] text-gray-500">
            💡 DPI 슬라이더를 움직여보세요
          </div>
        </div>
      )}
    </>
  );
}