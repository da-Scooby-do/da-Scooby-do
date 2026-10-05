import { Package, Tags, Building2, TrendingUp, Eye, EyeOff, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';

export default function AdminDashboard() {
  const { lang } = useApp();
  const { models, categories, brands, setView } = useAdmin();

  const publishedCount = models.filter((m) => m.published).length;
  const hiddenCount = models.length - publishedCount;
  const visibleCategories = categories.filter((c) => !c.hidden).length;
  const visibleBrands = brands.filter((b) => !b.hidden).length;

  const stats = [
    { labelAr: 'إجمالي المعدات', labelEn: 'Total Models', value: models.length, icon: Package, color: 'text-yellow-accent' },
    { labelAr: 'منشور', labelEn: 'Published', value: publishedCount, icon: Eye, color: 'text-green-500' },
    { labelAr: 'مخفي', labelEn: 'Hidden', value: hiddenCount, icon: EyeOff, color: 'text-orange-500' },
    { labelAr: 'الفئات', labelEn: 'Categories', value: visibleCategories, icon: Tags, color: 'text-blue-500' },
    { labelAr: 'الماركات', labelEn: 'Brands', value: visibleBrands, icon: Building2, color: 'text-purple-500' },
  ];

  const recentModels = [...models].slice(-5).reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">
          {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className="text-base-muted text-sm">
          {lang === 'ar' ? 'نظرة عامة على إدارة معدات سحاب' : 'Overview of SAHAB equipment management'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card-industrial p-5">
              <div className={`w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3`}>
                <Icon size={20} className={stat.color} />
              </div>
              <div className="text-2xl lg:text-3xl font-black text-base-primary">{stat.value}</div>
              <div className="text-xs text-base-muted mt-1">{lang === 'ar' ? stat.labelAr : stat.labelEn}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setView('equipment')}
          className="btn-primary text-sm"
        >
          <Plus size={16} />
          {lang === 'ar' ? 'إضافة معدة جديدة' : 'Add New Model'}
        </button>
        <button onClick={() => setView('equipment')} className="btn-secondary text-sm">
          <Package size={16} />
          {lang === 'ar' ? 'إدارة المعدات' : 'Manage Equipment'}
        </button>
        <button onClick={() => setView('categories')} className="btn-secondary text-sm">
          <Tags size={16} />
          {lang === 'ar' ? 'إدارة الفئات' : 'Manage Categories'}
        </button>
        <button onClick={() => setView('brands')} className="btn-secondary text-sm">
          <Building2 size={16} />
          {lang === 'ar' ? 'إدارة الماركات' : 'Manage Brands'}
        </button>
      </div>

      {/* Recent models */}
      <div>
        <h2 className="text-lg font-bold text-base-primary mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-yellow-accent" />
          {lang === 'ar' ? 'أحدث المعدات' : 'Recent Models'}
        </h2>
        <div className="space-y-2">
          {recentModels.map((model) => {
            const cat = categories.find((c) => c.id === model.category_id);
            const brand = brands.find((b) => b.id === model.brand_id);
            return (
              <div key={model.id} className="card-industrial p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                  {model.image && <img src={model.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base-primary text-sm truncate">
                    {lang === 'ar' ? model.name_ar : model.name_en}
                  </div>
                  <div className="text-xs text-base-muted">
                    {cat && (lang === 'ar' ? cat.name_ar : cat.name_en)}
                    {brand && ` • ${lang === 'ar' ? brand.name_ar : brand.name_en}`}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-semibold ${model.published ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {model.published ? (lang === 'ar' ? 'منشور' : 'Published') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
