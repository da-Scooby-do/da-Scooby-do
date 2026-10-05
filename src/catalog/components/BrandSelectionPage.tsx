import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getCategoryById, getBrandsByCategory, getModelCountByBrand } from '../catalogApi';
import Breadcrumbs from './Breadcrumbs';

export default function BrandSelectionPage() {
  const { lang, dir } = useApp();
  const { route, navigate, categories, brands, models, loading } = useCatalog();

  if (loading || !route.categoryId) return null;
  const category = getCategoryById(categories, route.categoryId);
  if (!category) return null;

  const catBrands = getBrandsByCategory(models, brands, route.categoryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumbs />

      {/* Page header */}
      <div className="mb-10 lg:mb-14">
        <div className="inline-block mb-3">
          <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
            {lang === 'ar' ? category.nameAr : category.nameEn}
          </span>
          <div className="h-0.5 w-12 bg-yellow-accent mt-2" />
        </div>
        <h1 className="section-heading text-base-primary mb-3">
          {lang === 'ar' ? `اختر الماركة — ${category.nameAr}` : `Select Brand — ${category.nameEn}`}
        </h1>
        <p className="text-base-muted text-lg max-w-2xl">
          {lang === 'ar'
            ? `تصفح الماركات المتاحة في فئة ${category.nameAr} واختر الماركة المناسبة.`
            : `Browse available brands in the ${category.nameEn} category and select your preferred brand.`}
        </p>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate({ level: 'categories' })}
        className="flex items-center gap-2 text-sm text-base-muted hover:text-yellow-accent transition-colors mb-6"
      >
        {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {lang === 'ar' ? 'العودة للفئات' : 'Back to Categories'}
      </button>

      {/* Brand grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {catBrands.map((brand, i) => {
          const count = getModelCountByBrand(models, route.categoryId!, brand.id);
          return (
            <button
              key={brand.id}
              onClick={() => navigate({ level: 'models', categoryId: route.categoryId!, brandId: brand.id })}
              className="card-industrial hover-lift group p-6 lg:p-8 text-center animate-scale-in"
              style={{ animationDelay: `${(i % 4) * 0.08}s` }}
            >
              {/* Brand logo placeholder */}
              <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 rounded-2xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center group-hover:bg-yellow-accent transition-all duration-300">
                <span className="text-2xl lg:text-3xl font-black text-yellow-accent group-hover:text-black transition-colors">
                  {brand.nameEn.charAt(0)}
                </span>
              </div>

              <h3 className="text-base lg:text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors mb-1">
                {lang === 'ar' ? brand.nameAr : brand.nameEn}
              </h3>

              <div className="text-xs lg:text-sm text-base-muted">
                {count} {lang === 'ar' ? 'موديل متاح' : 'models available'}
              </div>

              {/* Arrow */}
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 rounded-full border border-base flex items-center justify-center text-base-muted group-hover:border-yellow-accent group-hover:text-yellow-accent transition-all">
                  <ArrowRight
                    size={14}
                    className={`transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
