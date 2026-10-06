import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type Block =
  | { kind: 'updated'; text: string }
  | { kind: 'heading'; id: string; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'lines'; lines: string[] };

/**
 * Turns plain legal text into blocks: "1. Title" lines become headings,
 * lines after a sentence ending in ":" become a bullet list, and other
 * multi-line groups (e.g. contact details) keep their line breaks.
 */
function parseLegal(content: string): Block[] {
  const groups = content.replace(/\r/g, '').split(/\n\s*\n/).map((g) => g.split('\n').map((l) => l.trim()).filter(Boolean)).filter((g) => g.length);
  const blocks: Block[] = [];
  let listNext = false;
  for (const lines of groups) {
    const first = lines[0];
    if (lines.length === 1 && /^(آخر تحديث|Last updated)/i.test(first)) {
      blocks.push({ kind: 'updated', text: first });
      listNext = false;
      continue;
    }
    if (lines.length === 1 && /^\d+\.\s+\S/.test(first) && first.length < 80) {
      blocks.push({ kind: 'heading', id: `section-${first.match(/^\d+/)![0]}`, text: first });
      listNext = false;
      continue;
    }
    if (listNext && lines.length > 1) {
      blocks.push({ kind: 'list', items: lines });
    } else if (lines.length > 1) {
      blocks.push({ kind: 'lines', lines });
    } else {
      blocks.push({ kind: 'paragraph', text: first });
    }
    listNext = /[:：]$/.test(lines[lines.length - 1]);
  }
  return blocks;
}

/** Makes emails and Saudi phone numbers tappable. */
function linkify(text: string) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+|\b05\d{8}\b)/g);
  return parts.map((part, i) => {
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) {
      return <a key={i} href={`mailto:${part}`} dir="ltr" className="text-yellow-accent hover:underline">{part}</a>;
    }
    if (/^05\d{8}$/.test(part)) {
      return <a key={i} href={`tel:${part}`} dir="ltr" className="text-yellow-accent hover:underline">{part}</a>;
    }
    return part;
  });
}

/** Renders "Label: value" with the label emphasised. */
function labelled(line: string) {
  const m = line.match(/^([^:：]{1,30})[:：]\s*(.+)$/);
  if (!m) return linkify(line);
  const waNumber = /واتساب|whatsapp/i.test(m[1]) && m[2].match(/^05\d{8}$/);
  if (waNumber) {
    return (
      <>
        <span className="text-base-primary font-semibold">{m[1]}:</span>{' '}
        <a href={`https://wa.me/966${m[2].slice(1)}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-yellow-accent hover:underline">{m[2]}</a>
      </>
    );
  }
  return (
    <>
      <span className="text-base-primary font-semibold">{m[1]}:</span> {linkify(m[2])}
    </>
  );
}

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 lg:pt-32 lg:pb-20">
        <h1 className="text-3xl lg:text-5xl font-black text-base-primary mb-3 animate-fade-in-up">
          {lang === 'ar' ? page.title_ar : page.title_en}
        </h1>
        <p className="text-base-muted mb-8 animate-fade-in-up delay-100">
          {lang === 'ar' ? 'شركة سحاب للمقاولات وتأجير المعدات' : 'SAHAB Contracting & Equipment Rental'}
        </p>
        {(() => {
          const showEnglish = lang === 'en' && !!page.content_en?.trim();
          const content: string = (showEnglish ? page.content_en : page.content_ar) || '';
          if (!content.trim()) {
            return (
              <div className="card-industrial p-6 lg:p-10 text-base-muted">
                {lang === 'ar' ? 'محتوى هذه الصفحة لم يتم إضافته بعد. سيتم تحديثه قريباً.' : 'Content for this page has not been added yet. It will be updated soon.'}
              </div>
            );
          }
          const blocks = parseLegal(content);
          const headings = blocks.filter((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading');
          return (
            <div className="grid lg:grid-cols-[16rem_1fr] gap-6 lg:gap-10 items-start" dir={showEnglish ? 'ltr' : 'rtl'}>
              {headings.length > 2 && (
                <nav className="lg:sticky lg:top-28 card-industrial p-4 max-h-[70vh] overflow-y-auto" aria-label={lang === 'ar' ? 'المحتويات' : 'Contents'}>
                  <p className="text-xs font-bold text-yellow-accent uppercase tracking-wider mb-3">{lang === 'ar' ? 'المحتويات' : 'Contents'}</p>
                  <ol className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible">
                    {headings.map((h) => (
                      <li key={h.id} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="w-full text-start text-sm text-base-muted hover:text-yellow-accent px-3 py-2 rounded-lg hover:bg-yellow-accent/5 transition-colors whitespace-nowrap lg:whitespace-normal"
                        >
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <article className="card-industrial p-6 lg:p-10 space-y-4 text-base leading-loose text-base-muted min-w-0">
                {blocks.map((b, i) => {
                  switch (b.kind) {
                    case 'updated':
                      return (
                        <p key={i} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-yellow-accent/30 bg-yellow-accent/10 text-yellow-accent">
                          <CalendarClock size={15} />
                          {b.text}
                        </p>
                      );
                    case 'heading':
                      return (
                        <h2 key={i} id={b.id} className="scroll-mt-28 text-xl lg:text-2xl font-black text-base-primary pt-6 mt-2 border-t border-base first:border-0 first:pt-0" data-reveal>
                          {b.text}
                        </h2>
                      );
                    case 'list':
                      return (
                        <ul key={i} className="space-y-2">
                          {b.items.map((item, j) => (
                            <li key={j} className="flex gap-3">
                              <span className="mt-3 w-1.5 h-1.5 rounded-full bg-yellow-accent shrink-0" />
                              <span>{labelled(item)}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    case 'lines':
                      return (
                        <div key={i} className="rounded-xl bg-base/60 border border-base p-4 space-y-1">
                          {b.lines.map((line, j) => <p key={j}>{labelled(line)}</p>)}
                        </div>
                      );
                    default:
                      return <p key={i}>{linkify(b.text)}</p>;
                  }
                })}
              </article>
            </div>
          );
        })()}
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
