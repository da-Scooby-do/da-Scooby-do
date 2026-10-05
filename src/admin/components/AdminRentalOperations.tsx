import { useState } from 'react';
import { Search, Eye, X, Plus, Loader2, AlertCircle, Truck, PackageCheck, History, KeyRound, Undo2, FileText, CalendarPlus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRentalOperation } from '@/rental-operations/RentalOperationContext';
import { useRental } from '@/rental/RentalContext';
import { useQuotation } from '@/quotation/QuotationContext';
import { usePurchaseOrder } from '@/purchase-orders/PurchaseOrderContext';
import { useContract } from '@/contract/ContractContext';
import { useEmployee } from '@/admin/EmployeeContext';
import {
  rentalOpStatusLabels, rentalOpStatusColors, allRentalOpStatuses, statusTransitions,
  transportLabels, fuelLabels, durationLabels, allDurations, MAX_EXTENSION_MONTHS, durationToMonths,
} from '@/rental-operations/types';
import type { RentalOperationRow, RentalOpStatus, RentalExtensionRow, RentalOpHistoryRow, TransportOption, FuelOption, RentalDuration } from '@/rental-operations/types';

export default function AdminRentalOperations() {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const { rentalOperations, loading, error, createRentalOperation, updateRentalOpStatus, recordHandover, recordReturn, createExtension, getExtensions, getHistory } = useRentalOperation();
  const { requests: rentalRequests } = useRental();
  const { dbQuotations } = useQuotation();
  const { purchaseOrders } = usePurchaseOrder();
  const { dbContracts } = useContract();
  const { can } = useEmployee();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewing, setViewing] = useState<RentalOperationRow | null>(null);
  const [extensions, setExtensions] = useState<RentalExtensionRow[]>([]);
  const [history, setHistory] = useState<RentalOpHistoryRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const canEdit = can('rental_requests', 'edit') || can('rental_requests', 'manage');
  const canCreate = can('rental_requests', 'create') || can('rental_requests', 'manage');

  const equipmentNames = Array.from(new Set(rentalOperations.map((r) => r.equipment_name).filter(Boolean))) as string[];
  const customerNames = Array.from(new Set(rentalOperations.map((r) => r.customer_name)));

  const filtered = rentalOperations.filter((r) => {
    const matchSearch = !search ||
      r.rental_reference?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.equipment_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchEquipment = equipmentFilter === 'all' || r.equipment_name === equipmentFilter;
    const matchCustomer = customerFilter === 'all' || r.customer_name === customerFilter;
    const matchDate = !dateFilter || r.start_date === dateFilter;
    return matchSearch && matchStatus && matchEquipment && matchCustomer && matchDate;
  });

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };
  const fmtMoney = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const loadDetail = async (r: RentalOperationRow) => {
    setViewing(r);
    setDetailLoading(true);
    setShowHandover(false);
    setShowReturn(false);
    setShowExtension(false);
    try {
      const [ext, hist] = await Promise.all([getExtensions(r.id), getHistory(r.id)]);
      setExtensions(ext);
      setHistory(hist);
    } catch { setExtensions([]); setHistory([]); }
    finally { setDetailLoading(false); }
  };

  const allowedNextStatuses = (current: RentalOpStatus): RentalOpStatus[] => statusTransitions[current] || [];

  const handleStatusChange = async (status: RentalOpStatus) => {
    if (!viewing) return;
    setStatusChanging(true);
    try {
      await updateRentalOpStatus(viewing.id, status);
      setViewing({ ...viewing, status });
      const hist = await getHistory(viewing.id);
      setHistory(hist);
    } catch { /* error */ } finally { setStatusChanging(false); }
  };

  const onHandoverSaved = async () => {
    if (!viewing) return;
    setShowHandover(false);
    const updated = rentalOperations.find((r) => r.id === viewing.id);
    if (updated) setViewing({ ...updated, status: 'delivered', handover_confirmed: true });
    const hist = await getHistory(viewing.id);
    setHistory(hist);
  };

  const onReturnSaved = async () => {
    if (!viewing) return;
    setShowReturn(false);
    const updated = rentalOperations.find((r) => r.id === viewing.id);
    if (updated) setViewing({ ...updated, status: 'completed' });
    const hist = await getHistory(viewing.id);
    setHistory(hist);
  };

  const onExtensionCreated = async () => {
    if (!viewing) return;
    setShowExtension(false);
    const ext = await getExtensions(viewing.id);
    setExtensions(ext);
    const hist = await getHistory(viewing.id);
    setHistory(hist);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Truck size={28} className="text-yellow-accent" />
            {ar ? 'التأجير والتشغيل' : 'Rental Operations'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${filtered.length} عملية تأجير` : `${filtered.length} rental operations`}</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> {ar ? 'اعتماد تأجير' : 'Confirm Rental'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {allRentalOpStatuses.map((s) => <option key={s} value={s}>{ar ? rentalOpStatusLabels[s].ar : rentalOpStatusLabels[s].en}</option>)}
          </select>
          <select className={inputClass} value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}>
            <option value="all">{ar ? 'كل المعدات' : 'All equipment'}</option>
            {equipmentNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className={inputClass} value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="all">{ar ? 'كل العملاء' : 'All customers'}</option>
            {customerNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" className={inputClass} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-yellow-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Truck size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد عمليات تأجير' : 'No rental operations'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => loadDetail(r)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-yellow-accent">{r.rental_reference}</span>
                    <span className="text-xs text-base-muted">• {fmtDate(r.start_date)}</span>
                    {r.handover_confirmed && <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-500 font-semibold">{ar ? 'تم التسليم' : 'Handed over'}</span>}
                  </div>
                  <div className="text-sm font-bold text-base-primary">{r.equipment_name || '—'} • {r.customer_name}</div>
                  <div className="text-xs text-base-muted">{r.company_name || '—'} • {ar ? 'الطلب' : 'Request'}: {r.request_reference || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <div className="text-sm font-black text-base-primary">{fmtMoney(r.agreed_amount)} <span className="text-xs font-normal text-base-muted">{r.currency}</span></div>
                    <div className="text-xs text-base-muted">{fmtDate(r.start_date)} → {fmtDate(r.expected_end_date)}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${rentalOpStatusColors[r.status as RentalOpStatus]}`}>
                    {ar ? rentalOpStatusLabels[r.status as RentalOpStatus].ar : rentalOpStatusLabels[r.status as RentalOpStatus].en}
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
        <CreateRentalModal
          ar={ar}
          inputClass={inputClass}
          rentalRequests={rentalRequests.filter((r) => r.status === 'approved' || r.status === 'awaiting_po')}
          quotations={dbQuotations.filter((q) => q.status === 'accepted' && q.request_type === 'rental')}
          pos={purchaseOrders.filter((p) => p.status === 'accepted')}
          contracts={dbContracts.filter((c) => c.status === 'active' && c.request_type === 'rental')}
          onClose={() => setCreating(false)}
          onCreate={async (payload) => {
            try {
              await createRentalOperation(payload as unknown as Parameters<typeof createRentalOperation>[0]);
              setCreating(false);
            } catch { /* error */ }
          }}
        />
      )}

      {/* Detail modal */}
      {viewing && !creating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-yellow-accent font-mono">{viewing.rental_reference}</h3>
                <p className="text-xs text-base-muted">{viewing.equipment_name || '—'} • {viewing.customer_name}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${rentalOpStatusColors[viewing.status as RentalOpStatus]}`}>
                  {ar ? rentalOpStatusLabels[viewing.status as RentalOpStatus].ar : rentalOpStatusLabels[viewing.status as RentalOpStatus].en}
                </span>
                <span className="text-xs text-base-muted">{viewing.currency}</span>
              </div>

              {/* Customer & Equipment info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'المعدات' : 'Equipment'}: </span><span className="font-semibold text-base-primary">{viewing.equipment_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموديل' : 'Model'}: </span><span className="font-semibold text-base-primary">{viewing.model_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.start_date)}</span></div>
                <div><span className="text-base-muted">{ar ? 'الانتهاء' : 'End'}: </span><span className="font-semibold text-base-primary">{fmtDate(viewing.expected_end_date)}</span></div>
                <div><span className="text-base-muted">{ar ? 'المبلغ' : 'Amount'}: </span><span className="font-semibold text-base-primary">{fmtMoney(viewing.agreed_amount)} {viewing.currency}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{viewing.rental_location || '—'}</span></div>
              </div>

              {/* Transport & Fuel */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-base border border-base">
                  <span className="text-xs text-base-muted block mb-0.5">{ar ? 'النقل' : 'Transport'}</span>
                  <span className="font-semibold text-base-primary">{ar ? transportLabels[viewing.transport_responsibility as TransportOption]?.ar : transportLabels[viewing.transport_responsibility as TransportOption]?.en}</span>
                </div>
                <div className="p-2 rounded-lg bg-base border border-base">
                  <span className="text-xs text-base-muted block mb-0.5">{ar ? 'الوقود' : 'Fuel'}</span>
                  <span className="font-semibold text-base-primary">{ar ? fuelLabels[viewing.fuel_responsibility as FuelOption]?.ar : fuelLabels[viewing.fuel_responsibility as FuelOption]?.en}</span>
                </div>
              </div>

              {/* Commercial links */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'السجل التجاري' : 'Commercial Records'}</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2"><FileText size={14} className="text-base-muted" /><span className="text-base-muted">{ar ? 'العرض' : 'Quotation'}:</span><span className="font-semibold text-base-primary">{viewing.quotation_reference || '—'}</span></div>
                  <div className="flex items-center gap-2"><PackageCheck size={14} className="text-base-muted" /><span className="text-base-muted">{ar ? 'أمر الشراء' : 'PO'}:</span><span className="font-semibold text-base-primary">{viewing.po_number || '—'}</span></div>
                  <div className="flex items-center gap-2"><KeyRound size={14} className="text-base-muted" /><span className="text-base-muted">{ar ? 'العقد' : 'Contract'}:</span><span className="font-semibold text-base-primary">{viewing.contract_number || '—'}</span></div>
                </div>
              </div>

              {/* Handover info */}
              {viewing.handover_confirmed && (
                <div className="pt-3 border-t border-base">
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'التسليم' : 'Handover'}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-base-muted">{ar ? 'التاريخ' : 'Date'}: </span><span className="font-semibold">{fmtDate(viewing.handover_date)}</span></div>
                    <div><span className="text-base-muted">{ar ? 'المستلم' : 'Receiver'}: </span><span className="font-semibold">{viewing.receiver_name || '—'}</span></div>
                    <div><span className="text-base-muted">{ar ? 'الهاتف' : 'Phone'}: </span><span className="font-semibold" dir="ltr">{viewing.receiver_phone || '—'}</span></div>
                    <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold">{viewing.handover_location || '—'}</span></div>
                    {viewing.handover_notes && <div className="col-span-2"><span className="text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span>{viewing.handover_notes}</div>}
                  </div>
                </div>
              )}

              {/* Return info */}
              {viewing.actual_return_date && (
                <div className="pt-3 border-t border-base">
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الإرجاع' : 'Return'}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-base-muted">{ar ? 'تاريخ الإرجاع' : 'Return Date'}: </span><span className="font-semibold">{fmtDate(viewing.actual_return_date)}</span></div>
                    {viewing.return_condition_note && <div className="col-span-2"><span className="text-base-muted">{ar ? 'حالة المعدة' : 'Condition'}: </span>{viewing.return_condition_note}</div>}
                    {viewing.return_notes && <div className="col-span-2"><span className="text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span>{viewing.return_notes}</div>}
                  </div>
                </div>
              )}

              {/* Extensions */}
              {extensions.length > 0 && (
                <div className="pt-3 border-t border-base">
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1.5"><CalendarPlus size={14} /> {ar ? 'التمديدات' : 'Extensions'}</h4>
                  <div className="space-y-2">
                    {extensions.map((ext) => (
                      <div key={ext.id} className="text-sm p-2 rounded-lg bg-base border border-base">
                        <div className="font-semibold text-base-primary">{fmtDate(ext.extension_date)} → {fmtDate(ext.new_expected_end_date)}</div>
                        {ext.reason && <div className="text-xs text-base-muted">{ext.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status change */}
              {canEdit && viewing.status !== 'completed' && viewing.status !== 'cancelled' && (
                <div className="pt-3 border-t border-base">
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                  <div className="flex items-center gap-2">
                    <select className={inputClass} value={viewing.status} onChange={(e) => handleStatusChange(e.target.value as RentalOpStatus)} disabled={statusChanging}>
                      <option value={viewing.status}>{ar ? rentalOpStatusLabels[viewing.status as RentalOpStatus].ar : rentalOpStatusLabels[viewing.status as RentalOpStatus].en}</option>
                      {allowedNextStatuses(viewing.status as RentalOpStatus).map((s) => <option key={s} value={s}>{ar ? rentalOpStatusLabels[s].ar : rentalOpStatusLabels[s].en}</option>)}
                    </select>
                    {statusChanging && <Loader2 size={16} className="animate-spin text-yellow-accent" />}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-base">
                {canEdit && (viewing.status === 'approved' || viewing.status === 'awaiting_delivery') && !viewing.handover_confirmed && (
                  <button onClick={() => setShowHandover(true)} className="btn-primary text-xs flex items-center gap-1.5">
                    <Truck size={14} /> {ar ? 'تسجيل التسليم' : 'Record Handover'}
                  </button>
                )}
                {canEdit && (viewing.status === 'active' || viewing.status === 'awaiting_return') && !viewing.actual_return_date && (
                  <button onClick={() => setShowReturn(true)} className="btn-primary text-xs flex items-center gap-1.5">
                    <Undo2 size={14} /> {ar ? 'تسجيل الإرجاع' : 'Record Return'}
                  </button>
                )}
                {canEdit && (viewing.status === 'active' || viewing.status === 'delivered') && (
                  <button onClick={() => setShowExtension(true)} className="btn-secondary text-xs flex items-center gap-1.5">
                    <CalendarPlus size={14} /> {ar ? 'تمديد' : 'Extend'}
                  </button>
                )}
              </div>

              {/* History */}
              <div className="pt-3 border-t border-base">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3 flex items-center gap-1.5"><History size={14} /> {ar ? 'السجل' : 'History'}</h4>
                {detailLoading ? (
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

      {/* Handover form */}
      {viewing && showHandover && (
        <HandoverForm ar={ar} inputClass={inputClass} onClose={() => setShowHandover(false)}
          onSave={async (data) => { await recordHandover(viewing.id, data); onHandoverSaved(); }} />
      )}

      {/* Return form */}
      {viewing && showReturn && (
        <ReturnForm ar={ar} inputClass={inputClass} onClose={() => setShowReturn(false)}
          onSave={async (data) => { await recordReturn(viewing.id, data); onReturnSaved(); }} />
      )}

      {/* Extension form */}
      {viewing && showExtension && (
        <ExtensionForm ar={ar} inputClass={inputClass} currentEndDate={viewing.expected_end_date} onClose={() => setShowExtension(false)}
          onSave={async (data) => { const result = await createExtension(viewing.id, data); if (result.success) onExtensionCreated(); else alert(result.error); }} />
      )}
    </div>
  );
}

// ─── Create Rental Modal ───────────────────────────────────
function CreateRentalModal({ ar, inputClass, rentalRequests, quotations, pos, contracts, onClose, onCreate }: {
  ar: boolean;
  inputClass: string;
  rentalRequests: Array<{ id: string; request_reference: string; customer_name: string; company_name: string | null; phone: string; email: string | null; equipment_name: string; equipment_name_ar: string; equipment_model_id: string | null; rental_period: string; requested_start_date: string | null; project_city: string | null; project_location: string | null }>;
  quotations: Array<{ id: string; quotation_reference: string; request_id: string; total: number; currency: string; customer_name: string; company_name: string | null }>;
  pos: Array<{ id: string; po_number: string; quotation_id: string | null; amount: number; currency: string }>;
  contracts: Array<{ id: string; contract_number: string; quotation_id: string | null; purchase_order_id: string | null; contract_value: number; currency: string }>;
  onClose: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [rentalLocation, setRentalLocation] = useState('');
  const [transport, setTransport] = useState<TransportOption>('renter');
  const [fuel, setFuel] = useState<FuelOption>('renter');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRequest = rentalRequests.find((r) => r.id === selectedRequestId);
  const selectedQuotation = quotations.find((q) => q.id === selectedQuotationId);
  const selectedPO = pos.find((p) => p.id === selectedPOId);
  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const availableQuotations = quotations.filter((q) => !selectedRequestId || q.request_id === selectedRequestId);
  const availablePOs = pos.filter((p) => !selectedQuotationId || p.quotation_id === selectedQuotationId);
  const availableContracts = contracts.filter((c) => !selectedQuotationId || c.quotation_id === selectedQuotationId);

  const handleSave = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        request_id: selectedRequest.id,
        request_reference: selectedRequest.request_reference,
        quotation_id: selectedQuotation?.id,
        quotation_reference: selectedQuotation?.quotation_reference,
        purchase_order_id: selectedPO?.id,
        po_number: selectedPO?.po_number,
        contract_id: selectedContract?.id,
        contract_number: selectedContract?.contract_number,
        customer_name: selectedRequest.customer_name,
        company_name: selectedRequest.company_name,
        customer_phone: selectedRequest.phone,
        customer_email: selectedRequest.email,
        equipment_model_id: selectedRequest.equipment_model_id,
        equipment_name: ar ? selectedRequest.equipment_name_ar : selectedRequest.equipment_name,
        rental_period: selectedRequest.rental_period,
        start_date: startDate,
        expected_end_date: expectedEndDate || undefined,
        rental_location: [selectedRequest.project_city, selectedRequest.project_location].filter(Boolean).join(' — ') || rentalLocation || undefined,
        agreed_amount: selectedQuotation?.total || selectedPO?.amount || selectedContract?.contract_value || 0,
        currency: selectedQuotation?.currency || selectedPO?.currency || selectedContract?.currency || 'SAR',
        transport_responsibility: transport,
        fuel_responsibility: fuel,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rental operation');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><Truck size={20} className="text-yellow-accent" /> {ar ? 'اعتماد تأجير' : 'Confirm Rental'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">{error}</div>}
          {rentalRequests.length === 0 ? (
            <p className="text-sm text-base-muted text-center py-8">{ar ? 'لا توجد طلبات تأجير معتمدة.' : 'No approved rental requests available.'}</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'طلب التأجير' : 'Rental Request'}</label>
                <select className={inputClass} value={selectedRequestId} onChange={(e) => { setSelectedRequestId(e.target.value); setSelectedQuotationId(''); setSelectedPOId(''); setSelectedContractId(''); }}>
                  <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                  {rentalRequests.map((r) => <option key={r.id} value={r.id}>{r.request_reference} — {r.customer_name} — {ar ? r.equipment_name_ar : r.equipment_name}</option>)}
                </select>
              </div>

              {selectedRequest && (
                <div className="card-industrial p-3 bg-black/5 dark:bg-white/5 text-sm space-y-1">
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold">{selectedRequest.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المعدات' : 'Equipment'}: </span><span className="font-semibold">{ar ? selectedRequest.equipment_name_ar : selectedRequest.equipment_name}</span></div>
                </div>
              )}

              {availableQuotations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'عرض السعر (اختياري)' : 'Quotation (optional)'}</label>
                  <select className={inputClass} value={selectedQuotationId} onChange={(e) => { setSelectedQuotationId(e.target.value); setSelectedPOId(''); setSelectedContractId(''); }}>
                    <option value="">{ar ? '— بدون —' : '— None —'}</option>
                    {availableQuotations.map((q) => <option key={q.id} value={q.id}>{q.quotation_reference} — {q.total.toLocaleString()} {q.currency}</option>)}
                  </select>
                </div>
              )}
              {availablePOs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'أمر الشراء (اختياري)' : 'PO (optional)'}</label>
                  <select className={inputClass} value={selectedPOId} onChange={(e) => setSelectedPOId(e.target.value)}>
                    <option value="">{ar ? '— بدون —' : '— None —'}</option>
                    {availablePOs.map((p) => <option key={p.id} value={p.id}>{p.po_number} — {p.amount.toLocaleString()}</option>)}
                  </select>
                </div>
              )}
              {availableContracts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'العقد (اختياري)' : 'Contract (optional)'}</label>
                  <select className={inputClass} value={selectedContractId} onChange={(e) => setSelectedContractId(e.target.value)}>
                    <option value="">{ar ? '— بدون —' : '— None —'}</option>
                    {availableContracts.map((c) => <option key={c.id} value={c.id}>{c.contract_number} — {c.contract_value.toLocaleString()}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ الانتهاء' : 'Expected End'}</label>
                  <input type="date" className={inputClass} value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'النقل' : 'Transport'}</label>
                  <select className={inputClass} value={transport} onChange={(e) => setTransport(e.target.value as TransportOption)}>
                    <option value="renter">{ar ? transportLabels.renter.ar : transportLabels.renter.en}</option>
                    <option value="sahab">{ar ? transportLabels.sahab.ar : transportLabels.sahab.en}</option>
                    <option value="per_agreement">{ar ? transportLabels.per_agreement.ar : transportLabels.per_agreement.en}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'الوقود' : 'Fuel'}</label>
                  <select className={inputClass} value={fuel} onChange={(e) => setFuel(e.target.value as FuelOption)}>
                    <option value="renter">{ar ? fuelLabels.renter.ar : fuelLabels.renter.en}</option>
                    <option value="sahab">{ar ? fuelLabels.sahab.ar : fuelLabels.sahab.en}</option>
                    <option value="per_agreement">{ar ? fuelLabels.per_agreement.ar : fuelLabels.per_agreement.en}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'ملاحظات' : 'Notes'}</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave} disabled={!selectedRequestId || saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                  {saving && <Loader2 size={16} className="animate-spin" />} {ar ? 'اعتماد' : 'Confirm'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Handover Form ─────────────────────────────────────────
function HandoverForm({ ar, inputClass, onClose, onSave }: {
  ar: boolean;
  inputClass: string;
  onClose: () => void;
  onSave: (data: { handover_date: string; handover_location?: string; handover_notes?: string; receiver_name?: string; receiver_phone?: string }) => Promise<void>;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-base flex items-center justify-between">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><Truck size={20} className="text-yellow-accent" /> {ar ? 'تسجيل التسليم' : 'Record Handover'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ التسليم' : 'Delivery Date'}</label><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'الموقع' : 'Location'}</label><input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'اسم المستلم' : 'Receiver Name'}</label><input className={inputClass} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'هاتف المستلم' : 'Receiver Phone'}</label><input className={inputClass} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} dir="ltr" /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'ملاحظات' : 'Notes'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={async () => { setSaving(true); await onSave({ handover_date: date, handover_location: location, handover_notes: notes, receiver_name: receiverName, receiver_phone: receiverPhone }); setSaving(false); }} disabled={saving || !date} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} {ar ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Return Form ───────────────────────────────────────────
function ReturnForm({ ar, inputClass, onClose, onSave }: {
  ar: boolean;
  inputClass: string;
  onClose: () => void;
  onSave: (data: { actual_return_date: string; return_notes?: string; return_condition_note?: string }) => Promise<void>;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-base flex items-center justify-between">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><Undo2 size={20} className="text-yellow-accent" /> {ar ? 'تسجيل الإرجاع' : 'Record Return'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ الإرجاع' : 'Return Date'}</label><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'حالة المعدة' : 'Condition Note'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={condition} onChange={(e) => setCondition(e.target.value)} placeholder={ar ? 'ملاحظات حول حالة المعدة...' : 'Equipment condition observations...'} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'ملاحظات' : 'Notes'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={async () => { setSaving(true); await onSave({ actual_return_date: date, return_notes: notes, return_condition_note: condition }); setSaving(false); }} disabled={saving || !date} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} {ar ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Extension Form ────────────────────────────────────────
function ExtensionForm({ ar, inputClass, currentEndDate, onClose, onSave }: {
  ar: boolean;
  inputClass: string;
  currentEndDate: string | null;
  onClose: () => void;
  onSave: (data: { extension_date: string; new_expected_end_date: string; extension_period: string; reason?: string }) => Promise<void>;
}) {
  const [extDate, setExtDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState('');
  const [period, setPeriod] = useState<RentalDuration>('monthly');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Validate max 6 months
  const extMonths = durationToMonths(period);
  const exceedsMax = extMonths > MAX_EXTENSION_MONTHS;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-base flex items-center justify-between">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2"><CalendarPlus size={20} className="text-yellow-accent" /> {ar ? 'تمديد التأجير' : 'Extend Rental'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ التمديد' : 'Extension Date'}</label><input type="date" className={inputClass} value={extDate} onChange={(e) => setExtDate(e.target.value)} /></div>
          <div>
            <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'مدة التمديد' : 'Extension Period'}</label>
            <select className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value as RentalDuration)}>
              {allDurations.map((d) => <option key={d} value={d}>{ar ? durationLabels[d].ar : durationLabels[d].en}</option>)}
            </select>
          </div>
          {exceedsMax && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle size={16} />
              {ar ? `الحد الأقصى للتمديد ${MAX_EXTENSION_MONTHS} أشهر.` : `Maximum extension is ${MAX_EXTENSION_MONTHS} months.`}
            </div>
          )}
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'تاريخ الانتهاء الجديد' : 'New Expected End Date'}</label><input type="date" className={inputClass} value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'السبب' : 'Reason'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div className="text-xs text-base-muted">{ar ? `تاريخ الانتهاء الحالي: ${currentEndDate || '—'}` : `Current end date: ${currentEndDate || '—'}`}</div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={async () => { setSaving(true); await onSave({ extension_date: extDate, new_expected_end_date: newEndDate, extension_period: period, reason }); setSaving(false); }} disabled={saving || !newEndDate || exceedsMax} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} {ar ? 'تمديد' : 'Extend'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
