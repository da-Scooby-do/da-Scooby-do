import { ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '@/catalog/CatalogContext';

interface CategoryCardProps {
  name: string;
  image: string;
  index: number;
}

export default function CategoryCard({ name, image, index }: CategoryCardProps) {
  const { dir } = useApp();
  const { navigate, categories } = useCatalog();
  const category = categories[index];

  return (
    <button
      onClick={() => category && navigate({ level: 'brands', categoryId: category.id })}
      className="card-industrial hover-lift group cursor-pointer animate-scale-in text-start w-full"
      style={{ animationDelay: `${(index % 5) * 0.08}s` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Number badge */}
        <div className="absolute top-3 ltr:right-3 rtl:left-3 w-8 h-8 rounded-lg bg-yellow-accent/90 backdrop-blur-sm flex items-center justify-center text-black font-black text-sm">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors">
            {name}
          </h3>
          <div className="w-8 h-8 rounded-full border border-base flex items-center justify-center text-base-muted group-hover:border-yellow-accent group-hover:text-yellow-accent transition-all">
            <ArrowRight
              size={14}
              className={`transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-1 w-0 bg-yellow-accent transition-all duration-500 group-hover:w-full" />
    </button>
  );
}
