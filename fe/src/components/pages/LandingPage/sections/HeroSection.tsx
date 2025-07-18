import { Button } from "@/components/ui/button";
import { Slideshow } from "../components/Slideshow";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

export function HeroSection() {
  const { handleAnchorClick } = useSmoothScroll();
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
            <p className="text-base lg:text-lg text-amber-800 mb-10 leading-relaxed">
              당신의 소중한 이미지를 10x15cm 자작나무 캔버스로 제작해드립니다.<br />
              정성스럽게 하나하나 수작업으로 완성되는 프리미엄 굿즈예요.
            </p>
          </div>
          
          {/* Showcase */}
          <div className="animate-fade-in-right">
            <Slideshow />
            <div className="text-center mt-8">
              <div className="flex items-center justify-center gap-4 mb-6 text-lg text-amber-900">
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
                  3D 미리보기로 직접 만들어보세요
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}