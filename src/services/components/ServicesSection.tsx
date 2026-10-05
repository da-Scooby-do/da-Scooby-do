import { Building2, PencilRuler, ClipboardList, ArrowRight, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { serviceCategories } from '../types';
import type { ServiceCategoryId } from '../types';

const iconMap: Record<string, typeof Building2> = {
  Building2,
  PencilRuler,
  ClipboardList,
};

export default function ServicesSection() {
  const { t, lang, dir } = useApp();

  const goTo = (id: ServiceCategoryId) => {
    window.location.hash = `#/services/${id}`;
  };

  return (
    <section id="services" className="py-20 lg:py-28 bg-elevated relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {lang === 'ar' ? 'خدماتنا' : 'Our Services'}
            </span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="section-heading text-base-primary mb-4">
            {lang === 'ar' ? 'المقاولات والإنشاءات والخدمات الهندسية' : 'Contracting, Construction & Engineering Services'}
          </h2>
          <p className="text-base-muted text-lg max-w-2xl mx-auto">
            {lang === 'ar'
              ? 'حلول متكاملة تنقل مشروعك من الفكرة إلى التنفيذ بخبرة وتنظيم احترافي.'
              : 'Integrated solutions that take your project from concept to execution with professional expertise and organization.'}
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {serviceCategories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Building2;
            return (
              <button
                key={cat.id}
                onClick={() => goTo(cat.id)}
                data-tilt className="card-industrial p-6 lg:p-8 hover-lift group text-start animate-fade-in-up"
                style={{ animationDelay: `${(i % 3) * 0.1}s` }}
              >
                <div className="flex items-start gap-5 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center group-hover:bg-yellow-accent transition-all duration-300">
                    <Icon size={26} className="text-yellow-accent group-hover:text-black transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-base-primary mb-2 group-hover:text-yellow-accent transition-colors">
                      {lang === 'ar' ? cat.nameAr : cat.nameEn}
                    </h3>
                    <p className="text-sm text-base-muted leading-relaxed">
                      {lang === 'ar' ? cat.shortDescriptionAr : cat.shortDescriptionEn}
                    </p>
                  </div>
                </div>

                {/* Sub-services preview */}
                <div className="space-y-1.5 mb-5">
                  {cat.services.slice(0, 4).map((svc) => (
                    <div key={svc.id} className="flex items-center gap-2 text-sm text-base-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-accent/60 flex-shrink-0" />
                      {lang === 'ar' ? svc.nameAr : svc.nameEn}
                    </div>
                  ))}
                  {cat.services.length > 4 && (
                    <div className="text-xs text-base-muted pt-1">
                      +{cat.services.length - 4} {lang === 'ar' ? 'خدمات أخرى' : 'more services'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-yellow-accent">
                  {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  <ArrowRight
                    size={16}
                    className={`transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`}
                  />
                </div>

                <div className="h-1 w-0 bg-yellow-accent transition-all duration-500 group-hover:w-full mt-4" />
              </button>
            );
          })}
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => { window.location.hash = '#/services/request'; }}
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
    </section>
  );
}
