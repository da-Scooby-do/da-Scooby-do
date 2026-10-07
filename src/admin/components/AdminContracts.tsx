import { useState, useRef } from 'react';
import { Search, Filter, Eye, X, FileText, Plus, Upload, Loader2, AlertCircle, Download, History, PenTool, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useContract } from '@/contract/ContractContext';
import { useQuotation } from '@/quotation/QuotationContext';
import { usePurchaseOrder } from '@/purchase-orders/PurchaseOrderContext';
import { useEmployee } from '@/admin/EmployeeContext';
import { dbContractStatusLabels, dbContractStatusColors, allContractDBStatuses } from '@/contract/types';
import type { ContractRow, ContractDBStatus, ContractHistoryRow, CreateContractPayload } from '@/contract/types';

export default function AdminContracts() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { dbContracts, dbLoading, dbError, createDBContract, updateDBContract, updateDBContractStatus, deleteDBContract, uploadContractDocument, getContractDocumentUrl, getDBContractHistory } = useContract();
  const { dbQuotations } = useQuotation();
  const { purchaseOrders } = usePurchaseOrder();
  const { can } = useEmployee();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewing, setViewing] = useState<ContractRow | null>(null);
  const [history, setHistory] = useState<ContractHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const canCreate = can('contracts', 'create') || can('contracts', 'manage');
  const canEdit = can('contracts', 'edit') || can('contracts', 'manage');
  const canManage = can('contracts', 'manage');

  const customerIds = Array.from(new Set(dbContracts.map((c) => c.customer_name)));

  const filtered = dbContracts.filter((c) => {
    const matchSearch = !search ||
      c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.title || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchCustomer = customerFilter === 'all' || c.customer_name === customerFilter;
    const matchDate = !dateFilter || c.start_date === dateFilter;
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
    try { setHistory(await getDBContractHistory(id)); } catch { setHistory([]); } finally { setHistoryLoading(false); }
  };

  const openView = (c: ContractRow) => {
    setViewing(c);
    loadHistory(c.id);
    setDocUrl(null);
    if (c.document_path) {
      getContractDocumentUrl(c.document_path).then(setDocUrl).catch(() => setDocUrl(null));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewing) return;
    setUploading(true);
    try {
      await uploadContractDocument(viewing.id, file);
      setViewing({ ...viewing, document_path: `${viewing.id}.${file.name.split('.').pop()}`, document_name: file.name });
      loadHistory(viewing.id);
    } catch { /* error */ } finally { setUploading(false); }
  };

  const handleChangeStatus = async (status: ContractDBStatus) => {
    if (!viewing) return;
    setStatusChanging(true);
    try {
      await updateDBContractStatus(viewing.id, status);
      setViewing({ ...viewing, status });
      loadHistory(viewing.id);
    } catch { /* error */ } finally { setStatusChanging(false); }
  };

  // Accepted quotations + accepted POs available for contract creation
  const acceptedQuotations = dbQuotations.filter((q) => q.status === 'accepted');
  const acceptedPOs = purchaseOrders.filter((p) => p.status === 'accepted');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <PenTool size={28} className="text-yellow-accent" />
            {ar ? 'العقود' : 'Contracts'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${filtered.length} عقد` : `${filtered.length} contracts`}</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> {ar ? 'إنشاء عقد' : 'Create Contract'}
          </button>
        )}
      </div>

      {dbError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {dbError}
        </div>
      )}

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم العقد أو العميل...' : 'Search by contract# or customer...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allContractDBStatuses.map((s) => <option key={s} value={s}>{ar ? dbContractStatusLabels[s].ar : dbContractStatusLabels[s].en}</option>)}
          </select>
          <select className={inputClass} value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="all">{ar ? 'كل العملاء' : 'All customers'}</option>
            {customerIds.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" className={inputClass} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {dbLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <PenTool size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عقود' : 'No contracts'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => openView(c)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{c.contract_number}</span>
                    {c.signed_at && <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-500 font-semibold">{ar ? 'موقّع' : 'Signed'}</span>}
                    <span className="text-xs text-base-muted">• {fmtDate(c.start_date)}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{c.title || c.customer_name} • {c.company_name || '—'}</div>
                  <div className="text-xs text-base-muted">{ar ? 'الطلب' : 'Request'}: {c.request_reference || '—'} • {ar ? 'العرض' : 'Quote'}: {c.quotation_reference || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <div className="text-sm font-black text-base-primary">{fmtMoney(c.contract_value)} <span className="text-xs font-normal text-base-muted">{c.currency}</span></div>
                    <div className="text-xs text-base-muted flex items-center gap-1"><Calendar size={10} /> {fmtDate(c.start_date)} → {fmtDate(c.end_date)}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbContractStatusColors[c.status as ContractDBStatus]}`}>
                    {ar ? dbContractStatusLabels[c.status as ContractDBStatus].ar : dbContractStatusLabels[c.status as ContractDBStatus].en}
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
        <ContractCreateModal ar={ar} inputClass={inputClass} quotations={acceptedQuotations} pos={acceptedPOs} onClose={() => setCreating(false)}
          onCreate={async (payload) => { await createDBContract(payload); setCreating(false); }} />
      )}

      {/* Detail modal */}
      {viewing && !creating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.contract_number}</h3>
                <p className="text-xs text-base-muted">{viewing.title || viewing.customer_name} • {fmtDate(viewing.start_date)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${dbContractStatusColors[viewing.status as ContractDBStatus]}`}>
                  {ar ? dbContractStatusLabels[viewing.status as ContractDBStatus].ar : dbContractStatusLabels[viewing.status as ContractDBStatus].en}
                </span>
                <span className="text-xs text-base-muted">{viewing.currency}</span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'العنوان' : 'Title'}: </span><span className="font-semibold text-base-primary">{viewing.title || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'قيمة العقد' : 'Value'}: </span><span className="font-semibold text-base-primary">{fmtMoney(viewing.contract_value)} {viewing.currency}</span></div>
                <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.start_date)}</span></div>
                <div><span className="text-base-muted">{ar ? 'الانتهاء' : 'End'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.end_date)}</span></div>
                <div><span className="text-base-muted">{ar ? 'الطلب' : 'Request'}: </span><span className="font-semibold text-base-primary">{viewing.request_reference || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'العرض' : 'Quotation'}: </span><span className="font-semibold text-base-primary">{viewing.quotation_reference || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'أمر الشراء' : 'PO'}: </span><span className="font-semibold text-base-primary">{viewing.po_number || '—'}</span></div>
              </div>

              {viewing.notes && <div><span className="text-xs text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span><span className="text-sm text-base-primary">{viewing.notes}</span></div>}

              {/* Customer signature */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'توقيع العميل' : 'Customer signature'}</h4>
                {viewing.signed_at ? (
                  <div className="flex flex-wrap items-center gap-4">
                    {viewing.signature_image && <img src={viewing.signature_image} alt={ar ? 'توقيع العميل' : 'Customer signature'} className="h-20 w-auto max-w-[240px] rounded-lg bg-white border border-base p-1" />}
                    <div className="text-sm">
                      <div className="font-semibold text-base-primary">{viewing.signed_by_name}{viewing.signed_by_title ? ` — ${viewing.signed_by_title}` : ''}</div>
                      <div className="text-xs text-base-muted">{new Date(viewing.signed_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-base-muted">
                      {!viewing.customer_email
                        ? (ar ? 'هذا العقد غير مرتبط بحساب عميل (لا يوجد بريد)، لذلك لا يمكن توقيعه من الموقع.' : 'This contract is not linked to a customer account (no email), so it cannot be signed online.')
                        : viewing.status === 'ready' || viewing.status === 'pending_signature'
                          ? (ar ? `بانتظار توقيع العميل من حسابه (${viewing.customer_email}).` : `Waiting for the customer to sign from their account (${viewing.customer_email}).`)
                          : (ar ? 'غيّر الحالة إلى «بانتظار التوقيع» ليظهر زر التوقيع للعميل في حسابه.' : 'Set the status to "Pending signature" so the customer can sign it from their account.')}
                    </p>
                    {canEdit && viewing.customer_email && viewing.status === 'draft' && (
                      <button onClick={() => handleChangeStatus('pending_signature')} disabled={statusChanging} className="btn-primary text-xs px-3 py-2">
                        <PenTool size={14} /> {ar ? 'إرسال للعميل للتوقيع' : 'Send to customer for signing'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Document upload */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'مستند العقد' : 'Contract Document'}</h4>
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
                      {ar ? 'رفع مستند العقد' : 'Upload contract document'}
                    </button>}
                    <p className="text-xs text-base-muted mt-2">{ar ? 'PDF, JPG, PNG — يظهر للعميل ليقرأه قبل التوقيع' : 'PDF, JPG, PNG — the customer reads it before signing'}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
              </div>

              {/* Status change */}
              {canEdit && (
                <div className="pt-3 border-t border-base">
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                  <div className="flex items-center gap-2">
                    <select className={inputClass} value={viewing.status} onChange={(e) => handleChangeStatus(e.target.value as ContractDBStatus)} disabled={statusChanging}>
                      {allContractDBStatuses.map((s) => <option key={s} value={s}>{ar ? dbContractStatusLabels[s].ar : dbContractStatusLabels[s].en}</option>)}
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

// ─── Contract Create Modal ─────────────────────────────────
function ContractCreateModal({ ar, inputClass, quotations, pos, onClose, onCreate }: {
  ar: boolean;
  inputClass: string;
  quotations: Array<{ id: string; quotation_reference: string; customer_name: string; company_name: string | null; total: number; currency: string; request_type: 'rental' | 'project'; request_id: string; request_reference: string | null }>;
  pos: Array<{ id: string; po_number: string; quotation_id: string | null; customer_name: string; amount: number; currency: string }>;
  onClose: () => void;
  onCreate: (payload: CreateContractPayload) => Promise<void>;
}) {
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [selectedPOId, setSelectedPOId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [contractValue, setContractValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = quotations.find((q) => q.id === selectedQuotationId);
  const availablePOs = pos.filter((p) => !selectedQuotationId || p.quotation_id === selectedQuotationId);
  const selectedPO = pos.find((p) => p.id === selectedPOId);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: title || `${selected.customer_name} — ${selected.quotation_reference}`,
        request_type: selected.request_type,
        request_id: selected.request_id,
        request_reference: selected.request_reference || undefined,
        quotation_id: selected.id,
        quotation_reference: selected.quotation_reference,
        purchase_order_id: selectedPO?.id,
        po_number: selectedPO?.po_number,
        customer_name: selected.customer_name,
        company_name: selected.company_name || undefined,
        start_date: startDate,
        end_date: endDate || undefined,
        contract_value: contractValue || selected.total,
        currency: selected.currency,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><PenTool size={20} className="text-yellow-accent" /> {ar ? 'إنشاء عقد' : 'Create Contract'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">{error}</div>}
          {quotations.length === 0 ? (
            <p className="text-sm text-base-muted text-center py-8">{ar ? 'لا توجد عروض أسعار مقبولة.' : 'No accepted quotations available.'}</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'عرض السعر المقبول' : 'Accepted Quotation'}</label>
                <select className={inputClass} value={selectedQuotationId} onChange={(e) => {
                  setSelectedQuotationId(e.target.value);
                  setSelectedPOId('');
                  const q = quotations.find((qq) => qq.id === e.target.value);
                  if (q) { setContractValue(q.total); setTitle(`${q.customer_name} — ${q.quotation_reference}`); }
                }}>
                  <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                  {quotations.map((q) => <option key={q.id} value={q.id}>{q.quotation_reference} — {q.customer_name} — {q.total.toLocaleString()}</option>)}
                </select>
              </div>

              {availablePOs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'أمر الشراء (اختياري)' : 'Purchase Order (optional)'}</label>
                  <select className={inputClass} value={selectedPOId} onChange={(e) => setSelectedPOId(e.target.value)}>
                    <option value="">{ar ? '— بدون —' : '— None —'}</option>
                    {availablePOs.map((p) => <option key={p.id} value={p.id}>{p.po_number} — {p.amount.toLocaleString()} {p.currency}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'العنوان' : 'Title'}</label>
                <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'قيمة العقد' : 'Contract Value'}</label>
                <input type="number" min={0} step="any" className={inputClass} value={contractValue} onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)} />
              </div>

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
