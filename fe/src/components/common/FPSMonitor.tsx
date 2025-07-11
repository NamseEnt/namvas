import { useEffect, useState, useRef } from 'react';

export function FPSMonitor() {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    let animationFrame: number;

    const updateFPS = () => {
      const now = performance.now();
      frameCount.current++;

      // 매 초마다 FPS 계산
      if (now - lastTime.current >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        setFps(currentFps);
        
        // 평균 FPS 계산 (최근 10초)
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }
        const avg = Math.round(
          fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
        );
        setAvgFps(avg);

        frameCount.current = 0;
        lastTime.current = now;
      }

      animationFrame = requestAnimationFrame(updateFPS);
    };

    updateFPS();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  const getColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
      <div className={`${getColor(fps)} font-bold`}>
        FPS: {fps}
      </div>
      <div className="text-gray-300">
        평균: {avgFps}
      </div>
      {fps < 30 && (
        <div className="text-red-400 text-[10px]">
          ⚠️ 프레임 드롭
        </div>
      )}
    </div>
  );
}