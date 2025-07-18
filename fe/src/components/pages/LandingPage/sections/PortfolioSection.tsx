const portfolioItems = [
  {
    id: 1,
    title: "캔버스 작품 예시 #1",
    description: "자작나무의 따뜻한 질감과 캔버스의 조화",
  },
  {
    id: 2,
    title: "캔버스 작품 예시 #2",
    description: "바니쉬 마감으로 오래도록 선명하게",
  },
];

export function PortfolioSection() {
  return (
    <section className="py-20 lg:py-32 bg-[#faf8f5]">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-12 lg:mb-16">
          이렇게 만들어져요
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {portfolioItems.map((item) => (
            <PortfolioItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { useScrollAnimation } from "../hooks/useScrollAnimation";

function PortfolioItem({ title, description }: { title: string; description: string }) {
  const ref = useScrollAnimation<HTMLDivElement>();
  
  return (
    <div 
      ref={ref}
      className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] bg-[#f5ebe0] flex items-center justify-center text-amber-900 text-lg">
        포트폴리오 작품
      </div>
      <div className="p-8">
        <h3 className="text-xl font-bold text-amber-950 mb-2">{title}</h3>
        <p className="text-amber-700">{description}</p>
      </div>
    </div>
  );
}