import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, FileText, Plus, Send, Ban, Printer, Loader2, AlertCircle, Copy, Trash2, History } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useQuotation } from '@/quotation/QuotationContext';
import { useRental } from '@/rental/RentalContext';
import { useProject } from '@/project/ProjectContext';
import { useEmployee } from '@/admin/EmployeeContext';
import {
  dbQuotationStatusLabels, dbQuotationStatusColors, allQuotationDBStatuses,
} from '@/quotation/types';
import type { QuotationRow, QuotationWithItems, QuotationDBStatus, QuotationHistoryRow } from '@/quotation/types';
import type { RentalRequestRow } from '@/rental/types';
import type { ProjectRequestRow } from '@/project/types';
import DBQuotationForm from '@/quotation/components/DBQuotationForm';
import DBPrintableQuotation from '@/quotation/components/DBPrintableQuotation';

type SelectedRequest = { type: 'rental' | 'project'; request: RentalRequestRow | ProjectRequestRow };

export default function AdminQuotations() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { dbQuotations, dbLoading, dbError, updateDBQuotationStatus, deleteDBQuotation, reviseDBQuotation, getDBQuotation, getDBQuotationHistory } = useQuotation();
  const { requests: rentalRequests } = useRental();
  const { dbRequests: projectRequests } = useProject();
  const { can } = useEmployee();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing] = useState<QuotationWithItems | null>(null);
  const [history, setHistory] = useState<QuotationHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<QuotationWithItems | null>(null);
  const [printing, setPrinting] = useState<QuotationWithItems | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [newFromRequest, setNewFromRequest] = useState<SelectedRequest | null>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = dbQuotations.filter((q) => {
    const matchSearch = !search ||
      q.quotation_reference?.toLowerCase().includes(search.toLowerCase()) ||
      q.request_reference?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (q.company_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchType = typeFilter === 'all' || q.request_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const loadHistory = async (id: string) => {
    setHistoryLoading(true);
    try {
      const h = await getDBQuotationHistory(id);
      setHistory(h);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openView = async (q: QuotationRow) => {
    const full = await getDBQuotation(q.id);
    if (full) {
      setViewing(full);
      loadHistory(q.id);
      setRejectReason('');
      setShowRejectBox(false);
    }
  };

  const handleChangeStatus = async (newStatus: QuotationDBStatus) => {
    if (!viewing) return;
    if (newStatus === 'rejected' && !rejectReason.trim()) {
      setShowRejectBox(true);
      return;
    }
    setStatusChanging(true);
    try {
      await updateDBQuotationStatus(viewing.id, newStatus, newStatus === 'rejected' ? rejectReason : undefined);
      const updated = await getDBQuotation(viewing.id);
      if (updated) setViewing(updated);
      loadHistory(viewing.id);
      setShowRejectBox(false);
    } catch {
      // error shown via context
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!viewing) return;
    try {
      await deleteDBQuotation(viewing.id);
      setViewing(null);
    } catch {
      // error
    }
  };

  const handleRevise = async () => {
    if (!viewing) return;
    try {
      const revised = await reviseDBQuotation(viewing.id);
      if (revised) {
        setEditing(revised);
        setViewing(null);
      }
    } catch {
      // error
    }
  };

  const isLocked = viewing && (viewing.status === 'sent' || viewing.status === 'accepted' || viewing.status === 'rejected' || viewing.status === 'cancelled' || viewing.status === 'expired');
  const canEdit = can('quotations', 'edit') || can('quotations', 'manage');
  const canCreate = can('quotations', 'create') || can('quotations', 'manage');
  const canDelete = can('quotations', 'delete') || can('quotations', 'manage');
  const canManage = can('quotations', 'manage');

  // Find related request for creating quotation
  const availableRentalRequests = rentalRequests.filter((r) => r.status === 'approved' || r.status === 'reviewing' || r.status === 'contacted');
  const availableProjectRequests = projectRequests.filter((p) => p.status === 'approved' || p.status === 'under_review' || p.status === 'contacted' || p.status === 'quotation_preparing');

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const fmtDateTime = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <FileText size={28} className="text-yellow-accent" />
            {ar ? 'عروض الأسعار' : 'Quotations'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${filtered.length} عرض سعر` : `${filtered.length} quotations`}</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> {ar ? 'إنشاء عرض سعر' : 'Create Quotation'}
          </button>
        )}
      </div>

      {/* Error */}
      {dbError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {dbError}
        </div>
      )}

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم العرض أو الطلب...' : 'Search by quote or request #...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الأنواع' : 'All types'}</option>
            <option value="rental">{ar ? 'تأجير معدات' : 'Equipment Rental'}</option>
            <option value="project">{ar ? 'مشروع / خدمة' : 'Project / Service'}</option>
          </select>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allQuotationDBStatuses.map((s) => <option key={s} value={s}>{ar ? dbQuotationStatusLabels[s].ar : dbQuotationStatusLabels[s].en}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {dbLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عروض أسعار' : 'No quotations'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <button key={q.id} onClick={() => openView(q)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{q.quotation_reference}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${q.request_type === 'rental' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-teal-500/10 text-teal-500'}`}>
                      {q.request_type === 'rental' ? (ar ? 'تأجير' : 'Rental') : (ar ? 'مشروع' : 'Project')}
                    </span>
                    {q.version > 1 && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 font-semibold">v{q.version}</span>}
                    <span className="text-xs text-base-muted">• {fmtDate(q.issue_date)}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{q.customer_name} • {q.company_name || '—'}</div>
                  <div className="text-xs text-base-muted">{ar ? 'الطلب' : 'Request'}: {q.request_reference || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <div className="text-sm font-black text-base-primary">{fmtMoney(q.total)} <span className="text-xs font-normal text-base-muted">{q.currency}</span></div>
                    <div className="text-xs text-base-muted">{ar ? 'ينتهي' : 'Expires'}: {fmtDate(q.expiry_date)}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${dbQuotationStatusColors[q.status as QuotationDBStatus]}`}>
                    {ar ? dbQuotationStatusLabels[q.status as QuotationDBStatus].ar : dbQuotationStatusLabels[q.status as QuotationDBStatus].en}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create modal — pick a request first */}
      {creating && (
        <RequestPicker
          ar={ar}
          inputClass={inputClass}
          rentalRequests={availableRentalRequests}
          projectRequests={availableProjectRequests}
          onClose={() => setCreating(false)}
          onSelect={(type, req) => {
            setCreating(false);
            setEditing(null);
            setNewFromRequest({ type, request: req });
          }}
        />
      )}

      {/* Edit/Create form */}
      {editing && (
        <DBQuotationForm
          requestType={editing.request_type}
          request={editing.request_type === 'rental'
            ? rentalRequests.find((r) => r.id === editing.request_id) || projectRequests.find((p) => p.id === editing.request_id) as unknown as RentalRequestRow
            : projectRequests.find((p) => p.id === editing.request_id) || rentalRequests.find((r) => r.id === editing.request_id) as unknown as ProjectRequestRow}
          existing={editing}
          onClose={() => { setEditing(null); }}
          onSaved={() => { setEditing(null); }}
        />
      )}

      {/* New from request form */}
      {newFromRequest && !editing && (
        <DBQuotationForm
          requestType={newFromRequest.type}
          request={newFromRequest.request}
          onClose={() => setNewFromRequest(null)}
          onSaved={() => setNewFromRequest(null)}
        />
      )}

      {/* Print view */}
      {printing && (
        <DBPrintableQuotation quotation={printing} onClose={() => setPrinting(null)} />
      )}

      {/* Detail modal */}
      {viewing && !editing && !printing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.quotation_reference}</h3>
                  {viewing.version > 1 && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 font-semibold">v{viewing.version}</span>}
                </div>
                <p className="text-xs text-base-muted">{viewing.request_reference} • {fmtDate(viewing.issue_date)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${dbQuotationStatusColors[viewing.status]}`}>
                  {ar ? dbQuotationStatusLabels[viewing.status].ar : dbQuotationStatusLabels[viewing.status].en}
                </span>
                <span className="text-xs text-base-muted">{viewing.currency} • {ar ? 'ضريبة' : 'VAT'} {viewing.vat_rate}%</span>
              </div>

              {/* Customer */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'بيانات العميل' : 'Customer'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الهاتف' : 'Phone'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.customer_phone}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البريد' : 'Email'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.customer_email || '—'}</span></div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'البنود' : 'Items'} ({viewing.items.length})</h4>
                <div className="space-y-2">
                  {viewing.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-base pb-2">
                      <span className="text-base-primary">{it.description} × {it.quantity} {it.unit}</span>
                      <span className="font-semibold text-base-primary">{fmtMoney(it.total)} {viewing.currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-base-muted">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-semibold text-base-primary">{fmtMoney(viewing.subtotal)}</span></div>
                {viewing.discount_amount > 0 && <div className="flex justify-between"><span className="text-base-muted">{ar ? 'خصم' : 'Discount'}</span><span className="font-semibold text-red-500">-{fmtMoney(viewing.discount_amount)}</span></div>}
                <div className="flex justify-between"><span className="text-base-muted">{ar ? `ضريبة ${viewing.vat_rate}%` : `Tax ${viewing.vat_rate}%`}</span><span className="font-semibold text-base-primary">{fmtMoney(viewing.tax_amount)}</span></div>
                <div className="flex justify-between text-base font-black border-t border-base pt-1.5"><span>{ar ? 'الإجمالي' : 'Grand Total'}</span><span className="text-yellow-accent">{fmtMoney(viewing.total)} {viewing.currency}</span></div>
              </div>

              {/* Terms */}
              {Object.keys(viewing.terms || {}).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الشروط' : 'Terms'}</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(viewing.terms).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="text-base-primary"><span className="text-base-muted">{k}: </span>{v}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject reason */}
              {viewing.status === 'rejected' && viewing.reject_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                  {ar ? 'سبب الرفض' : 'Reject reason'}: {viewing.reject_reason}
                </div>
              )}

              {/* Status history */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3 flex items-center gap-1.5">
                  <History size={14} /> {ar ? 'سجل العرض' : 'Quotation History'}
                </h4>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-base-muted"><Loader2 size={14} className="animate-spin" /> {ar ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-base-muted">{ar ? 'لا يوجد سجل' : 'No history'}</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="text-sm p-2 rounded-lg bg-base border border-base">
                        <div className="font-semibold text-base-primary">
                          {h.action === 'created' ? (ar ? 'تم إنشاء العرض' : 'Quotation created')
                            : h.action === 'status_changed' ? `${h.previous_status || '—'} → ${h.new_status || '—'}`
                            : h.action}
                        </div>
                        <div className="text-xs text-base-muted">
                          {h.performed_by_name && <span>{ar ? 'بواسطة' : 'By'}: {h.performed_by_name} • </span>}
                          {fmtDateTime(h.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-base">
                {viewing.status === 'draft' && canEdit && (
                  <button onClick={() => { setEditing(viewing); }} className="btn-primary text-xs flex items-center gap-1.5">
                    {ar ? 'تعديل' : 'Edit'}
                  </button>
                )}
                {viewing.status === 'ready_to_send' && canEdit && (
                  <button onClick={() => { setEditing(viewing); }} className="btn-primary text-xs flex items-center gap-1.5">
                    {ar ? 'تعديل' : 'Edit'}
                  </button>
                )}
                {(viewing.status === 'draft' || viewing.status === 'ready_to_send') && canEdit && (
                  <button onClick={() => handleChangeStatus('sent')} disabled={statusChanging} className="btn-secondary text-xs flex items-center gap-1.5">
                    {statusChanging ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {ar ? 'إرسال' : 'Send'}
                  </button>
                )}
                {isLocked && canEdit && (
                  <button onClick={handleRevise} className="btn-secondary text-xs flex items-center gap-1.5">
                    <Copy size={14} /> {ar ? 'إنشاء نسخة جديدة' : 'Create Revision'}
                  </button>
                )}
                {(viewing.status === 'sent') && canManage && (
                  <button onClick={() => handleChangeStatus('accepted')} disabled={statusChanging} className="px-3 py-2 rounded-lg border border-green-500/30 text-green-500 text-xs font-bold hover:bg-green-500/10">
                    {ar ? 'مقبول' : 'Accept'}
                  </button>
                )}
                {(viewing.status === 'sent') && canManage && (
                  <button onClick={() => setShowRejectBox(!showRejectBox)} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10">
                    {ar ? 'مرفوض' : 'Reject'}
                  </button>
                )}
                {showRejectBox && (
                  <div className="w-full space-y-2">
                    <input className={inputClass} placeholder={ar ? 'سبب الرفض...' : 'Reject reason...'} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    <button onClick={() => handleChangeStatus('rejected')} disabled={!rejectReason.trim() || statusChanging} className="btn-primary text-xs">
                      {ar ? 'تأكيد الرفض' : 'Confirm Reject'}
                    </button>
                  </div>
                )}
                {viewing.status !== 'cancelled' && viewing.status !== 'accepted' && canEdit && (
                  <button onClick={() => handleChangeStatus('cancelled')} disabled={statusChanging} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 flex items-center gap-1.5">
                    <Ban size={14} /> {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                )}
                {viewing.status === 'draft' && canDelete && (
                  <button onClick={handleDelete} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 flex items-center gap-1.5">
                    <Trash2 size={14} /> {ar ? 'حذف' : 'Delete'}
                  </button>
                )}
                <button onClick={() => { setPrinting(viewing); }} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Printer size={14} /> {ar ? 'طباعة' : 'Print'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Use a wrapper component for request selection
function RequestPicker({ ar, inputClass, rentalRequests, projectRequests, onClose, onSelect }: {
  ar: boolean;
  inputClass: string;
  rentalRequests: RentalRequestRow[];
  projectRequests: ProjectRequestRow[];
  onClose: () => void;
  onSelect: (type: 'rental' | 'project', req: RentalRequestRow | ProjectRequestRow) => void;
}) {
  const [selectedType, setSelectedType] = useState<'rental' | 'project' | ''>('');

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary">{ar ? 'اختر طلب لإنشاء عرض سعر' : 'Select a Request to Quote'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSelectedType('rental')} className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${selectedType === 'rental' ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted'}`}>
              {ar ? 'تأجير معدات' : 'Equipment Rental'}
            </button>
            <button onClick={() => setSelectedType('project')} className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${selectedType === 'project' ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted'}`}>
              {ar ? 'مشروع / خدمة' : 'Project / Service'}
            </button>
          </div>

          {selectedType === 'rental' && (
            <div className="space-y-2">
              {rentalRequests.length === 0 ? (
                <p className="text-sm text-base-muted text-center py-4">{ar ? 'لا توجد طلبات تأجير متاحة' : 'No rental requests available'}</p>
              ) : rentalRequests.map((r) => (
                <button key={r.id} onClick={() => onSelect('rental', r)} className="card-industrial p-3 w-full text-start hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-yellow-accent">{r.request_reference}</div>
                      <div className="text-sm font-semibold text-base-primary">{ar ? r.equipment_name_ar : r.equipment_name}</div>
                      <div className="text-xs text-base-muted">{r.customer_name} • {r.company_name || '—'}</div>
                    </div>
                    <span className="text-xs text-base-muted">{fmtDate(r.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedType === 'project' && (
            <div className="space-y-2">
              {projectRequests.length === 0 ? (
                <p className="text-sm text-base-muted text-center py-4">{ar ? 'لا توجد طلبات مشاريع متاحة' : 'No project requests available'}</p>
              ) : projectRequests.map((p) => (
                <button key={p.id} onClick={() => onSelect('project', p)} className="card-industrial p-3 w-full text-start hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-yellow-accent">{p.request_reference}</div>
                      <div className="text-sm font-semibold text-base-primary">{p.project_description.substring(0, 50)}...</div>
                      <div className="text-xs text-base-muted">{p.customer_name} • {p.company_name || '—'}</div>
                    </div>
                    <span className="text-xs text-base-muted">{fmtDate(p.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!selectedType && (
            <p className="text-sm text-base-muted text-center py-8">{ar ? 'اختر نوع الطلب للمتابعة' : 'Select a request type to continue'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
