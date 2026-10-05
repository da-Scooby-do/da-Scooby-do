import { Building2, PencilRuler, ClipboardList, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getServiceCategoryById } from '../types';
import type { ServiceCategoryId } from '../types';

const iconMap: Record<string, typeof Building2> = {
  Building2,
  PencilRuler,
  ClipboardList,
};

interface Props {
  categoryId: ServiceCategoryId;
}

export default function ServiceCategoryPage({ categoryId }: Props) {
  const { lang, dir } = useApp();
  const category = getServiceCategoryById(categoryId);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-24">
        <p className="text-base-muted text-center">{lang === 'ar' ? 'الخدمة غير موجودة' : 'Service not found'}</p>
      </div>
    );
  }

  const Icon = iconMap[category.icon] || Building2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-24">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-wrap text-sm pb-6">
        <button
          onClick={() => { window.location.hash = '#home'; }}
          className="text-base-muted hover:text-yellow-accent transition-colors"
        >
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </button>
        <span className="text-base-muted opacity-50">/</span>
        <button
          onClick={() => { window.location.hash = '#home'; }}
          className="text-base-muted hover:text-yellow-accent transition-colors"
        >
          {lang === 'ar' ? 'الخدمات' : 'Services'}
        </button>
        <span className="text-base-muted opacity-50">/</span>
        <span className="text-yellow-accent font-semibold">
          {lang === 'ar' ? category.nameAr : category.nameEn}
        </span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => { window.location.hash = '#home'; }}
        className="flex items-center gap-2 text-sm text-base-muted hover:text-yellow-accent transition-colors mb-6"
      >
        {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
      </button>

      {/* Page header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
            <Icon size={26} className="text-yellow-accent" />
          </div>
          <div>
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {lang === 'ar' ? 'الخدمات' : 'Services'}
            </span>
            <h1 className="section-heading text-base-primary">
              {lang === 'ar' ? category.nameAr : category.nameEn}
            </h1>
          </div>
        </div>
        <p className="text-base-muted text-lg max-w-3xl leading-relaxed">
          {lang === 'ar' ? category.descriptionAr : category.descriptionEn}
        </p>
      </div>

      {/* Services list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-12">
        {category.services.map((svc, i) => (
          <div
            key={svc.id}
            className="card-industrial p-6 lg:p-7 hover-lift group animate-fade-in-up"
            style={{ animationDelay: `${(i % 2) * 0.1}s` }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center font-black text-yellow-accent text-sm">
                {String(svc.displayOrder).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-base-primary mb-2 group-hover:text-yellow-accent transition-colors">
                  {lang === 'ar' ? svc.nameAr : svc.nameEn}
                </h3>
                <p className="text-sm text-base-muted leading-relaxed">
                  {lang === 'ar' ? svc.descriptionAr : svc.descriptionEn}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card-industrial p-8 lg:p-10 text-center">
        <h2 className="text-2xl font-black text-base-primary mb-3">
          {lang === 'ar' ? 'هل لديك مشروع؟' : 'Have a project?'}
        </h2>
        <p className="text-base-muted mb-6 max-w-xl mx-auto">
          {lang === 'ar'
            ? 'اطلب عرض مشروع وسيتواصل معك فريق SAHAB لمناقشة المتطلبات.'
            : 'Request a project quote and the SAHAB team will contact you to discuss requirements.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => { window.location.hash = `#/services/request?service=${category.services[0].id}`; }}
            className="btn-primary group"
          >
            {lang === 'ar' ? 'اطلب عرض مشروع' : 'Request a Project Quote'}
            <ArrowRight
              size={18}
              className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
            />
          </button>
          <a href="#contact" className="btn-secondary">
            {lang === 'ar' ? 'تواصل مع فريق SAHAB' : 'Contact SAHAB Team'}
          </a>
        </div>
      </div>
    </div>
  );
}
