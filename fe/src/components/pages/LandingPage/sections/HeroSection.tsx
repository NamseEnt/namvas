import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

export function HeroSection() {
  const { handleAnchorClick } = useSmoothScroll();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "/landing1.jpg",
    "/landing2.jpg", 
    "/landing3.jpg",
  ];

  useEffect(function autoAdvanceCarousel() {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-[#f5ebe0] to-[#ede0d4] relative">
      {/* Background pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgb(139, 69, 19) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgb(160, 82, 45) 0%, transparent 50%)
          `
        }}
      />
      
      <div className="container mx-auto px-4 lg:px-6 py-10 relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in-left text-center lg:text-left">
            <div className="font-serif text-3xl font-bold text-amber-900 mb-6 tracking-wider">
              namvas
            </div>
            <h1 className="text-4xl lg:text-6xl font-serif font-normal text-amber-950 leading-tight mb-4">
              프리미엄 캔버스 굿즈
            </h1>
            <p className="text-lg lg:text-xl text-amber-900 mb-8 leading-relaxed">
              "이 굿즈는 뭔가요?" 라는 소리가 나오는<br />
              특별한 작품을 만들어드려요
            </p>
            <p className="text-base lg:text-lg text-amber-800 mb-10 leading-relaxed text-center">
              당신의 소중한 이미지를 10x15cm 자작나무 캔버스로 제작해드립니다.<br />
              정성스럽게 하나하나 수작업으로 완성되는 프리미엄 굿즈예요.
            </p>
            <div className="mb-8 lg:text-right">
              <p className="text-amber-900 mb-4 font-medium">일반 지류 굿즈와는 다른 색감을 제공합니다</p>
              <div className="flex items-center justify-center lg:justify-end gap-4 mb-6 text-lg text-amber-900">
                <span>₩10,000 (개당)</span>
                <span className="text-amber-600">|</span>
                <span>배송비 ₩3,000</span>
              </div>
              <a
                href="#preview-section"
                onClick={handleAnchorClick}
                className="inline-block"
              >
                <Button 
                  size="lg"
                  className="px-8 py-6 text-lg font-medium bg-amber-900 hover:bg-amber-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  지금 만들어보기
                </Button>
              </a>
            </div>
          </div>
          
          {/* Showcase */}
          <div className="animate-fade-in-right max-w-md mx-auto lg:mx-0">
            <div className="relative">
              <div className="relative aspect-[3/4] bg-[#f5ebe0] rounded-2xl overflow-hidden shadow-2xl">
                <div 
                  className="flex h-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {images.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt="실제 제작품"
                      className="w-full h-full object-cover flex-shrink-0"
                    />
                  ))}
                </div>
                
                {/* 인디케이터 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? "w-6 bg-white" 
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}