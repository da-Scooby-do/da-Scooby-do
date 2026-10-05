import { useState, useRef } from 'react';
import { Search, Filter, Eye, X, FileText, Plus, Upload, Loader2, AlertCircle, Download, History, Package } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePurchaseOrder } from '@/purchase-orders/PurchaseOrderContext';
import { useQuotation } from '@/quotation/QuotationContext';
import { useEmployee } from '@/admin/EmployeeContext';
import { poStatusLabels, poStatusColors, allPOStatuses } from '@/purchase-orders/types';
import type { PurchaseOrderRow, POStatus, POHistoryRow, CreatePOPayload } from '@/purchase-orders/types';
import type { QuotationWithItems } from '@/quotation/types';

export default function AdminPurchaseOrders() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { purchaseOrders, loading, error, createPO, updatePO, updatePOStatus, deletePO, uploadPODocument, getPODocumentUrl, getPOHistory } = usePurchaseOrder();
  const { dbQuotations, getDBQuotation } = useQuotation();
  const { can } = useEmployee();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewing, setViewing] = useState<PurchaseOrderRow | null>(null);
  const [history, setHistory] = useState<POHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const canCreate = can('contracts', 'create') || can('quotations', 'create') || can('contracts', 'manage');
  const canEdit = can('contracts', 'edit') || can('quotations', 'edit') || can('contracts', 'manage') || can('quotations', 'manage');
  const canManage = can('contracts', 'manage') || can('quotations', 'manage');

  const customerIds = Array.from(new Set(purchaseOrders.map((p) => p.customer_name)));

  const filtered = purchaseOrders.filter((p) => {
    const matchSearch = !search ||
      p.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.quotation_reference || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchCustomer = customerFilter === 'all' || p.customer_name === customerFilter;
    const matchDate = !dateFilter || p.po_date === dateFilter;
    return matchSearch && matchStatus && matchCustomer && matchDate;
  });

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const loadHistory = async (id: string) => {
    setHistoryLoading(true);
    try { setHistory(await getPOHistory(id)); } catch { setHistory([]); } finally { setHistoryLoading(false); }
  };

  const openView = (p: PurchaseOrderRow) => {
    setViewing(p);
    loadHistory(p.id);
    setDocUrl(null);
    if (p.document_path) {
      getPODocumentUrl(p.document_path).then(setDocUrl).catch(() => setDocUrl(null));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewing) return;
    setUploading(true);
    try {
      await uploadPODocument(viewing.id, file);
      const updated = purchaseOrders.find((p) => p.id === viewing.id);
      if (updated) setViewing({ ...updated, status: 'received', document_path: `${viewing.id}.${file.name.split('.').pop()}`, document_name: file.name });
      loadHistory(viewing.id);
    } catch { /* error */ } finally { setUploading(false); }
  };

  const handleChangeStatus = async (status: POStatus) => {
    if (!viewing) return;
    setStatusChanging(true);
    try {
      await updatePOStatus(viewing.id, status);
      setViewing({ ...viewing, status });
      loadHistory(viewing.id);
    } catch { /* error */ } finally { setStatusChanging(false); }
  };

  // Find the related quotation to compare amounts
  const relatedQuotation = viewing?.quotation_id ? dbQuotations.find((q) => q.id === viewing.quotation_id) : null;
  const amountMismatch = relatedQuotation && viewing && Math.abs(relatedQuotation.total - viewing.amount) > 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Package size={28} className="text-yellow-accent" />
            {ar ? 'أوامر الشراء' : 'Purchase Orders'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${filtered.length} أمر شراء` : `${filtered.length} purchase orders`}</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> {ar ? 'إضافة أمر شراء' : 'Add Purchase Order'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الأمر أو العميل...' : 'Search by PO# or customer...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allPOStatuses.map((s) => <option key={s} value={s}>{ar ? poStatusLabels[s].ar : poStatusLabels[s].en}</option>)}
          </select>
          <select className={inputClass} value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="all">{ar ? 'كل العملاء' : 'All customers'}</option>
            {customerIds.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" className={inputClass} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد أوامر شراء' : 'No purchase orders'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => openView(p)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{p.po_number}</span>
                    <span className="text-xs text-base-muted">• {fmtDate(p.po_date)}</span>
                    {p.document_path && <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-500 font-semibold">{ar ? 'مستند' : 'Doc'}</span>}
                  </div>
                  <div className="text-sm font-bold text-base-primary">{p.customer_name} • {p.company_name || '—'}</div>
                  <div className="text-xs text-base-muted">{ar ? 'العرض' : 'Quotation'}: {p.quotation_reference || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <div className="text-sm font-black text-base-primary">{fmtMoney(p.amount)} <span className="text-xs font-normal text-base-muted">{p.currency}</span></div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${poStatusColors[p.status as POStatus]}`}>
                    {ar ? poStatusLabels[p.status as POStatus].ar : poStatusLabels[p.status as POStatus].en}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <POCreateModal ar={ar} inputClass={inputClass} quotations={dbQuotations.filter((q) => q.status === 'accepted')} onClose={() => setCreating(false)}
          onCreate={async (payload) => { await createPO(payload); setCreating(false); }}
          getQuotation={getDBQuotation}
        />
      )}

      {/* Detail modal */}
      {viewing && !creating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.po_number}</h3>
                <p className="text-xs text-base-muted">{viewing.customer_name} • {fmtDate(viewing.po_date)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${poStatusColors[viewing.status as POStatus]}`}>
                  {ar ? poStatusLabels[viewing.status as POStatus].ar : poStatusLabels[viewing.status as POStatus].en}
                </span>
                <span className="text-xs text-base-muted">{viewing.currency}</span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'المبلغ' : 'Amount'}: </span><span className="font-semibold text-base-primary">{fmtMoney(viewing.amount)} {viewing.currency}</span></div>
                <div><span className="text-base-muted">{ar ? 'التاريخ' : 'Date'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.po_date)}</span></div>
                <div><span className="text-base-muted">{ar ? 'العرض' : 'Quotation'}: </span><span className="font-semibold text-base-primary">{viewing.quotation_reference || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الطلب' : 'Request'}: </span><span className="font-semibold text-base-primary">{viewing.request_reference || '—'}</span></div>
              </div>

              {/* Amount mismatch warning */}
              {amountMismatch && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-500 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {ar ? 'يوجد اختلاف بين قيمة العرض وقيمة أمر الشراء.' : 'There is a discrepancy between the quotation amount and the PO amount.'}
                  <span className="font-semibold">({fmtMoney(relatedQuotation!.total)} vs {fmtMoney(viewing.amount)})</span>
                </div>
              )}

              {/* Notes */}
              {viewing.notes && (
                <div><span className="text-xs text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span><span className="text-sm text-base-primary">{viewing.notes}</span></div>
              )}

              {/* Document upload */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'مستند أمر الشراء' : 'PO Document'}</h4>
                {viewing.document_path ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-base-primary">{viewing.document_name}</span>
                    {docUrl && <a href={docUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1.5"><Download size={14} /> {ar ? 'تحميل' : 'Download'}</a>}
                    {canEdit && <button onClick={() => fileRef.current?.click()} className="text-xs text-yellow-accent hover:underline">{ar ? 'استبدال' : 'Replace'}</button>}
                  </div>
                ) : (
                  <div>
                    {canEdit && <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary text-sm flex items-center gap-2">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {ar ? 'رفع المستند' : 'Upload Document'}
                    </button>}
                    <p className="text-xs text-base-muted mt-2">{ar ? 'PDF, JPG, PNG' : 'PDF, JPG, PNG'}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
              </div>

              {/* Status change */}
              {canEdit && (
                <div className="pt-3 border-t border-base">
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                  <div className="flex items-center gap-2">
                    <select className={inputClass} value={viewing.status} onChange={(e) => handleChangeStatus(e.target.value as POStatus)} disabled={statusChanging}>
                      {allPOStatuses.map((s) => <option key={s} value={s}>{ar ? poStatusLabels[s].ar : poStatusLabels[s].en}</option>)}
                    </select>
                    {statusChanging && <Loader2 size={16} className="animate-spin text-yellow-accent" />}
                  </div>
                </div>
              )}

              {/* History */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3 flex items-center gap-1.5"><History size={14} /> {ar ? 'السجل' : 'History'}</h4>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-base-muted"><Loader2 size={14} className="animate-spin" /> {ar ? 'جاري...' : 'Loading...'}</div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-base-muted">{ar ? 'لا يوجد سجل' : 'No history'}</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="text-sm p-2 rounded-lg bg-base border border-base">
                        <div className="font-semibold text-base-primary">{h.action}: {h.previous_status || '—'} → {h.new_status || '—'}</div>
                        <div className="text-xs text-base-muted">{h.performed_by_name && `${ar ? 'بواسطة' : 'By'}: ${h.performed_by_name} • `}{fmtDate(h.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PO Create Modal ───────────────────────────────────────
function POCreateModal({ ar, inputClass, quotations, onClose, onCreate, getQuotation }: {
  ar: boolean;
  inputClass: string;
  quotations: Array<{ id: string; quotation_reference: string; customer_name: string; company_name: string | null; total: number; currency: string; request_type: 'rental' | 'project'; request_id: string; request_reference: string | null }>;
  onClose: () => void;
  onCreate: (payload: CreatePOPayload) => Promise<void>;
  getQuotation: (id: string) => Promise<QuotationWithItems | null>;
}) {
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [amount, setAmount] = useState(0);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = quotations.find((q) => q.id === selectedQuotationId);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        request_type: selected.request_type,
        request_id: selected.request_id,
        request_reference: selected.request_reference || '',
        quotation_id: selected.id,
        quotation_reference: selected.quotation_reference,
        customer_name: selected.customer_name,
        company_name: selected.company_name || undefined,
        po_date: poDate,
        amount,
        currency: selected.currency,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PO');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><Package size={20} className="text-yellow-accent" /> {ar ? 'إضافة أمر شراء' : 'Add Purchase Order'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">{error}</div>}
          {quotations.length === 0 ? (
            <p className="text-sm text-base-muted text-center py-8">{ar ? 'لا توجد عروض أسعار مقبولة. يجب قبول عرض سعر أولاً.' : 'No accepted quotations available. A quotation must be accepted first.'}</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'عرض السعر المقبول' : 'Accepted Quotation'}</label>
                <select className={inputClass} value={selectedQuotationId} onChange={(e) => {
                  setSelectedQuotationId(e.target.value);
                  const q = quotations.find((qq) => qq.id === e.target.value);
                  if (q) setAmount(q.total);
                }}>
                  <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                  {quotations.map((q) => <option key={q.id} value={q.id}>{q.quotation_reference} — {q.customer_name} — {q.total.toLocaleString()} {q.currency}</option>)}
                </select>
              </div>
              {selected && (
                <div className="card-industrial p-3 bg-black/5 dark:bg-white/5 text-sm space-y-1">
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold">{selected.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold">{selected.company_name || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'قيمة العرض' : 'Quotation Total'}: </span><span className="font-semibold">{selected.total.toLocaleString()} {selected.currency}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'مبلغ أمر الشراء' : 'PO Amount'}</label>
                  <input type="number" min={0} step="any" className={inputClass} value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ الأمر' : 'PO Date'}</label>
                  <input type="date" className={inputClass} value={poDate} onChange={(e) => setPoDate(e.target.value)} />
                </div>
              </div>
              {selected && Math.abs(selected.total - amount) > 0.01 && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-500 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {ar ? 'يوجد اختلاف بين قيمة العرض وقيمة أمر الشراء.' : 'Amount differs from quotation total.'}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'ملاحظات' : 'Notes'}</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave} disabled={!selectedQuotationId || saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                  {saving && <Loader2 size={16} className="animate-spin" />} {ar ? 'حفظ' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
