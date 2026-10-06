import { ArrowRight, Building2, HardHat, PencilRuler, MapPin, ClipboardList } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const sections = [
  {
    id: 'project-execution',
    route: '#/services/project-execution',
    icon: Building2,
    titleAr: 'طلب تنفيذ مشروع',
    titleEn: 'Project Execution Request',
    descAr: 'للعملاء الذين يرغبون في قيام سحاب بتنفيذ مشروع إنشائي متكامل',
    descEn: 'For customers who want SAHAB to execute a complete construction project',
  },
  {
    id: 'contracting-works',
    route: '#/services/contracting-works',
    icon: HardHat,
    titleAr: 'طلب أعمال مقاولات',
    titleEn: 'Contracting Works Request',
    descAr: 'للعملاء الذين يحتاجون إلى أعمال مقاولات محددة',
    descEn: 'For customers requesting specific contracting work',
  },
  {
    id: 'engineering-services',
    route: '#/services/engineering-services',
    icon: PencilRuler,
    titleAr: 'الخدمات الهندسية',
    titleEn: 'Engineering Services',
    descAr: 'طلبات الخدمات الهندسية والاستشارات الفنية',
    descEn: 'Engineering services and technical consultation requests',
  },
  {
    id: 'project-management',
    route: '#/services/project-management',
    icon: ClipboardList,
    titleAr: 'إدارة المشاريع',
    titleEn: 'Project Management',
    descAr: 'طلبات إدارة وإشراف على المشاريع',
    descEn: 'Project management and supervision requests',
  },
  {
    id: 'site-visit',
    route: '#/services/site-visit',
    icon: MapPin,
    titleAr: 'طلب معاينة / زيارة موقع',
    titleEn: 'Site Visit Request',
    descAr: 'طلب معاينة الموقع لتقييم المشروع وتقديم العرض المناسب',
    descEn: 'Request a site visit for project assessment and quotation',
  },
];

export default function ContractingSection() {
  const { dir, lang } = useApp();

  return (
    <section id="contracting" className="py-20 lg:py-28 bg-elevated relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <img src="https://images.pexels.com/photos/37687676/pexels-photo-37687676.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-elevated via-elevated/95 to-elevated" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">{lang === 'ar' ? 'المقاولات والإنشاءات' : 'Construction & Contracting'}</span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="section-heading text-base-primary mb-4">{lang === 'ar' ? 'المقاولات والإنشاءات' : 'Construction & Contracting'}</h2>
          <p className="text-base-muted text-lg max-w-2xl mx-auto">{lang === 'ar' ? 'خدمات مقاولات وإنشاءات شاملة للمشاريع الصناعية والتجارية' : 'Comprehensive contracting and construction services for industrial and commercial projects'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                href={section.route}
                data-tilt className="card-industrial p-6 lg:p-8 hover-lift group animate-fade-in-up flex flex-col"
                style={{ animationDelay: `${(i % 3) * 0.1}s` }}
              >
                <div className="flex items-start gap-5 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center group-hover:bg-yellow-accent transition-all duration-300">
                    <Icon size={26} className="text-yellow-accent group-hover:text-black transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-base-primary mb-2 group-hover:text-yellow-accent transition-colors">{lang === 'ar' ? section.titleAr : section.titleEn}</h3>
                    <p className="text-base-muted leading-relaxed text-sm">{lang === 'ar' ? section.descAr : section.descEn}</p>
                  </div>
                </div>
                <span className="mt-auto self-start px-4 py-2.5 rounded-lg bg-yellow-accent/10 border border-yellow-accent/30 text-yellow-accent text-sm font-bold group-hover:bg-yellow-accent group-hover:text-black transition-all flex items-center gap-2">
                  {lang === 'ar' ? 'اطلب هذه الخدمة' : 'Request This Service'}
                  <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
                </span>
              </a>
            );
          })}
        </div>
        <div className="text-center">
          <a href="#/services/request" className="btn-primary group">
            {lang === 'ar' ? 'ابدأ طلب مشروعك' : 'Start Your Project Request'}
            <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </a>
        </div>
      </div>
    </section>
  );
}
