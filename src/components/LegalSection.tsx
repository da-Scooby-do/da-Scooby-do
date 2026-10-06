import { ArrowRight, CalendarClock, FileText, ShieldCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';

/** Homepage section linking to the published legal pages (privacy, terms, …). */
export default function LegalSection() {
  const { lang, dir } = useApp();
  const { legalPages } = useSiteContent();
  const ar = lang === 'ar';

  const pages = legalPages
    .filter((p) => p.is_active && (p.content_ar?.trim() || p.content_en?.trim()))
    .sort((a, b) => a.display_order - b.display_order);

  if (pages.length === 0) return null;

  return (
    <section id="legal" className="py-16 lg:py-24 bg-elevated relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-block mb-4">
            <span className="text-yellow-accent text-sm font-bold tracking-widest uppercase">
              {ar ? 'الصفحات القانونية' : 'Legal'}
            </span>
            <div className="h-0.5 w-12 bg-yellow-accent mx-auto mt-2" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-base-primary mb-3">
            {ar ? 'الشفافية والثقة' : 'Transparency & Trust'}
          </h2>
          <p className="text-base-muted max-w-2xl mx-auto">
            {ar
              ? 'اطّلع على سياسة الخصوصية والشروط والأحكام التي تنظم استخدام موقع سحاب وخدمات التأجير والمقاولات.'
              : 'Read the privacy policy and terms that govern the SAHAB website and our rental and contracting services.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {pages.map((page, i) => {
            const content = (ar ? page.content_ar : page.content_en) || page.content_ar || '';
            const updated = content.split('\n').find((l) => /^(آخر تحديث|Last updated)/i.test(l.trim()))?.trim();
            const sections = (content.match(/^\d+\.\s+\S/gm) || []).length;
            const Icon = page.id.includes('privacy') ? ShieldCheck : FileText;
            return (
              <a
                key={page.id}
                href={`#/legal/${page.id}`}
                data-tilt
                className="card-industrial hover-lift group p-6 lg:p-8 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center group-hover:bg-yellow-accent transition-all duration-300">
                    <Icon size={26} className="text-yellow-accent group-hover:text-black transition-colors" />
                  </div>
                  {sections > 0 && (
                    <span className="text-xs font-semibold text-base-muted px-2.5 py-1 rounded-full border border-base">
                      {sections} {ar ? 'بند' : 'sections'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-base-primary mb-2 group-hover:text-yellow-accent transition-colors">
                  {ar ? page.title_ar : page.title_en}
                </h3>
                {updated && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-base-muted mb-6">
                    <CalendarClock size={14} className="text-yellow-accent" />
                    {updated}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-yellow-accent">
                  {ar ? 'اقرأ الصفحة كاملة' : 'Read full page'}
                  <ArrowRight size={16} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
