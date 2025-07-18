import { useScrollAnimation } from "../hooks/useScrollAnimation";

export function SpecCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  const ref = useScrollAnimation<HTMLDivElement>();
  
  return (
    <div 
      ref={ref}
      className="bg-[#faf8f5] p-8 lg:p-10 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
    >
      <div className="text-5xl mb-4 opacity-80 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-amber-950 mb-3">{title}</h3>
      <p className="text-amber-700 text-sm leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}