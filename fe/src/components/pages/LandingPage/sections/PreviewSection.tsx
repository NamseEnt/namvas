import { useState } from "react";
import { CanvasView } from "@/components/common/CanvasView";
import { SideMode } from "@shared/types";

export function PreviewSection() {
  const [rotation, setRotation] = useState({ x: 10, y: 20 });

  const steps = [
    {
      number: "1",
      title: "이미지 업로드",
      description: "좋아하는 이미지를 선택하여 업로드하세요",
      emoji: "📸",
    },
    {
      number: "2",
      title: "3D 미리보기 확인",
      description: "실제 제품과 동일한 3D로 미리 확인해보세요",
      emoji: "🔄",
    },
    {
      number: "3",
      title: "네이버페이로 간편 결제",
      description: "안전하고 빠른 네이버페이로 결제하세요",
      emoji: "💳",
    },
    {
      number: "4",
      title: "수제작 제작",
      description: "인쇄부터 바니쉬까지 정성껏 수작업으로 제작합니다",
      emoji: "🎨",
    },
    {
      number: "5",
      title: "배송 완료",
      description: "안전하게 포장하여 소중히 배송해드립니다",
      emoji: "📦",
    },
  ];

  return (
    <section id="preview-section" className="py-20 lg:py-32 bg-[#faf8f5]">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-4">
          주문부터 배송까지
        </h2>
        <p className="text-center text-lg text-amber-800 mb-12 lg:mb-16">
          5단계로 완성되는 나만의 캔버스 굿즈
        </p>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 왼쪽: 3D 미리보기 */}
            <div className="order-2 lg:order-1">
              <div
                className="relative aspect-[3/4] bg-[#f5ebe0] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-xl"
                onMouseMove={(e) => {
                  if (e.buttons === 1) {
                    setRotation((prev) => {
                      const newX = prev.x + e.movementY;
                      const clippedX = Math.min(Math.max(-60, newX), 60);

                      const newY = prev.y + e.movementX;
                      const clippedY = Math.min(Math.max(-60, newY), 60);
                      return {
                        x: clippedX,
                        y: clippedY,
                      };
                    });
                  }
                }}
              >
                <CanvasView
                  imageSource="/landing1.jpg"
                  rotation={rotation}
                  sideMode={SideMode.PRESERVE}
                  imageOffset={{ x: 0, y: 0 }}
                />

                {/* 드래그 안내 오버레이 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-900/90 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm animate-pulse">
                  👆 드래그하여 회전해보세요
                </div>
              </div>
            </div>

            {/* 오른쪽: 세로 프로세스 */}
            <div className="order-1 lg:order-2 space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-4 items-start group ${index === 1 ? "relative" : ""}`}
                >
                  {/* 번호와 라인 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                        index === 1
                          ? "bg-amber-900 scale-110 shadow-lg"
                          : "bg-gradient-to-br from-amber-200 to-amber-300 group-hover:shadow-lg"
                      }`}
                    >
                      <span
                        className={`font-bold ${index === 1 ? "text-white" : "text-amber-900"}`}
                      >
                        {step.number}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-16 bg-amber-300 mt-2" />
                    )}
                  </div>

                  {/* 내용 */}
                  <div
                    className={`flex-1 pb-2 ${index === 1 ? "relative" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{step.emoji}</span>
                      <h3
                        className={`font-bold text-lg ${index === 1 ? "text-amber-900" : "text-amber-950"}`}
                      >
                        {step.title}
                      </h3>
                      {index === 1 && (
                        <span className="bg-amber-200 text-amber-900 px-2 py-1 rounded-full text-sm font-medium animate-pulse">
                          👈 바로 이것!
                        </span>
                      )}
                    </div>
                    <p
                      className={`leading-relaxed ${index === 1 ? "text-amber-900 font-medium" : "text-amber-700"}`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* 화살표 (2번 단계일 때) */}
                  {index === 1 && (
                    <div className="hidden lg:block absolute -left-20 top-6 w-16">
                      <svg
                        className="w-full animate-pulse"
                        viewBox="0 0 60 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M60 10L45 2V18L60 10Z" fill="#92400e" />
                        <path
                          d="M0 10H45"
                          stroke="#92400e"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
