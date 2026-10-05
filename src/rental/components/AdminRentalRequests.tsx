import { useState } from 'react';
import { Search, Filter, Eye, X, StickyNote, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRental } from '@/rental/RentalContext';
import { useCatalogData } from '@/catalog/useCatalogData';
import { statusLabels, statusColors, durationLabels, allStatuses } from '@/rental/types';
import type { RentalRequestRow, RentalRequestStatus } from '@/rental/types';

export default function AdminRentalRequests() {
  const { lang } = useApp();
  const { requests, loading, error, updateStatus, updateInternalNotes } = useRental();
  const { models: catalogModels } = useCatalogData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<RentalRequestRow | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const ar = lang === 'ar';

  const filtered = requests.filter((r) => {
    const matchSearch = !search ||
      r.request_reference.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetails = (req: RentalRequestRow) => {
    setViewing(req);
    setInternalNote(req.internal_notes);
  };

  const changeStatus = async (status: RentalRequestStatus) => {
    if (!viewing) return;
    setSavingStatus(true);
    try {
      await updateStatus(viewing.id, status);
      setViewing({ ...viewing, status });
    } catch {
      // error shown via context
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    if (!viewing) return;
    setSavingNotes(true);
    try {
      await updateInternalNotes(viewing.id, internalNote);
    } catch {
      // error shown via context
    } finally {
      setSavingNotes(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const formatDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  const equipmentName = (r: RentalRequestRow) => ar ? r.equipment_name_ar : r.equipment_name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
          <Package size={28} className="text-yellow-accent" />
          {ar ? 'طلبات تأجير المعدات' : 'Equipment Rental Requests'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${filtered.length} طلب` : `${filtered.length} requests`}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الطلب أو الاسم أو الشركة...' : 'Search by reference, name, or company...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <select className={`${inputClass} ps-10`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
              {allStatuses.map((s) => <option key={s} value={s}>{ar ? statusLabels[s].ar : statusLabels[s].en}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-yellow-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات' : 'No requests'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <button key={req.id} onClick={() => openDetails(req)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{req.request_reference}</span>
                    <span className="text-xs text-base-muted">• {formatDate(req.created_at)}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{equipmentName(req)}</div>
                  <div className="text-xs text-base-muted">
                    {req.customer_name} • {req.company_name || '—'} • {req.phone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[req.status]}`}>
                    {ar ? statusLabels[req.status].ar : statusLabels[req.status].en}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.request_reference}</h3>
                <p className="text-xs text-base-muted">{viewing.customer_name} • {formatDate(viewing.created_at)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Equipment */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'المعدات المطلوبة' : 'Requested Equipment'}</h4>
                <div className="p-3 rounded-lg bg-base border border-base text-sm">
                  <div className="font-semibold text-base-primary">{ar ? viewing.equipment_name_ar : viewing.equipment_name}</div>
                  {viewing.equipment_model_id && (
                    <div className="text-xs text-base-muted mt-1">
                      {(catalogModels.find((m) => m.id === viewing.equipment_model_id)) 
                        ? (ar ? 'مرتبط بسجل المعدات في الكتالوج' : 'Linked to catalog equipment record')
                        : `Model ID: ${viewing.equipment_model_id}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'بيانات العميل' : 'Customer Information'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الاسم' : 'Name'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الجوال' : 'Phone'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.phone}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البريد' : 'Email'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.email || '—'}</span></div>
                </div>
              </div>

              {/* Rental info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'تفاصيل الإيجار' : 'Rental Details'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'مدة الإيجار' : 'Rental Period'}: </span><span className="font-semibold text-base-primary">{ar ? durationLabels[viewing.rental_period].ar : durationLabels[viewing.rental_period].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'تاريخ البدء' : 'Start Date'}: </span><span className="font-semibold text-base-primary">{viewing.requested_start_date || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدينة' : 'City'}: </span><span className="font-semibold text-base-primary">{viewing.project_city || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{viewing.project_location || '—'}</span></div>
                </div>
              </div>

              {/* Notes */}
              {viewing.notes && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملاحظات العميل' : 'Customer Notes'}</h4>
                  <div className="text-sm text-base-primary p-3 rounded-lg bg-base border border-base">{viewing.notes}</div>
                </div>
              )}

              {/* Dates */}
              <div className="text-xs text-base-muted flex justify-between">
                <span>{ar ? 'تاريخ الإنشاء' : 'Created'}: {formatDate(viewing.created_at)}</span>
                <span>{ar ? 'آخر تحديث' : 'Updated'}: {formatDate(viewing.updated_at)}</span>
              </div>

              {/* Status change */}
              <div className="pt-3 border-t border-base">
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                <div className="flex items-center gap-2">
                  <select className={inputClass} value={viewing.status} onChange={(e) => changeStatus(e.target.value as RentalRequestStatus)} disabled={savingStatus}>
                    {allStatuses.map((s) => <option key={s} value={s}>{ar ? statusLabels[s].ar : statusLabels[s].en}</option>)}
                  </select>
                  {savingStatus && <Loader2 size={16} className="animate-spin text-yellow-accent" />}
                </div>
              </div>

              {/* Internal notes - admin only */}
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5 flex items-center gap-1">
                  <StickyNote size={12} />
                  {ar ? 'ملاحظات داخلية (لا تظهر للعميل)' : 'Internal Notes (not visible to customer)'}
                </label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder={ar ? 'ملاحظات إدارية...' : 'Admin notes...'} />
                <button onClick={saveNotes} disabled={savingNotes} className="btn-primary text-xs mt-2 flex items-center gap-2">
                  {savingNotes && <Loader2 size={14} className="animate-spin" />}
                  {ar ? 'حفظ الملاحظات' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
