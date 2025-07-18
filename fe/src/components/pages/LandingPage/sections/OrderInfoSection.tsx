import { InfoCard } from "../components/InfoCard";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const infoCards = [
  {
    emoji: "📁",
    title: "이미지 준비하기",
    description: "아래 사항을 확인해주세요:",
    items: [
      "권장 해상도: 1200x1800 픽셀 이상 (300 dpi)",
      "파일 형식: PSD, JPG, PNG",
      "색상 공간: CMYK 권장. RGB의 경우 인쇄 색감이 다를 수 있습니다",
    ],
  },
  {
    emoji: "🎨",
    title: "제작 과정",
    description: "이렇게 진행돼요:",
    items: [
      "이미지를 업로드하면 3D로 미리볼 수 있습니다",
      "옆면을 자르기/살리기/뒤집기 로 원하는대로 설정할 수 있습니다",
      "직접 수제로 제작하기 때문에 주문량에 따라 시간이 조금 더 걸릴 수 있습니다",
      "목표하시는 행사의 한 달 전쯤 주문하시는 걸 추천드립니다!",
    ],
  },
];

export function OrderInfoSection() {
  return (
    <section id="order-info" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-8">
          주문하시는 방법
        </h2>
        
        <p className="text-center text-lg lg:text-xl text-amber-800 mb-12 lg:mb-16 leading-relaxed max-w-3xl mx-auto">
          이미지를 보내주시면, 정성껏 캔버스 작품으로 만들어 배송해드릴게요 🎨<br />
          코믹월드, 일러스타페스 등 행사를 준비하시는 창작자님들을 위한 특별한 굿즈입니다
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto mb-12">
          {infoCards.map((card, index) => (
            <InfoCard key={index} {...card} />
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            size="lg"
            className="px-8 py-6 text-lg font-medium bg-amber-900 hover:bg-amber-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            asChild
          >
            <Link to="/login">
              지금 시작하기
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}