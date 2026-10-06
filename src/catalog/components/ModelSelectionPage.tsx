import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getCategoryById, getBrandById, getModelsByCategoryAndBrand } from '../catalogApi';
import Breadcrumbs from './Breadcrumbs';

const availabilityLabels: Record<string, { ar: string; en: string }> = {
  available: { ar: 'متوفرة', en: 'Available' },
  unavailable: { ar: 'غير متوفرة', en: 'Unavailable' },
  rented: { ar: 'مؤجرة حاليًا', en: 'Rented' },
  maintenance: { ar: 'تحت الصيانة', en: 'Maintenance' },
};

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/80 text-white',
  unavailable: 'bg-red-500/80 text-white',
  rented: 'bg-orange-500/80 text-white',
  maintenance: 'bg-blue-500/80 text-white',
};

export default function ModelSelectionPage() {
  const { lang, dir } = useApp();
  const { route, navigate, categories, brands, models, loading } = useCatalog();

  if (loading || !route.categoryId || !route.brandId) return null;
  const category = getCategoryById(categories, route.categoryId);
  const brand = getBrandById(brands, route.brandId);
  if (!category || !brand) return null;

  const catModels = getModelsByCategoryAndBrand(models, route.categoryId, route.brandId);
  const sorted = [...catModels].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumbs />

      {/* Page header */}
      <div className="mb-10 lg:mb-14">
        <div className="inline-block mb-3">
          <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
            {lang === 'ar' ? brand.nameAr : brand.nameEn}
          </span>
          <div className="h-0.5 w-12 bg-yellow-accent mt-2" />
        </div>
        <h1 className="section-heading text-base-primary mb-3">
          {lang === 'ar'
            ? `موديلات ${brand.nameAr} — ${category.nameAr}`
            : `${brand.nameEn} Models — ${category.nameEn}`}
        </h1>
        <p className="text-base-muted text-lg max-w-2xl">
          {lang === 'ar'
            ? 'اختر الموديل والحجم المناسب لمتطلبات مشروعك.'
            : 'Select the model and size that fits your project requirements.'}
        </p>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate({ level: 'brands', categoryId: route.categoryId! })}
        className="flex items-center gap-2 text-sm text-base-muted hover:text-yellow-accent transition-colors mb-6"
      >
        {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {lang === 'ar' ? `العودة لماركات ${category.nameAr}` : `Back to ${category.nameEn} Brands`}
      </button>

      {/* Model cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {sorted.map((model, i) => {
          const publishedVariants = model.variants.filter((v) => v.published);
          return (
            <div
              key={model.id}
              data-tilt className="card-industrial hover-lift group animate-fade-in-up"
              style={{ animationDelay: `${(i % 3) * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={model.image}
                  alt={lang === 'ar' ? model.nameAr : model.nameEn}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Brand badge */}
                <div className="absolute top-3 ltr:right-3 rtl:left-3 px-3 py-1 rounded-md bg-yellow-accent/90 text-black text-xs font-bold">
                  {lang === 'ar' ? brand.nameAr : brand.nameEn}
                </div>
                {/* Variants count */}
                <div className="absolute bottom-3 ltr:left-3 rtl:right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                  {publishedVariants.length} {lang === 'ar' ? 'حجم متاح' : 'sizes available'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors mb-2">
                  {lang === 'ar' ? model.nameAr : model.nameEn}
                </h3>
                <p className="text-sm text-base-muted line-clamp-2 mb-4">
                  {lang === 'ar' ? model.descriptionAr : model.descriptionEn}
                </p>

                {/* Variant chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {publishedVariants.slice(0, 4).map((variant) => (
                    <span
                      key={variant.id}
                      className="px-2.5 py-1 rounded-md bg-elevated border border-base text-xs font-medium text-base-muted"
                    >
                      {lang === 'ar' ? variant.sizeLabelAr : variant.sizeLabelEn}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate({ level: 'details', categoryId: route.categoryId!, brandId: route.brandId!, modelId: model.id })}
                  className="w-full py-2.5 rounded-lg border border-base text-sm font-semibold text-base-primary hover:border-yellow-accent hover:text-yellow-accent transition-all flex items-center justify-center gap-2 group/btn"
                >
                  {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  <ArrowRight
                    size={16}
                    className={`transition-transform group-hover/btn:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover/btn:-translate-x-0.5' : ''}`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
