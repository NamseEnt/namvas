import { useScrollAnimation } from "../hooks/useScrollAnimation";

export function InfoCard({ 
  emoji, 
  title, 
  description, 
  items 
}: { 
  emoji: string; 
  title: string; 
  description: string; 
  items: string[];
}) {
  const ref = useScrollAnimation<HTMLDivElement>();
  
  return (
    <div 
      ref={ref}
      className="bg-white p-8 lg:p-10 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        {title}
      </h3>
      <p className="text-amber-800 mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="relative pl-6 text-amber-700 leading-relaxed">
            <span className="absolute left-0 top-0 text-amber-400 text-xl">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}