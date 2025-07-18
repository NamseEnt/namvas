import { InfoCard } from "../components/InfoCard";

const infoCards = [
  {
    emoji: "📁",
    title: "이미지 준비하기",
    description: "아래 사항을 확인해주세요:",
    items: [
      "권장 해상도: 1200x1800 픽셀 이상",
      "파일 형식: TIFF, JPG, PNG 모두 가능해요",
      "색상 작업: CMYK로 작업하시면 더 정확해요",
      "RGB 파일도 괜찮지만 약간의 색 차이가 있을 수 있어요",
    ],
  },
  {
    emoji: "🎨",
    title: "제작 과정",
    description: "이렇게 진행돼요:",
    items: [
      "이미지를 보내주시면 3D로 미리보기를 만들어드려요",
      "확인하신 후 제작을 시작합니다",
      "직접 수제로 제작하기 때문에 주문량에 따라 시간이 조금 더 걸릴 수 있어요",
      "행사가 있으시다면 한 달 전쯤 주문하시는 걸 추천드려요!",
    ],
  },
  {
    emoji: "💌",
    title: "함께 만들어가요",
    description: "namvas는 창작자님들과 함께 성장하고 싶어요:",
    items: [
      "3D 미리보기로 실물과 거의 같게 확인 가능해요",
      "대량 주문도 환영합니다 (제작 기간은 상의해요)",
      "궁금한 점은 언제든 편하게 물어봐주세요",
      "여러분의 부스에서 빛날 특별한 굿즈가 되길 바라요",
    ],
  },
];

export function OrderInfoSection() {
  return (
    <section id="order-info" className="py-20 lg:py-32 bg-[#faf8f5]">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-8">
          주문하시는 방법
        </h2>
        
        <p className="text-center text-lg lg:text-xl text-amber-800 mb-12 lg:mb-16 leading-relaxed max-w-3xl mx-auto">
          이미지를 보내주시면, 정성껏 캔버스 작품으로 만들어 배송해드릴게요 🎨<br />
          코믹월드, 일러스타페스 등 행사를 준비하시는 창작자님들을 위한 특별한 굿즈입니다
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {infoCards.map((card, index) => (
            <InfoCard key={index} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}