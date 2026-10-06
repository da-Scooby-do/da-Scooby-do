import { ArrowRight, ArrowLeft, Grid3x3 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '@/catalog/CatalogContext';
import { getModelCountByCategory } from '@/catalog/catalogApi';
import SafeImage from '@/components/SafeImage';

export default function EquipmentCategorySection() {
  const { t, lang, dir } = useApp();
  const { navigate, categories, models, loading } = useCatalog();

  const visibleCategories = [...categories]
    .filter((c) => !c.hidden)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section id="equipment" className="py-20 lg:py-28 bg-base relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">{t.nav.equipment}</span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="section-heading text-base-primary mb-4">{t.equipment.sectionTitle}</h2>
          <p className="text-base-muted text-lg max-w-2xl mx-auto">{t.equipment.sectionSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {visibleCategories.map((cat, i) => {
            const count = getModelCountByCategory(models, cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => navigate({ level: 'brands', categoryId: cat.id })}
                data-tilt className="card-industrial hover-lift group cursor-pointer animate-scale-in text-start w-full"
                style={{ animationDelay: `${(i % 4) * 0.08}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <SafeImage src={cat.image} alt={lang === 'ar' ? cat.nameAr : cat.nameEn} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 ltr:right-3 rtl:left-3 w-8 h-8 rounded-lg bg-yellow-accent/90 backdrop-blur-sm flex items-center justify-center text-black font-black text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="absolute bottom-3 ltr:right-3 rtl:left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                    {count} {lang === 'ar' ? 'موديل' : 'models'}
                  </div>
                </div>
                <div className="p-4 lg:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors">{lang === 'ar' ? cat.nameAr : cat.nameEn}</h3>
                      <p className="text-xs text-base-muted line-clamp-1 mt-0.5">{lang === 'ar' ? cat.descriptionAr : cat.descriptionEn}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-base flex items-center justify-center text-base-muted group-hover:border-yellow-accent group-hover:text-yellow-accent transition-all flex-shrink-0">
                      <ArrowRight size={14} className={`transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
                    </div>
                  </div>
                </div>
                <div className="h-1 w-0 bg-yellow-accent transition-all duration-500 group-hover:w-full" />
              </button>
            );
          })}
        </div>
        <div className="text-center mt-12 lg:mt-16">
          <button onClick={() => navigate({ level: 'categories' })} className="btn-primary group inline-flex items-center gap-2">
            <Grid3x3 size={18} />
            {lang === 'ar' ? 'استعرض جميع المعدات' : 'Browse All Equipment'}
            <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
}
