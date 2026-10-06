import { Building2, PencilRuler, ClipboardList, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getServiceCategoryById, serviceCategories } from '../types';
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
        {category.id !== 'contracting' && (
          <>
            <button
              onClick={() => { window.location.hash = '#/services/contracting'; }}
              className="text-base-muted hover:text-yellow-accent transition-colors"
            >
              {lang === 'ar' ? 'المقاولات والإنشاءات' : 'Contracting & Construction'}
            </button>
            <span className="text-base-muted opacity-50">/</span>
          </>
        )}
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

      {/* Services (moved here from the removed "الخدمات" menu item) */}
      {category.id === 'contracting' && (
        <section id="services" className="mb-12">
          <div className="text-center mb-8">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {lang === 'ar' ? 'خدماتنا' : 'Our Services'}
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-base-primary mt-2">
              {lang === 'ar' ? 'الخدمات' : 'Services'}
            </h2>
            <p className="text-base-muted mt-2 max-w-2xl mx-auto">
              {lang === 'ar'
                ? 'خدمات هندسية وإدارة مشاريع تكمل أعمال المقاولات من التصميم حتى التسليم.'
                : 'Engineering and project management services that complement our contracting work from design to handover.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {serviceCategories.filter((c) => c.id !== category.id).map((other, i) => {
              const OtherIcon = iconMap[other.icon] || Building2;
              return (
                <button
                  key={other.id}
                  onClick={() => { window.location.hash = `#/services/${other.id}`; }}
                  data-tilt
                  className="card-industrial hover-lift group p-6 text-start animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-accent transition-all">
                      <OtherIcon size={22} className="text-yellow-accent group-hover:text-black transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-base-primary group-hover:text-yellow-accent transition-colors">
                        {lang === 'ar' ? other.nameAr : other.nameEn}
                      </h3>
                      <p className="text-sm text-base-muted mt-1">{lang === 'ar' ? other.shortDescriptionAr : other.shortDescriptionEn}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {other.services.map((svc) => (
                      <li key={svc.id} className="flex items-center gap-2 text-sm text-base-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-accent/60 flex-shrink-0" />
                        {lang === 'ar' ? svc.nameAr : svc.nameEn}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-yellow-accent">
                    {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                    <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <a href="#/services/request" className="btn-secondary inline-flex">
              {lang === 'ar' ? 'اطلب خدمة' : 'Request a Service'}
              <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
            </a>
          </div>
        </section>
      )}

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
