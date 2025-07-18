export function PreviewSection() {
  return (
    <section id="preview-section" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-center text-amber-950 mb-12 lg:mb-16">
          상상이 현실이 되는 순간
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 max-w-5xl mx-auto">
          <PreviewBox
            label="3D 미리보기"
            description="주문 전, 3D로 미리 확인해보세요"
          />
          <PreviewBox
            label="실제 제작품"
            description="손에 쥐었을 때의 감동"
          />
        </div>
      </div>
    </section>
  );
}

function PreviewBox({ label, description }: { label: string; description: string }) {
  return (
    <div className="text-center">
      <div className="aspect-square bg-[#f5ebe0] border-2 border-dashed border-amber-400 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 hover:border-amber-900 hover:bg-[#faf6f0] group">
        <span className="text-lg text-amber-900 font-medium group-hover:scale-105 transition-transform">
          {label}
        </span>
      </div>
      <p className="text-amber-800">{description}</p>
    </div>
  );
}