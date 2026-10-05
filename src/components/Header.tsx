import { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon, Globe, ArrowRight, UserCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { t, lang, toggleLang, theme, toggleTheme, dir } = useApp();
  const { settings } = useSiteContent();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: t.nav.home, href: '#home' },
    { label: t.nav.equipment, href: '#/catalog' },
    { label: lang === 'ar' ? 'المقاولات والإنشاءات' : 'Contracting & Construction', href: '#/services/contracting' },
    { label: lang === 'ar' ? 'الخدمات' : 'Services', href: '#/services/request' },
    { label: t.nav.about, href: '#about' },
    { label: t.nav.contact, href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-elevated border-b border-base shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-accent rounded-lg flex items-center justify-center font-black text-black text-xl lg:text-2xl transition-transform group-hover:scale-105">
                S
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-accent rounded-sm opacity-60" />
            </div>
            <div className="flex flex-col leading-none">
              {lang === 'ar' && settings?.logo_ar ? (
                <img src={settings.logo_ar} alt="سحاب" className="h-7 lg:h-9 w-auto object-contain" />
              ) : lang === 'en' && settings?.logo_en ? (
                <img src={settings.logo_en} alt="SAHAB" className="h-7 lg:h-9 w-auto object-contain" />
              ) : (
                <>
                  <span className="text-xl lg:text-2xl font-black text-base-primary tracking-tight">
                    {lang === 'ar' ? (settings?.company_name_ar || 'سحاب') : (settings?.company_name_en || 'SAHAB')}
                  </span>
                  <span className="text-[0.6rem] lg:text-xs text-base-muted font-medium tracking-wider">
                    {lang === 'ar' ? 'معدات ومقاولات' : 'EQUIPMENT & CONTRACTING'}
                  </span>
                </>
              )}
            </div>
          </a>

          {/* Controls */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all text-sm font-semibold"
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Account link */}
            <a
              href="#/account"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all text-sm font-semibold"
            >
              <UserCircle size={18} />
              <span className="hidden sm:inline">{authed ? (lang === 'ar' ? 'حسابي' : 'My Account') : (lang === 'ar' ? 'تسجيل الدخول' : 'Login')}</span>
            </a>

            {/* CTA */}
            <a
              href="#/catalog"
              className="hidden sm:inline-flex btn-primary text-sm"
            >
              {t.cta.orderEquipment}
              <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg border border-base text-base-primary"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-elevated border-b border-base animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-base font-medium text-base-muted hover:text-yellow-accent hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#/account"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 text-base font-medium text-base-muted hover:text-yellow-accent hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
            >
              <UserCircle size={18} />
              {authed ? (lang === 'ar' ? 'حسابي' : 'My Account') : (lang === 'ar' ? 'تسجيل الدخول' : 'Login')}
            </a>
            <a
              href="#/catalog"
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-2 justify-center"
            >
              {t.cta.orderEquipment}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
