import { useState } from 'react';

export function DebugInstructions() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* 디버그 가이드 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-3 py-2 rounded text-sm"
      >
        🔧 디버그 가이드
      </button>

      {/* 디버그 가이드 패널 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-black/95 text-white p-4 rounded max-w-md text-sm">
          <div className="border-b border-gray-600 pb-2 mb-3">
            <div className="font-bold text-purple-400">🔧 성능 문제 진단 가이드</div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="font-semibold text-blue-400 mb-1">1. Chrome DevTools Performance</div>
              <div className="text-xs text-gray-300 leading-relaxed">
                • F12 → Performance 탭<br/>
                • 🔴 Record 버튼 클릭<br/>
                • DPI 슬라이더 움직이기<br/>
                • ⏹️ Stop → 프레임 드롭 구간 확인
              </div>
            </div>

            <div>
              <div className="font-semibold text-green-400 mb-1">2. React DevTools Profiler</div>
              <div className="text-xs text-gray-300 leading-relaxed">
                • React DevTools 설치<br/>
                • ⚛️ Profiler 탭<br/>
                • 🔴 Start profiling<br/>
                • 어느 컴포넌트가 오래 걸리는지 확인
              </div>
            </div>

            <div>
              <div className="font-semibold text-yellow-400 mb-1">3. 확인할 지표들</div>
              <div className="text-xs text-gray-300 leading-relaxed">
                • FPS: 60fps 유지되는가?<br/>
                • Frame Time: 16.67ms 이하인가?<br/>
                • JS Heap: 메모리 누수는 없는가?<br/>
                • Main Thread: 블로킹은 없는가?
              </div>
            </div>

            <div>
              <div className="font-semibold text-red-400 mb-1">4. 의심되는 원인들</div>
              <div className="text-xs text-gray-300 leading-relaxed">
                • CSS 애니메이션/트랜지션<br/>
                • GPU 레이어 합성 문제<br/>
                • 과도한 DOM 조작<br/>
                • 메모리 부족 (GC 과다 발생)
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-2 mt-3 text-[10px] text-gray-500">
            💡 위 도구들로 정확한 병목점을 찾아보세요
          </div>
        </div>
      )}
    </>
  );
}