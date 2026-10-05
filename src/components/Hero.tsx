import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';

export default function Hero() {
  const { t, dir, lang } = useApp();
  const { banner, settings, loading } = useSiteContent();

  const heroImage = banner?.image_url || 'https://images.pexels.com/photos/33870733/pexels-photo-33870733.jpeg?auto=compress&cs=tinysrgb&w=1920';
  const headline = banner?.title_ar || banner?.title_en || t.hero.headline;
  const subtext = banner?.subtitle_ar || banner?.subtitle_en || t.hero.subtext;
  const primaryCtaText = banner?.button_text_ar || banner?.button_text_en || t.hero.primaryCta;
  const primaryCtaLink = banner?.button_link || '#/catalog';
  const secondaryCtaText = settings?.whatsapp
    ? (lang === 'ar' ? 'تواصل مع فريق سحاب' : 'Contact SAHAB Team')
    : t.hero.secondaryCta;
  const secondaryCtaLink = settings?.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`
    : '#contact';

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-base">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Heavy equipment" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>
      <div className="absolute inset-0 z-0 industrial-pattern opacity-30" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-accent/30 bg-yellow-accent/10 backdrop-blur-sm mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-yellow-accent animate-pulse" />
            <span className="text-yellow-accent text-sm font-semibold tracking-wide">{t.hero.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up delay-100">
            {lang === 'ar' ? (banner?.title_ar || headline) : (banner?.title_en || headline)}
          </h1>
          <p className="text-lg lg:text-xl text-gray-300 leading-relaxed mb-8 max-w-xl animate-fade-in-up delay-200">
            {lang === 'ar' ? (banner?.subtitle_ar || subtext) : (banner?.subtitle_en || subtext)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
            <a href={primaryCtaLink} className="btn-primary group">
              {lang === 'ar' ? (banner?.button_text_ar || primaryCtaText) : (banner?.button_text_en || primaryCtaText)}
              <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </a>
            <a href={secondaryCtaLink} target={settings?.whatsapp ? '_blank' : undefined} rel={settings?.whatsapp ? 'noopener noreferrer' : undefined} className="btn-secondary group">
              {secondaryCtaText}
              <ChevronLeft size={18} className={`transition-transform group-hover:-translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-white/10 animate-fade-in-up delay-500">
            {t.company.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl lg:text-3xl font-black text-yellow-accent mb-1">{stat.value}</div>
                <div className="text-xs lg:text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-2 animate-fade-in delay-600">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-yellow-accent animate-bounce" />
        </div>
      </div>
    </section>
  );
}
