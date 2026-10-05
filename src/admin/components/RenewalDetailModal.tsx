import { useState } from 'react';
import { X, RefreshCw, DollarSign, History, Truck, Save, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRenewal } from '../RenewalContext';
import { useEmployee } from '../EmployeeContext';
import {
  renewalStatusLabels, renewalStatusColors, allRenewalStatuses,
  renewalPeriodLabels, customerClassificationLabels, customerClassificationColors,
  allocationChoiceLabels, daysUntilExpiry, expiryAlertLevel, expiryAlertColors,
  type ContractRenewal, type RenewalStatus, type RenewalPricing,
} from '../renewal-types';

interface Props {
  renewal: ContractRenewal;
  onClose: () => void;
}

type Tab = 'details' | 'pricing' | 'history' | 'allocation';

export default function RenewalDetailModal({ renewal, onClose }: Props) {
  const { lang } = useApp();
  const { getRenewal, getRenewalChain, setRenewalStatus, updatePricing, setAllocationChoice, setCustomerClassification, cancelRenewal } = useRenewal();
  const { can, currentEmployee } = useEmployee();
  const ar = lang === 'ar';
  const [tab, setTab] = useState<Tab>('details');

  const d = getRenewal(renewal.id) || renewal;
  const canManage = can('contracts', 'manage');
  const canEdit = can('contracts', 'edit') || can('contracts', 'manage');
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const tabs: { id: Tab; labelAr: string; labelEn: string; icon: typeof X }[] = [
    { id: 'details', labelAr: 'التفاصيل', labelEn: 'Details', icon: RefreshCw },
    { id: 'pricing', labelAr: 'التسعير', labelEn: 'Pricing', icon: DollarSign },
    { id: 'history', labelAr: 'السجل', labelEn: 'History', icon: History },
    { id: 'allocation', labelAr: 'التخصيص', labelEn: 'Allocation', icon: Truck },
  ];

  const chain = getRenewalChain(d.originalContractId);
  const days = daysUntilExpiry(d.currentEndDate);
  const alert = expiryAlertLevel(days);

  const handleStatusChange = (status: RenewalStatus) => {
    if (!currentEmployee) return;
    setRenewalStatus(d.id, status, currentEmployee.id, currentEmployee.fullName);
  };

  const handleCancel = () => {
    if (!currentEmployee) return;
    cancelRenewal(d.id, currentEmployee.id, currentEmployee.fullName, ar ? 'إلغاء يدوي' : 'Manual cancellation');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
              <span className="font-mono text-yellow-accent">{d.renewalNumber}</span>
            </h3>
            <p className="text-xs text-base-muted">{ar ? 'عقد أصلي' : 'Original'}: {d.originalContractNumber} • {d.companyName || d.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        {/* Status badge */}
        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${renewalStatusColors[d.status]}`}>
            {ar ? renewalStatusLabels[d.status].ar : renewalStatusLabels[d.status].en}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${customerClassificationColors[d.customerClassification]}`}>
            {ar ? customerClassificationLabels[d.customerClassification].ar : customerClassificationLabels[d.customerClassification].en}
          </span>
          {d.status === 'active' && alert !== 'none' && (
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${expiryAlertColors[alert]}`}>
              <AlertTriangle size={12} />
              {ar ? `باقي ${days} يوم` : `${days} days left`}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base px-5 sticky top-[73px] bg-elevated z-[5]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${active ? 'text-yellow-accent border-b-2 border-yellow-accent' : 'text-base-muted hover:text-base-primary'}`}>
                <Icon size={16} />
                {ar ? t.labelAr : t.labelEn}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* Details tab */}
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'رقم التجديد' : 'Renewal #'}: </span><span className="font-mono font-semibold text-base-primary">{d.renewalNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'العقد الأصلي' : 'Original Contract'}: </span><span className="font-mono font-semibold text-base-primary">{d.originalContractNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{d.customerName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{d.companyName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'المعدات' : 'Equipment'}: </span><span className="font-semibold text-base-primary">{d.equipmentModel}</span></div>
                <div><span className="text-base-muted">{ar ? 'الكمية' : 'Quantity'}: </span><span className="font-semibold text-base-primary">{d.quantity}</span></div>
                <div><span className="text-base-muted">{ar ? 'الفترة' : 'Period'}: </span><span className="font-semibold text-base-primary">{ar ? renewalPeriodLabels[d.renewalPeriod].ar : renewalPeriodLabels[d.renewalPeriod].en}{d.renewalPeriod === 'custom' ? ` (${d.customPeriodDays} ${ar ? 'يوم' : 'days'})` : ''}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموظف' : 'Assigned'}: </span><span className="font-semibold text-base-primary">{d.assignedEmployeeName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الفترة الحالية' : 'Current Period'}: </span><span className="font-semibold text-base-primary">{d.currentStartDate} → {d.currentEndDate}</span></div>
                <div><span className="text-base-muted">{ar ? 'الفترة الجديدة' : 'New Period'}: </span><span className="font-semibold text-base-primary">{d.newStartDate} → {d.newEndDate}</span></div>
                <div><span className="text-base-muted">{ar ? 'المشروع' : 'Project'}: </span><span className="font-semibold text-base-primary">{d.projectName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{d.location || '—'}</span></div>
              </div>

              {/* Renewal chain */}
              {chain.length > 1 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'سلسلة التجديد' : 'Renewal Chain'}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-base-muted">{d.originalContractNumber}</span>
                    {chain.map((c) => (
                      <span key={c.id} className="flex items-center gap-2">
                        <span className="text-base-muted">→</span>
                        <span className={`text-xs font-mono ${c.id === d.id ? 'font-bold text-yellow-accent' : 'text-base-muted'}`}>{c.renewalNumber}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status actions */}
              {canEdit && d.status !== 'active' && d.status !== 'cancelled' && d.status !== 'rejected' && (
                <div className="pt-3 border-t border-base space-y-2">
                  <label className={labelClass}>{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                  <div className="flex flex-wrap gap-2">
                    {allRenewalStatuses.filter((s) => s !== d.status && s !== 'expired').map((s) => (
                      <button key={s} onClick={() => handleStatusChange(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${renewalStatusColors[s]} border border-transparent hover:opacity-80`}>
                        {ar ? renewalStatusLabels[s].ar : renewalStatusLabels[s].en}
                      </button>
                    ))}
                  </div>
                  {canManage && (
                    <button onClick={handleCancel} className="text-xs text-red-500 hover:underline mt-2">
                      {ar ? 'إلغاء التجديد' : 'Cancel Renewal'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pricing tab */}
          {tab === 'pricing' && (
            <PricingTab renewal={d} canEdit={canEdit} onUpdate={updatePricing} />
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div className="space-y-2">
              {d.history.length === 0 ? (
                <p className="text-sm text-base-muted text-center py-6">{ar ? 'لا يوجد سجل' : 'No history'}</p>
              ) : (
                [...d.history].reverse().map((h) => (
                  <div key={h.id} className="card-industrial p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                      <History size={14} className="text-base-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-base-primary">{ar ? h.actionAr : h.action}</div>
                      <div className="text-xs text-base-muted">
                        {h.employeeName} • {new Date(h.timestamp).toLocaleString(ar ? 'ar-SA' : 'en-US')}
                      </div>
                      {h.previousStatus && (
                        <div className="text-xs text-base-muted mt-0.5">
                          {ar ? renewalStatusLabels[h.previousStatus].ar : renewalStatusLabels[h.previousStatus].en}
                          {' → '}
                          {ar ? renewalStatusLabels[h.newStatus].ar : renewalStatusLabels[h.newStatus].en}
                        </div>
                      )}
                      {h.notes && <div className="text-xs text-base-muted mt-0.5">{h.notes}</div>}
                      {h.pricingChanged && <div className="text-xs text-yellow-accent mt-0.5">{ar ? 'تم تغيير التسعير' : 'Pricing changed'}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Allocation tab */}
          {tab === 'allocation' && (
            <div className="space-y-4">
              <div className="card-industrial p-4">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'قرار التخصيص' : 'Allocation Decision'}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {(['continue_current', 'reallocate', 'pending'] as const).map((choice) => (
                    <button
                      key={choice}
                      onClick={() => canEdit && setAllocationChoice(d.id, choice)}
                      disabled={!canEdit}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all text-start ${
                        d.allocationChoice === choice
                          ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                          : 'border-base text-base-muted hover:text-base-primary'
                      } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {ar ? allocationChoiceLabels[choice].ar : allocationChoiceLabels[choice].en}
                    </button>
                  ))}
                </div>
              </div>

              {d.allocationChoice === 'continue_current' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {ar ? 'سيتم الحفاظ على العلاقة التشغيلية للوحدة الحالية' : 'Current unit operational relationship will be preserved'}
                </div>
              )}
              {d.allocationChoice === 'reallocate' && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-500 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {ar ? 'سيتم إنشاء تخصيص جديد للوحدة البديلة' : 'A new allocation will be created for the replacement unit'}
                </div>
              )}

              {d.newContractId && (
                <div className="card-industrial p-4">
                  <div className="text-xs text-base-muted mb-1">{ar ? 'العقد الناتج' : 'Resulting Contract'}</div>
                  <div className="font-mono font-bold text-yellow-accent">{d.newContractNumber}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────

function PricingTab({ renewal, canEdit, onUpdate }: { renewal: ContractRenewal; canEdit: boolean; onUpdate: (id: string, p: Partial<RenewalPricing>) => void }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [local, setLocal] = useState(renewal.pricing);
  const [saved, setSaved] = useState(false);
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const handleSave = () => {
    onUpdate(renewal.id, local);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (patch: Partial<RenewalPricing>) => setLocal((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4">
      <div className="card-industrial p-4 bg-black/5 dark:bg-white/5">
        <div className="text-xs text-base-muted mb-1">{ar ? 'السعر الحالي' : 'Current Price'}</div>
        <div className="text-lg font-bold text-base-primary">{renewal.pricing.currentPrice.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{ar ? 'السعر الجديد' : 'New Price'}</label>
          <input type="number" className={inputClass} value={local.newPrice} onChange={(e) => update({ newPrice: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelClass}>{ar ? 'الخصم' : 'Discount'}</label>
          <input type="number" className={inputClass} value={local.discount} onChange={(e) => update({ discount: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelClass}>{ar ? 'النقل' : 'Transportation'}</label>
          <input type="number" className={inputClass} value={local.transportation} onChange={(e) => update({ transportation: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelClass}>{ar ? 'المشغل' : 'Operator'}</label>
          <input type="number" className={inputClass} value={local.operator} onChange={(e) => update({ operator: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelClass}>{ar ? 'الديزل' : 'Diesel'}</label>
          <input type="number" className={inputClass} value={local.diesel} onChange={(e) => update({ diesel: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelClass}>{ar ? 'رسوم إضافية' : 'Additional Charges'}</label>
          <input type="number" className={inputClass} value={local.additionalCharges} onChange={(e) => update({ additionalCharges: parseFloat(e.target.value) || 0 })} disabled={!canEdit} />
        </div>
      </div>

      {/* Calculated totals */}
      <div className="card-industrial p-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-base-muted">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-semibold text-base-primary">{local.subtotal.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
        <div className="flex justify-between text-sm"><span className="text-base-muted">{ar ? 'ض.ق.ت' : 'VAT (15%)'}</span><span className="font-semibold text-base-primary">{local.vat.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
        <div className="flex justify-between text-base pt-2 border-t border-base"><span className="font-bold text-base-primary">{ar ? 'الإجمالي' : 'Total'}</span><span className="font-black text-yellow-accent">{local.total.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</span></div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">
            <Save size={16} />
            {ar ? 'حفظ التسعير' : 'Save Pricing'}
          </button>
          {saved && (
            <span className="text-sm text-green-500 flex items-center gap-1 animate-fade-in">
              <CheckCircle size={14} />
              {ar ? 'تم الحفظ' : 'Saved'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
