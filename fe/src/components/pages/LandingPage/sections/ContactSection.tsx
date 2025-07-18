export function ContactSection() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-amber-950 mb-8">
          편하게 연락주세요
        </h2>
        
        <p className="text-lg lg:text-xl text-amber-800 mb-10 leading-relaxed max-w-2xl mx-auto">
          주문 문의, 제작 상담, 또는 그냥 궁금한 점이 있으시다면<br />
          언제든 편하게 연락주세요. 친절하게 안내해드릴게요 😊
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <ContactLink 
            href="https://x.com/namseworkshop" 
            icon="🐦" 
            text="@namseworkshop"
          />
          <ContactLink 
            href="mailto:namseworkshop@gmail.com" 
            icon="✉️" 
            text="namseworkshop@gmail.com"
          />
        </div>
      </div>
    </section>
  );
}

function ContactLink({ 
  href, 
  icon, 
  text 
}: { 
  href: string; 
  icon: string; 
  text: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-2 px-6 py-3 text-amber-900 text-lg border border-amber-400 rounded-full bg-[#faf8f5] transition-all duration-300 hover:bg-amber-900 hover:text-white hover:-translate-y-0.5"
    >
      <span>{icon}</span>
      {text}
    </a>
  );
}