import { useState, useEffect, useCallback } from 'react';
import { FileText, Check, X, Eye, Clock, Printer, Loader2, AlertCircle, Upload, ClipboardCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { supabase } from '@/lib/supabase';
import {
  dbQuotationStatusLabels, dbQuotationStatusColors, defaultQuotationTerms,
  PO_REQUIREMENT_AR, PO_REQUIREMENT_EN, SAHAB_INFO,
} from '@/quotation/types';
import type { QuotationRow, QuotationItemDB, QuotationDBStatus } from '@/quotation/types';
import DBPrintableQuotation from '@/quotation/components/DBPrintableQuotation';
import type { QuotationWithItems } from '@/quotation/types';
import { poStatusLabels, poStatusColors } from '@/purchase-orders/types';
import type { PurchaseOrderRow } from '@/purchase-orders/types';
import PoUploadModal from './PoUploadModal';

export default function QuotationsPage() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { user } = useCustomer();
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<QuotationRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewing, setViewing] = useState<QuotationWithItems | null>(null);
  const [printing, setPrinting] = useState<QuotationWithItems | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pos, setPos] = useState<PurchaseOrderRow[]>([]);
  const [uploadingFor, setUploadingFor] = useState<QuotationRow | null>(null);
  const [poNotice, setPoNotice] = useState<string | null>(null);

  const loadQuotations = useCallback(async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setQuotations((data as QuotationRow[] | null) || []);
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      setPos((poData as PurchaseOrderRow[] | null) || []);
    } catch (err) {
      console.error('Failed to load quotations', err);
      setError('تعذر تحميل عروض الأسعار / Could not load your quotations');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadQuotations(); }, [loadQuotations]);

  const loadQuotationDetail = async (id: string): Promise<QuotationWithItems | null> => {
    const { data: qData, error: qError } = await supabase
      .from('quotations').select('*').eq('id', id).maybeSingle();
    if (qError || !qData) return null;
    const { data: itemsData } = await supabase
      .from('quotation_items').select('*').eq('quotation_id', id).order('sort_order', { ascending: true });
    return { ...(qData as QuotationRow), items: (itemsData as QuotationItemDB[] | null) || [] };
  };

  const handleView = async (q: QuotationRow) => {
    const full = await loadQuotationDetail(q.id);
    if (full) setViewing(full);
  };

  const handleAccept = async (q: QuotationRow) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const { error: rpcError } = await supabase.rpc('customer_accept_quotation', { p_quotation_id: q.id });
      if (rpcError) throw rpcError;
      setViewing(null);
      loadQuotations();
    } catch (err) {
      console.error('Failed to accept quotation', err);
      setActionError('تعذر قبول عرض السعر. يرجى تحديث الصفحة والمحاولة مرة أخرى. / Could not accept this quotation. Please refresh and try again.');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const { error: rpcError } = await supabase.rpc('customer_reject_quotation', { p_quotation_id: rejecting.id, p_reason: rejectReason.trim() });
      if (rpcError) throw rpcError;
      setRejecting(null);
      setRejectReason('');
      setViewing(null);
      loadQuotations();
    } catch (err) {
      console.error('Failed to reject quotation', err);
      setActionError('تعذر رفض عرض السعر. يرجى تحديث الصفحة والمحاولة مرة أخرى. / Could not reject this quotation. Please refresh and try again.');
    } finally { setActionLoading(false); }
  };

  const handlePrint = async (q: QuotationRow) => {
    const full = await loadQuotationDetail(q.id);
    if (full) setPrinting(full);
  };

  /** The customer's latest PO for a quotation that is still in play (not rejected). */
  const activePo = (q: QuotationRow) => pos.find((p) => p.quotation_id === q.id && p.status !== 'rejected');
  const rejectedPo = (q: QuotationRow) => pos.find((p) => p.quotation_id === q.id && p.status === 'rejected');

  const renderPoBlock = (q: QuotationRow) => {
    if (q.status !== 'accepted') return null;
    const po = activePo(q);
    if (po) {
      return (
        <div className="p-3 rounded-lg bg-base border border-base text-sm mb-3 flex flex-wrap items-center gap-2">
          <ClipboardCheck size={15} className="text-yellow-accent" />
          <span className="text-base-muted">{ar ? 'أمر الشراء' : 'Purchase order'}:</span>
          <b className="text-base-primary" dir="ltr">{po.customer_po_number || po.po_number}</b>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${poStatusColors[po.status]}`}>{ar ? poStatusLabels[po.status].ar : poStatusLabels[po.status].en}</span>
          {po.status !== 'accepted' && <span className="text-xs text-base-muted">{ar ? '— قيد مراجعة سحاب' : '— SAHAB is reviewing it'}</span>}
        </div>
      );
    }
    return (
      <div className="p-3 rounded-lg bg-yellow-accent/5 border border-yellow-accent/30 text-sm mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-base-primary">
          {rejectedPo(q)
            ? (ar ? 'تم رفض أمر الشراء السابق، يرجى رفع أمر شراء جديد.' : 'Your previous PO was rejected. Please upload a new one.')
            : (ar ? 'الخطوة التالية: ارفع أمر الشراء (PO) لهذا العرض.' : 'Next step: upload the purchase order (PO) for this quotation.')}
        </span>
        <button onClick={() => setUploadingFor(q)} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
          <Upload size={14} /> {ar ? 'رفع أمر الشراء' : 'Upload PO'}
        </button>
      </div>
    );
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };
  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  return (
    <div className="space-y-6">
      {poNotice && (
        <div role="status" className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2 text-sm text-green-500">
          <Check size={16} /> {poNotice}
        </div>
      )}
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <FileText size={28} className="text-yellow-accent" />
          {ar ? 'عروض الأسعار' : 'Quotations'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${quotations.length} عرض سعر` : `${quotations.length} quotations`}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </div>
      ) : quotations.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عروض أسعار' : 'No quotations'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <div key={q.id} className="card-industrial p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{q.quotation_reference}</span>
                    <span className="text-xs text-base-muted">• {fmtDate(q.issue_date)}</span>
                  </div>
                  <div className="text-sm text-base-muted">
                    {ar ? 'الطلب المرتبط' : 'Related Request'}: <span className="font-semibold text-base-primary">{q.request_reference || '—'}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbQuotationStatusColors[q.status as QuotationDBStatus]}`}>
                  {ar ? dbQuotationStatusLabels[q.status as QuotationDBStatus].ar : dbQuotationStatusLabels[q.status as QuotationDBStatus].en}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'الإجمالي' : 'Total'}</div>
                  <div className="text-lg font-black text-base-primary">{fmtMoney(q.total)} <span className="text-xs font-normal text-base-muted">{q.currency}</span></div>
                </div>
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'صالح حتى' : 'Valid Until'}</div>
                  <div className="text-sm font-semibold text-base-primary flex items-center gap-1"><Clock size={12} /> {fmtDate(q.expiry_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-base-muted">{ar ? 'الإصدار' : 'Version'}</div>
                  <div className="text-sm font-semibold text-base-primary">v{q.version}</div>
                </div>
              </div>

              {q.status === 'rejected' && q.reject_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500 mb-3">
                  {ar ? 'سبب الرفض' : 'Reject reason'}: {q.reject_reason}
                </div>
              )}

              {q.status === 'accepted' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500 mb-3">
                  {ar ? `تم القبول` : `Accepted`}
                </div>
              )}

              {renderPoBlock(q)}

              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleView(q)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                  <Eye size={14} /> {ar ? 'عرض' : 'View'}
                </button>
                {(q.status === 'sent') && (
                  <>
                    <button onClick={() => handleAccept(q)} disabled={actionLoading} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {ar ? 'قبول العرض' : 'Accept'}
                    </button>
                    <button onClick={() => setRejecting(q)} className="px-3 py-2 rounded-lg border-2 border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 flex items-center gap-1.5">
                      <X size={14} /> {ar ? 'رفض العرض' : 'Reject'}
                    </button>
                  </>
                )}
                <button onClick={() => handlePrint(q)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                  <Printer size={14} /> {ar ? 'طباعة' : 'Print'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setRejecting(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-base-primary mb-2">{ar ? 'رفض عرض السعر' : 'Reject Quotation'}</h3>
            <p className="text-sm text-base-muted mb-4">{rejecting.quotation_reference}</p>
            {actionError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {actionError}
              </div>
            )}
            <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'سبب الرفض (مطلوب)' : 'Reject Reason (required)'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={ar ? 'اكتب سبب الرفض...' : 'Enter reject reason...'} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejecting(null)} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50">
                {ar ? 'تأكيد الرفض' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail view modal */}
      {viewing && !printing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-base-primary">{viewing.quotation_reference}</h3>
                <p className="text-xs text-base-muted">{viewing.request_reference || '—'} • {fmtDate(viewing.issue_date)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* SAHAB info */}
              <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5">
                <h4 className="text-sm font-black text-base-primary mb-2">{ar ? SAHAB_INFO.nameAr : SAHAB_INFO.nameEn}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-base-muted">
                  <div>{ar ? SAHAB_INFO.addressAr : SAHAB_INFO.addressEn}</div>
                  <div>{SAHAB_INFO.phone}</div>
                  <div>{SAHAB_INFO.email}</div>
                  <div>{ar ? 'الرقم الضريبي' : 'VAT'}: {SAHAB_INFO.vatNumber}</div>
                </div>
              </div>

              {/* Customer info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'بيانات العميل' : 'Customer'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'البنود' : 'Items'}</h4>
                <div className="space-y-2">
                  {viewing.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-base pb-2">
                      <span className="text-base-primary">{item.description} × {item.quantity} {item.unit}</span>
                      <span className="font-semibold text-base-primary">{fmtMoney(item.total)} {viewing.currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'التسعير' : 'Pricing'}</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-base-muted">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-semibold text-base-primary">{fmtMoney(viewing.subtotal)}</span></div>
                  {viewing.discount_amount > 0 && <div className="flex justify-between"><span className="text-base-muted">{ar ? 'خصم' : 'Discount'}</span><span className="font-semibold text-red-500">-{fmtMoney(viewing.discount_amount)}</span></div>}
                  <div className="flex justify-between"><span className="text-base-muted">{ar ? `ضريبة ${viewing.vat_rate}%` : `Tax ${viewing.vat_rate}%`}</span><span className="font-semibold text-base-primary">{fmtMoney(viewing.tax_amount)}</span></div>
                  <div className="flex justify-between text-base font-black border-t border-base pt-1.5"><span>{ar ? 'الإجمالي' : 'Total'}</span><span className="text-yellow-accent">{fmtMoney(viewing.total)} {viewing.currency}</span></div>
                </div>
              </div>

              {/* Terms */}
              {Object.keys(viewing.terms || {}).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الشروط' : 'Terms'}</h4>
                  <div className="space-y-1.5 text-sm">
                    {Object.entries(viewing.terms).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k}><span className="text-base-muted">{defaultQuotationTerms[k] ? (ar ? defaultQuotationTerms[k].ar : defaultQuotationTerms[k].en) : k}: </span><span className="text-base-primary">{v}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {/* PO requirement */}
              {viewing.request_type === 'rental' && (
                <div className="p-3 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 text-sm font-semibold text-yellow-accent">
                  {ar ? PO_REQUIREMENT_AR : PO_REQUIREMENT_EN}
                </div>
              )}

              {/* Actions */}
              {viewing.status === 'sent' && (
                <div className="space-y-3 pt-3 border-t border-base">
                  {actionError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {actionError}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAccept(viewing)} disabled={actionLoading} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {ar ? 'قبول العرض' : 'Accept Quotation'}
                    </button>
                    <button onClick={() => setRejecting(viewing)} className="px-4 py-2.5 rounded-lg border-2 border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500/10 flex items-center gap-2">
                      <X size={16} /> {ar ? 'رفض العرض' : 'Reject Quotation'}
                    </button>
                  </div>
                </div>
              )}

              {viewing.status === 'accepted' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500">
                  {ar ? 'تم قبول هذا العرض — جاهز لمرحلة التعاقد' : 'This quotation was accepted — ready for contract stage'}
                </div>
              )}
              {renderPoBlock(viewing)}
            </div>
          </div>
        </div>
      )}

      {uploadingFor && user && (
        <PoUploadModal
          quotation={uploadingFor}
          userId={user.id}
          onClose={() => setUploadingFor(null)}
          onDone={() => {
            setUploadingFor(null);
            setViewing(null);
            setPoNotice(ar ? 'تم رفع أمر الشراء. سيراجعه فريق سحاب ويُصدر عقد التأجير للتوقيع.' : 'PO uploaded. SAHAB will review it and issue the rental contract for signing.');
            loadQuotations();
          }}
        />
      )}

      {/* Print view */}
      {printing && (
        <DBPrintableQuotation quotation={printing} onClose={() => setPrinting(null)} />
      )}
    </div>
  );
}
