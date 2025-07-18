export function SpecsSection() {
  const features = [
    {
      icon: "📏",
      title: "아담한 사이즈",
      description: "10 x 15 cm의 손안에 쏙 들어오는 크기로 책상, 선반 어디든 부담없이 장식할 수 있어요.",
    },
    {
      icon: "🌳", 
      title: "자작나무 프레임",
      description: "친환경 자작나무를 사용하여 따뜻하고 자연스러운 느낌을 더했어요.",
    },
    {
      icon: "🎨",
      title: "고품질 캔버스 프린팅",
      description: "전문가용 캔버스에 고해상도로 인쇄하여 원작의 색감과 디테일을 그대로 재현합니다.",
    },
    {
      icon: "✨",
      title: "UV 바니쉬 마감",
      description: "특수 바니쉬 코팅으로 오랫동안 변색 없이 선명한 색상을 유지해요.",
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-12 lg:mb-16">
          캔버스액자 굿즈란?
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 왼쪽: 이미지 */}
            <div className="order-2 lg:order-1">
              <div>
                <img
                  src="/landing2.jpg"
                  alt="캔버스액자 굿즈 상세"
                  className="w-full rounded-2xl shadow-xl"
                />
              </div>
            </div>
            
            {/* 오른쪽: 설명 */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="prose prose-amber max-w-none">
                <p className="text-lg text-amber-800 leading-relaxed">
                  캔버스액자 굿즈는 일반적인 종이 인쇄물과는 차원이 다른 프리미엄 굿즈입니다. 
                  미술관에서 볼 수 있는 캔버스 작품처럼, 텍스처가 살아있는 캔버스 위에 
                  여러분의 작품을 인쇄하고 나무 프레임으로 마감합니다.
                </p>
              </div>
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-2xl">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-950 mb-1">{feature.title}</h3>
                      <p className="text-sm text-amber-700 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 bg-amber-200 px-4 py-2 rounded-full">
                  <span className="text-2xl">💎</span>
                  <span className="text-amber-900 font-medium">
                    프리미엄 굿즈로 차별화된 가치를 제공하세요
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}