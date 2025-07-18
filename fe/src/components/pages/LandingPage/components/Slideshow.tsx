import { useState, useEffect } from "react";

const slides = [
  {
    id: 1,
    title: "실제 캔버스 제품 사진 1",
    subtitle: "손에 들고 있는 모습",
  },
  {
    id: 2,
    title: "실제 캔버스 제품 사진 2",
    subtitle: "책상 위에 놓인 모습",
  },
  {
    id: 3,
    title: "실제 캔버스 제품 사진 3",
    subtitle: "부스에 진열된 모습",
  },
];

export function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(function autoAdvanceSlides() {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl cursor-grab transition-transform duration-300 hover:scale-[1.02]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 flex items-center justify-center bg-[#f5ebe0] transition-opacity duration-800 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-center p-8">
              <div className="text-lg text-amber-900">{slide.title}</div>
              <div className="text-sm text-amber-700 mt-2">{slide.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? "w-6 h-2 bg-amber-900 rounded-full"
                : "w-2 h-2 bg-amber-400 rounded-full hover:bg-amber-600"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}