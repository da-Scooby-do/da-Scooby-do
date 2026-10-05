import { ArrowRight, Phone, MessageCircle, Mail } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';

export default function CTA() {
  const { t, dir, lang } = useApp();
  const { settings } = useSiteContent();

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#contact';
  const phoneLink = settings?.phone ? `tel:${settings.phone}` : '#contact';
  const emailLink = settings?.email ? `mailto:${settings.email}` : '#contact';

  return (
    <section id="contact" className="py-20 lg:py-28 bg-base relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.pexels.com/photos/30278762/pexels-photo-30278762.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-base via-base/90 to-base" />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="card-industrial p-8 lg:p-16 text-center relative overflow-hidden animate-scale-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-accent" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-accent/30 bg-yellow-accent/10 mb-6">
            <Phone size={16} className="text-yellow-accent" />
            <span className="text-yellow-accent text-sm font-semibold">{t.cta.contactUs}</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-base-primary leading-tight mb-4 max-w-3xl mx-auto">
            {lang === 'ar' ? 'تواصل مع فريق سحاب' : 'Contact SAHAB Team'}
          </h2>
          <p className="text-base-muted text-lg mb-10 max-w-2xl mx-auto">{t.finalCta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a href="#/services/project-request" className="btn-primary group">
              {lang === 'ar' ? 'ابدأ طلب مشروعك' : 'Start Your Project Request'}
              <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </a>
            {settings?.whatsapp && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-secondary group">
                <MessageCircle size={18} />
                {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
              </a>
            )}
            {settings?.phone && (
              <a href={phoneLink} className="btn-secondary group">
                <Phone size={18} />
                {lang === 'ar' ? 'اتصل بنا' : 'Call Us'}
              </a>
            )}
            {settings?.email && (
              <a href={emailLink} className="btn-secondary group">
                <Mail size={18} />
                {lang === 'ar' ? 'بريد إلكتروني' : 'Email'}
              </a>
            )}
            {!settings?.whatsapp && !settings?.phone && !settings?.email && (
              <a href="#contact" className="btn-secondary group">
                <Phone size={18} />
                {t.finalCta.button2}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
