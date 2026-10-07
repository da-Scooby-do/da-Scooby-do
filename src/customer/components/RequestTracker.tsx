import { useEffect, useState } from 'react';
import { Check, Circle, XCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

interface QuoteRow { id: string; status: string; quotation_reference: string }
interface ContractRow { id: string; status: string; po_number: string | null; contract_number: string }
interface DeliveryRow { status: string; contract_id: string | null }

export interface TrackedRequest {
  id: string;
  kind: 'rental' | 'project';
  status: string;
}

interface Step {
  key: string;
  ar: string;
  en: string;
  done: boolean;
  noteAr?: string;
  noteEn?: string;
}

const CLOSED = ['rejected', 'cancelled'];

/** Builds the website order flow from the request and the quotation / contract / delivery linked to it. */
function buildSteps(req: TrackedRequest, quotes: QuoteRow[], contracts: ContractRow[], deliveries: DeliveryRow[]): Step[] {
  const quoteSent = quotes.some((q) => !['draft', 'ready_to_send'].includes(q.status));
  const accepted = quotes.some((q) => q.status === 'accepted') || ['awaiting_po', 'approved', 'completed'].includes(req.status);
  const contract = contracts[0];
  const poUploaded = !!contract?.po_number || ['approved', 'completed'].includes(req.status);
  const signed = !!contract && ['active', 'completed', 'signed', 'expired'].includes(contract.status);
  const delivered = deliveries.some((d) => d.status === 'delivered') || req.status === 'completed';

  const steps: Step[] = [
    { key: 'sent', ar: 'إرسال الطلب', en: 'Request sent', done: true },
    { key: 'review', ar: 'سحاب تراجع الطلب', en: 'SAHAB reviews the request', done: req.status !== 'new' || quoteSent },
    { key: 'quote', ar: 'عرض السعر', en: 'Quotation', done: quoteSent, noteAr: quoteSent && !accepted ? 'عرض السعر جاهز في صفحة «عروض الأسعار»' : undefined, noteEn: quoteSent && !accepted ? 'Your quotation is ready on the Quotations page' : undefined },
    { key: 'accept', ar: 'قبول العميل', en: 'Customer acceptance', done: accepted },
    { key: 'po', ar: 'رفع أمر الشراء (PO)', en: 'Purchase order (PO)', done: poUploaded },
    { key: 'contract', ar: 'عقد التأجير', en: 'Rental contract', done: !!contract },
    { key: 'sign', ar: 'التوقيع', en: 'Signing', done: signed },
    { key: 'payment', ar: 'الدفع (خارج المنصة)', en: 'Payment (outside the platform)', done: signed, noteAr: 'يتم الدفع مباشرة مع سحاب حسب شروط العقد', noteEn: 'Paid directly to SAHAB per the contract terms' },
  ];
  if (req.kind === 'rental') {
    steps.push(
      { key: 'allocate', ar: 'تخصيص المعدة', en: 'Equipment allocation', done: deliveries.length > 0 || delivered },
      { key: 'deliver', ar: 'التسليم', en: 'Delivery', done: delivered },
    );
  }
  // Steps only count as done if every earlier step is done (keeps the line continuous).
  let reached = true;
  return steps.map((s) => {
    reached = reached && s.done;
    return { ...s, done: reached };
  });
}

export function useRequestProgress(req: TrackedRequest) {
  const [steps, setSteps] = useState<Step[]>(() => buildSteps(req, [], [], []));
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [q, c] = await Promise.all([
        supabase.from('quotations').select('id,status,quotation_reference').eq('request_id', req.id),
        supabase.from('contracts').select('id,status,po_number,contract_number').eq('request_id', req.id),
      ]);
      const contracts = (c.data as ContractRow[] | null) || [];
      let deliveries: DeliveryRow[] = [];
      if (contracts.length) {
        const d = await supabase.from('deliveries').select('status,contract_id').in('contract_id', contracts.map((x) => x.id));
        deliveries = (d.data as DeliveryRow[] | null) || [];
      }
      if (!cancelled) setSteps(buildSteps(req, (q.data as QuoteRow[] | null) || [], contracts, deliveries));
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [req.id, req.status, req.kind]); // eslint-disable-line react-hooks/exhaustive-deps
  return steps;
}

/** Compact progress bar for request cards. */
export function RequestProgressBar({ req }: { req: TrackedRequest }) {
  const { lang } = useApp();
  const steps = useRequestProgress(req);
  if (CLOSED.includes(req.status)) return null;
  const done = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done);
  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {steps.map((s) => (
          <span key={s.key} className={`h-1.5 flex-1 rounded-full ${s.done ? 'bg-yellow-accent' : s === current ? 'bg-yellow-accent/35' : 'bg-base-muted/20'}`} />
        ))}
      </div>
      <div className="mt-1.5 text-xs text-base-muted">
        {current ? (lang === 'ar' ? `المرحلة الحالية: ${current.ar}` : `Current step: ${current.en}`) : (lang === 'ar' ? 'اكتملت جميع المراحل' : 'All steps completed')}
        <span className="opacity-60"> · {done}/{steps.length}</span>
      </div>
    </div>
  );
}

/** Full vertical tracker for the request details view. */
export default function RequestTracker({ req }: { req: TrackedRequest }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const steps = useRequestProgress(req);
  const current = steps.find((s) => !s.done);

  if (CLOSED.includes(req.status)) {
    return (
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-sm text-red-500">
        <XCircle size={20} />
        {req.status === 'rejected' ? (ar ? 'تم رفض هذا الطلب. تواصل مع فريق سحاب للتفاصيل.' : 'This request was rejected. Contact the SAHAB team for details.') : (ar ? 'تم إلغاء هذا الطلب.' : 'This request was cancelled.')}
      </div>
    );
  }

  return (
    <div className="card-industrial p-5">
      <h3 className="text-sm font-bold text-yellow-accent mb-4">{ar ? 'تتبع الطلب' : 'Request progress'}</h3>
      <ol className="relative">
        {steps.map((s, i) => {
          const isCurrent = s === current;
          return (
            <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span className={`absolute top-7 bottom-0 w-0.5 ltr:left-[13px] rtl:right-[13px] ${s.done ? 'bg-yellow-accent' : 'bg-base-muted/20'}`} />
              )}
              <span
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  s.done ? 'bg-yellow-accent border-yellow-accent text-black' : isCurrent ? 'border-yellow-accent text-yellow-accent bg-yellow-accent/10 animate-pulse' : 'border-base-muted/30 text-base-muted'
                }`}
              >
                {s.done ? <Check size={14} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
              </span>
              <div className="pt-0.5">
                <div className={`text-sm font-semibold ${s.done ? 'text-base-primary' : isCurrent ? 'text-yellow-accent' : 'text-base-muted'}`}>
                  {ar ? s.ar : s.en}
                  {isCurrent && <span className="ms-2 text-[11px] px-2 py-0.5 rounded-full bg-yellow-accent/10 border border-yellow-accent/30">{ar ? 'الحالية' : 'Current'}</span>}
                </div>
                {(s.noteAr || s.noteEn) && (s.done || isCurrent) && (
                  <div className="text-xs text-base-muted mt-0.5 flex items-center gap-1"><Info size={12} />{ar ? s.noteAr : s.noteEn}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
