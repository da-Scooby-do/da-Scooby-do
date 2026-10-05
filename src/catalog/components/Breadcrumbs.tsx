import { ChevronLeft, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getCategoryById, getBrandById, getModelById } from '../catalogApi';

export default function Breadcrumbs() {
  const { t, lang, dir } = useApp();
  const { route, navigate, categories, brands, models } = useCatalog();

  const category = route.categoryId ? getCategoryById(categories, route.categoryId) : null;
  const brand = route.brandId ? getBrandById(brands, route.brandId) : null;
  const model = route.modelId ? getModelById(models, route.modelId) : null;

  const ArrowIcon = ChevronLeft;

  const crumbs: { label: string; onClick: () => void }[] = [
    { label: t.nav.home, onClick: () => { window.location.hash = '#home'; } },
    { label: lang === 'ar' ? 'المعدات' : 'Equipment', onClick: () => navigate({ level: 'categories' }) },
  ];

  if (category) {
    crumbs.push({
      label: lang === 'ar' ? category.nameAr : category.nameEn,
      onClick: () => navigate({ level: 'brands', categoryId: category.id }),
    });
  }
  if (brand && category) {
    crumbs.push({
      label: lang === 'ar' ? brand.nameAr : brand.nameEn,
      onClick: () => navigate({ level: 'models', categoryId: category.id, brandId: brand.id }),
    });
  }
  if (model && brand && category) {
    crumbs.push({
      label: lang === 'ar' ? model.nameAr : model.nameEn,
      onClick: () => navigate({ level: 'details', categoryId: category.id, brandId: brand.id, modelId: model.id }),
    });
  }

  return (
    <nav className="flex items-center gap-1.5 flex-wrap text-sm pt-24 pb-4">
      <button
        onClick={crumbs[0].onClick}
        className="flex items-center gap-1 text-base-muted hover:text-yellow-accent transition-colors"
      >
        <Home size={14} />
      </button>
      {crumbs.slice(1).map((crumb, i) => {
        const isLast = i === crumbs.length - 2;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <ArrowIcon size={14} className={`text-base-muted opacity-50 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            <button
              onClick={crumb.onClick}
              className={`transition-colors ${isLast ? 'text-yellow-accent font-semibold' : 'text-base-muted hover:text-yellow-accent'}`}
            >
              {crumb.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
