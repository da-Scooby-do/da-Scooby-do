import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';

/** Floating WhatsApp shortcut and back-to-top button, sized for thumbs on phones. */
export default function FloatingActions() {
  const { lang } = useApp();
  const { settings } = useSiteContent();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappDigits = settings?.whatsapp?.replace(/[^0-9]/g, '') || '';

  return (
    <div className="fixed bottom-4 sm:bottom-6 ltr:right-4 rtl:left-4 sm:ltr:right-6 sm:rtl:left-6 z-40 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={lang === 'ar' ? 'العودة للأعلى' : 'Back to top'}
        className={`w-11 h-11 rounded-full bg-elevated/90 backdrop-blur border border-base text-base-primary flex items-center justify-center shadow-lg transition-all duration-300 hover:border-yellow-accent hover:text-yellow-accent ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp size={18} />
      </button>
      {whatsappDigits && (
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={lang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
          className="group relative w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl shadow-black/40 transition-transform duration-300 hover:scale-110 animate-scale-in"
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping [animation-duration:2.5s]" />
          <MessageCircle size={26} className="relative" />
          <span className="hidden sm:block absolute ltr:right-full rtl:left-full mx-3 px-3 py-1.5 rounded-lg bg-elevated border border-base text-base-primary text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {lang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
          </span>
        </a>
      )}
    </div>
  );
}
