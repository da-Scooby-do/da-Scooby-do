import { ArrowRight, HardHat, Truck, Construction, Tractor, Package, Wrench, Layers, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getModelCountByCategory } from '../catalogApi';

const iconMap: Record<string, typeof Truck> = {
  HardHat, Truck, Construction, Tractor, Package, Wrench, Layers, Building2,
};

export default function CategorySelectionPage() {
  const { t, lang, dir } = useApp();
  const { navigate, categories, models, loading } = useCatalog();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-24">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
      <Breadcrumbs />

      {/* Page header */}
      <div className="mb-10 lg:mb-14">
        <div className="inline-block mb-3">
          <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
            {lang === 'ar' ? 'كتالوج المعدات' : 'Equipment Catalog'}
          </span>
          <div className="h-0.5 w-12 bg-yellow-accent mt-2" />
        </div>
        <h1 className="section-heading text-base-primary mb-3">
          {lang === 'ar' ? 'اختر نوع المعدة' : 'Select Equipment Category'}
        </h1>
        <p className="text-base-muted text-lg max-w-2xl">
          {lang === 'ar'
            ? 'تصفح أنواع المعدات المتاحة للإيجار واختر ما يناسب احتياجات مشروعك.'
            : 'Browse available equipment categories for rent and choose what fits your project needs.'}
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
        {sorted.map((cat, i) => {
          const Icon = iconMap[cat.icon] || Truck;
          const count = getModelCountByCategory(models, cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => navigate({ level: 'brands', categoryId: cat.id })}
              data-tilt className="card-industrial hover-lift group text-start animate-scale-in"
              style={{ animationDelay: `${(i % 4) * 0.08}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={cat.image}
                  alt={lang === 'ar' ? cat.nameAr : cat.nameEn}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Icon badge */}
                <div className="absolute top-3 ltr:right-3 rtl:left-3 w-10 h-10 rounded-lg bg-yellow-accent/90 backdrop-blur-sm flex items-center justify-center">
                  <Icon size={20} className="text-black" />
                </div>
                {/* Count badge */}
                <div className="absolute bottom-3 ltr:right-3 rtl:left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                  {count} {lang === 'ar' ? 'موديل' : 'models'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 lg:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors mb-1">
                      {lang === 'ar' ? cat.nameAr : cat.nameEn}
                    </h3>
                    <p className="text-sm text-base-muted line-clamp-2">
                      {lang === 'ar' ? cat.descriptionAr : cat.descriptionEn}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full border border-base flex items-center justify-center text-base-muted group-hover:border-yellow-accent group-hover:text-yellow-accent transition-all flex-shrink-0">
                    <ArrowRight
                      size={16}
                      className={`transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom accent */}
              <div className="h-1 w-0 bg-yellow-accent transition-all duration-500 group-hover:w-full" />
            </button>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 p-4 lg:p-5 rounded-xl border border-base bg-elevated text-sm text-base-muted text-center">
        {lang === 'ar'
          ? 'البيانات المعروضة لأغراض العرض التوضيحي وقد لا تعكس بالضرورة المعدات المتاحة حالياً للإيجار. تواصل معنا للتأكد من التوافر.'
          : 'Displayed data is for demonstration purposes and may not necessarily reflect currently available equipment. Contact us to confirm availability.'}
      </div>
    </div>
  );
}

import Breadcrumbs from './Breadcrumbs';
