import { SpecCard } from "../components/SpecCard";

const specs = [
  {
    icon: "📏",
    title: "아담한 사이즈",
    description: "10 x 15 cm\n책상 위 어디든 어울려요",
  },
  {
    icon: "🌳",
    title: "자작나무 캔버스",
    description: "따뜻한 나무 질감\n고급 캔버스 프린팅",
  },
  {
    icon: "✨",
    title: "바니쉬 마감",
    description: "오래도록 선명하게\n보호 코팅 처리",
  },
  {
    icon: "💝",
    title: "수제 제작",
    description: "하나하나 정성껏\n만들어드려요",
  },
];

export function SpecsSection() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-12 lg:mb-16">
          제품 이야기
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {specs.map((spec, index) => (
            <SpecCard key={index} {...spec} />
          ))}
        </div>
      </div>
    </section>
  );
}