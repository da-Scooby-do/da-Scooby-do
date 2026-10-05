import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LegalPageView({ pageId }: { pageId: string }) {
  const { lang, dir } = useApp();
  const { legalPages } = useSiteContent();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = legalPages.find((p) => p.id === pageId);
    if (found) {
      setPage(found);
      setLoading(false);
    } else {
      supabase.from('legal_pages').select('*').eq('id', pageId).maybeSingle().then(({ data }) => {
        setPage(data);
        setLoading(false);
      });
    }
  }, [pageId, legalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-pulse text-yellow-accent text-lg">Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-base-primary mb-4">{lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</h1>
          <a href="#/" className="btn-primary inline-flex items-center gap-2">
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <h1 className="text-3xl lg:text-4xl font-black text-base-primary mb-8">
          {lang === 'ar' ? page.title_ar : page.title_en}
        </h1>
        <div className="card-industrial p-6 lg:p-10">
          <div className="prose prose-invert max-w-none">
            <p className="text-base-muted leading-relaxed whitespace-pre-wrap text-base">
              {lang === 'ar' ? (page.content_ar || 'محتوى هذه الصفحة لم يتم إضافته بعد. سيتم تحديثه قريباً.') : (page.content_en || 'Content for this page has not been added yet. It will be updated soon.')}
            </p>
          </div>
        </div>
        <div className="mt-8">
          <a href="#/" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
