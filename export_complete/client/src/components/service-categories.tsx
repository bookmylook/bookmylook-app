import { useLocation } from "wouter";
import { Scissors, Hand, Palette, Sparkles } from "lucide-react";

const categories = [
  {
    name: "Hair Services",
    description: "Cuts, Color, Styling",
    icon: Scissors,
    category: "hair",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    name: "Nail Services", 
    description: "Manicure, Pedicure, Art",
    icon: Hand,
    category: "nails",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
  },
  {
    name: "Makeup",
    description: "Special Events, Everyday",
    icon: Palette,
    category: "makeup", 
    gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
  {
    name: "Skincare",
    description: "Facials, Treatments",
    icon: Sparkles,
    category: "skincare",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    name: "Massage",
    description: "Relaxation, Therapy",
    icon: Hand,
    category: "massage",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    name: "Spa Services",
    description: "Full Spa Experience",
    icon: Sparkles,
    category: "spa",
    gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
  },
];

export default function ServiceCategories() {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (category: string) => {
    setLocation(`/providers?category=${category}`);
  };

  return (
    <section className="py-8 bg-gradient-to-br from-white/80 to-blue-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Popular Services</h2>
          <p className="text-gray-600">Browse our most requested beauty services</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {categories.map((category) => (
            <div 
              key={category.name}
              className="text-center group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
              onClick={() => handleCategoryClick(category.category)}
              data-testid={`category-${category.category}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryClick(category.category);
                }
              }}
            >
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl border-4 border-white ring-4 ring-opacity-20 animate-pulse`} style={{animationDelay: `${Math.random() * 2}s`}}>
                <category.icon className="w-10 h-10 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }} />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 font-medium">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
