import { useState } from 'react';
import { X, Truck, ClipboardCheck, UserCheck, RotateCcw, History, Save, AlertTriangle, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useDelivery } from '../DeliveryContext';
import { useEmployee } from '../EmployeeContext';
import {
  deliveryStatusLabels, deliveryStatusColors, returnStatusLabels, returnStatusColors,
  conditionRatingLabels, conditionRatingColors, fuelLevelLabels,
  allDeliveryStatuses, allReturnStatuses, allConditionRatings, allFuelLevels,
  compareConditions, createEmptyReturn,
  type DeliveryRecord, type DeliveryStatus, type ReturnStatus, type ReturnRecord, type ReturnCondition, type ConditionRating, type FuelLevel,
} from '../delivery-types';

interface Props {
  delivery: DeliveryRecord;
  onClose: () => void;
}

type Tab = 'details' | 'condition' | 'acknowledgment' | 'return';

export default function DeliveryDetailModal({ delivery, onClose }: Props) {
  const { lang } = useApp();
  const { getDelivery, setDeliveryStatus, createReturn, updateReturn, setReturnStatus } = useDelivery();
  const { can, currentEmployee } = useEmployee();
  const ar = lang === 'ar';
  const [tab, setTab] = useState<Tab>('details');
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Get fresh data
  const d = getDelivery(delivery.id) || delivery;
  const canManage = can('rental_requests', 'manage') || can('rental_requests', 'edit');
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const tabs: { id: Tab; labelAr: string; labelEn: string; icon: typeof X }[] = [
    { id: 'details', labelAr: 'التفاصيل', labelEn: 'Details', icon: Truck },
    { id: 'condition', labelAr: 'الحالة', labelEn: 'Condition', icon: ClipboardCheck },
    { id: 'acknowledgment', labelAr: 'الإقرار', labelEn: 'Acknowledgment', icon: UserCheck },
    { id: 'return', labelAr: 'الاستلام', labelEn: 'Return', icon: RotateCcw },
  ];

  const comparison = d.returnRecord ? compareConditions(d.condition, d.returnRecord.condition) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
              <span className="font-mono text-yellow-accent">{d.deliveryNumber}</span>
            </h3>
            <p className="text-xs text-base-muted">{d.contractNumber} • {d.companyName || d.customerName} • {d.modelName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        {/* Status badges */}
        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${deliveryStatusColors[d.status]}`}>
            {ar ? deliveryStatusLabels[d.status].ar : deliveryStatusLabels[d.status].en}
          </span>
          {d.returnRecord && (
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${returnStatusColors[d.returnRecord.status]}`}>
              {ar ? returnStatusLabels[d.returnRecord.status].ar : returnStatusLabels[d.returnRecord.status].en}
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
                <div><span className="text-base-muted">{ar ? 'رقم التخصيص' : 'Allocation'}: </span><span className="font-mono font-semibold text-base-primary">{d.allocationNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'رقم العقد' : 'Contract'}: </span><span className="font-mono font-semibold text-base-primary">{d.contractNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{d.customerName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{d.companyName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموديل' : 'Model'}: </span><span className="font-semibold text-base-primary">{d.modelName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الوحدة' : 'Unit'}: </span><span className="font-mono font-semibold text-base-primary">{d.unitCode}</span></div>
                <div><span className="text-base-muted">{ar ? 'المشروع' : 'Project'}: </span><span className="font-semibold text-base-primary">{d.projectName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{d.location || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'فترة الإيجار' : 'Rental Period'}: </span><span className="font-semibold text-base-primary">{d.rentalStart} → {d.rentalEnd}</span></div>
                <div><span className="text-base-muted">{ar ? 'تاريخ التسليم' : 'Delivery Date'}: </span><span className="font-semibold text-base-primary">{d.deliveryDate} {d.deliveryTime}</span></div>
                <div><span className="text-base-muted">{ar ? 'السائق' : 'Driver'}: </span><span className="font-semibold text-base-primary">{d.driverContact || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'جهة الموقع' : 'Site Contact'}: </span><span className="font-semibold text-base-primary">{d.siteContactName || '—'} {d.siteContactMobile}</span></div>
              </div>
              {d.deliveryNotes && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-1">{ar ? 'ملاحظات التسليم' : 'Delivery Notes'}</h4>
                  <div className="text-sm text-base-primary">{d.deliveryNotes}</div>
                </div>
              )}

              {/* Status actions */}
              {canManage && d.status !== 'delivered' && d.status !== 'cancelled' && (
                <div className="pt-3 border-t border-base space-y-2">
                  <label className={labelClass}>{ar ? 'تغيير الحالة' : 'Change Status'}</label>
                  <div className="flex flex-wrap gap-2">
                    {allDeliveryStatuses.filter((s) => s !== d.status).map((s) => (
                      <button key={s} onClick={() => setDeliveryStatus(d.id, s)} className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${deliveryStatusColors[s]} border-transparent hover:opacity-80`}>
                        {ar ? deliveryStatusLabels[s].ar : deliveryStatusLabels[s].en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Condition tab */}
          {tab === 'condition' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'الحالة العامة' : 'General'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionRatingColors[d.condition.generalCondition]}`}>{ar ? conditionRatingLabels[d.condition.generalCondition].ar : conditionRatingLabels[d.condition.generalCondition].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'الإطارات/الجنزير' : 'Tires/Tracks'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionRatingColors[d.condition.tiresTracks]}`}>{ar ? conditionRatingLabels[d.condition.tiresTracks].ar : conditionRatingLabels[d.condition.tiresTracks].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'المحرك' : 'Engine'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionRatingColors[d.condition.engineOperating]}`}>{ar ? conditionRatingLabels[d.condition.engineOperating].ar : conditionRatingLabels[d.condition.engineOperating].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'الملحقات' : 'Attachments'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionRatingColors[d.condition.attachments]}`}>{ar ? conditionRatingLabels[d.condition.attachments].ar : conditionRatingLabels[d.condition.attachments].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'مستوى الوقود' : 'Fuel'}: </span><span className="font-semibold text-base-primary">{ar ? fuelLevelLabels[d.condition.fuelLevel].ar : fuelLevelLabels[d.condition.fuelLevel].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'عدادات الساعات' : 'Hour Meter'}: </span><span className="font-semibold text-base-primary">{d.condition.hourMeter || '—'}</span></div>
              </div>
              {d.condition.visibleDamage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
                  <span className="font-semibold">{ar ? 'ضرر ظاهر: ' : 'Visible Damage: '}</span>{d.condition.damageDescription || '—'}
                </div>
              )}
              {d.condition.notes && <div className="text-sm text-base-muted">{d.condition.notes}</div>}
            </div>
          )}

          {/* Acknowledgment tab */}
          {tab === 'acknowledgment' && (
            <div>
              {d.acknowledgment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-500">
                    <Check size={20} />
                    <span className="text-sm font-semibold">{ar ? 'تم تأكيد الاستلام' : 'Receipt confirmed'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-base-muted">{ar ? 'اسم الممثل' : 'Representative'}: </span><span className="font-semibold text-base-primary">{d.acknowledgment.representativeName || '—'}</span></div>
                    <div><span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}: </span><span className="font-semibold text-base-primary" dir="ltr">{d.acknowledgment.representativeMobile || '—'}</span></div>
                    <div><span className="text-base-muted">{ar ? 'التاريخ' : 'Date'}: </span><span className="font-semibold text-base-primary">{d.acknowledgment.acknowledgedAt || '—'}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
                  <p className="text-sm text-base-muted">{ar ? 'لم يتم تأكيد الاستلام' : 'No acknowledgment recorded'}</p>
                </div>
              )}
            </div>
          )}

          {/* Return tab */}
          {tab === 'return' && (
            <div className="space-y-4">
              {!d.returnRecord ? (
                <div className="text-center py-8">
                  <RotateCcw size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
                  <p className="text-sm text-base-muted mb-4">{ar ? 'لا يوجد سجل استلام' : 'No return record'}</p>
                  {canManage && d.status === 'delivered' && (
                    <button onClick={() => setShowReturnForm(true)} className="btn-primary text-sm">
                      <RotateCcw size={16} />
                      {ar ? 'استلام المعدة' : 'Record Return'}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-base-muted">{ar ? 'رقم الاستلام' : 'Return #'}: </span><span className="font-mono font-semibold text-yellow-accent">{d.returnRecord.returnNumber}</span></div>
                    <div><span className="text-base-muted">{ar ? 'تاريخ الاستلام' : 'Return Date'}: </span><span className="font-semibold text-base-primary">{d.returnRecord.returnDate} {d.returnRecord.returnTime}</span></div>
                    <div><span className="text-base-muted">{ar ? 'استلم بواسطة' : 'Received By'}: </span><span className="font-semibold text-base-primary">{d.returnRecord.receivedBy || '—'}</span></div>
                    <div><span className="text-base-muted">{ar ? 'عدادات الساعات' : 'Hour Meter'}: </span><span className="font-semibold text-base-primary">{d.returnRecord.condition.hourMeter || '—'}</span></div>
                  </div>

                  {/* Condition comparison */}
                  {comparison && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-yellow-accent uppercase">{ar ? 'مقارنة الحالة' : 'Condition Comparison'}</h4>
                      {comparison.newDamage && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          {ar ? 'ضرر جديد' : 'New Damage'}
                        </div>
                      )}
                      {comparison.conditionChanged && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-500 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          {ar ? 'تغير في الحالة' : 'Condition Changed'}
                        </div>
                      )}
                      {!comparison.newDamage && !comparison.conditionChanged && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-500 flex items-center gap-2">
                          <Check size={16} />
                          {ar ? 'لا توجد تغييرات' : 'No Changes'}
                        </div>
                      )}
                    </div>
                  )}

                  {d.returnRecord.damageIssues && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                      <span className="font-semibold text-red-500">{ar ? 'الأضرار/المشاكل: ' : 'Damage/Issues: '}</span>
                      <span className="text-base-primary">{d.returnRecord.damageIssues}</span>
                    </div>
                  )}

                  {d.returnRecord.maintenanceRequired && (
                    <div className="p-3 rounded-lg bg-yellow-accent/10 border border-yellow-accent/30 text-sm">
                      <span className="font-semibold text-yellow-accent">{ar ? 'صيانة مطلوبة: ' : 'Maintenance Required: '}</span>
                      <span className="text-base-primary">{d.returnRecord.maintenanceNotes || '—'}</span>
                    </div>
                  )}

                  {d.returnRecord.notes && <div className="text-sm text-base-muted">{d.returnRecord.notes}</div>}

                  {/* Return status actions */}
                  {canManage && d.returnRecord.status !== 'completed' && d.returnRecord.status !== 'issue' && (
                    <div className="pt-3 border-t border-base space-y-2">
                      <label className={labelClass}>{ar ? 'تغيير حالة الاستلام' : 'Change Return Status'}</label>
                      <div className="flex flex-wrap gap-2">
                        {allReturnStatuses.filter((s) => s !== d.returnRecord!.status).map((s) => (
                          <button key={s} onClick={() => setReturnStatus(d.id, s)} className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${returnStatusColors[s]} border-transparent hover:opacity-80`}>
                            {ar ? returnStatusLabels[s].ar : returnStatusLabels[s].en}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {showReturnForm && (
                <ReturnFormModal
                  delivery={d}
                  onClose={() => setShowReturnForm(false)}
                  onSave={(ret) => { createReturn(d.id, ret); setShowReturnForm(false); }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Return Form Modal ──────────────────────────────────────────

function ReturnFormModal({ delivery, onClose, onSave }: { delivery: DeliveryRecord; onClose: () => void; onSave: (r: ReturnRecord) => void }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [ret, setRet] = useState<ReturnRecord>(createEmptyReturn());
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const updateCond = (patch: Partial<ReturnCondition>) => setRet((prev) => ({ ...prev, condition: { ...prev.condition, ...patch } }));

  const comparison = compareConditions(delivery.condition, ret.condition);

  const handleSave = () => {
    if (!ret.returnDate) return;
    const final: ReturnRecord = {
      ...ret,
      newDamage: comparison.newDamage,
      conditionChanged: comparison.conditionChanged,
      missingItems: comparison.missingItems,
    };
    onSave(final);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <RotateCcw size={20} className="text-yellow-accent" />
            {ar ? 'استلام المعدة' : 'Record Return'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'تاريخ الاستلام' : 'Return Date'} *</label>
              <input type="date" className={inputClass} value={ret.returnDate} onChange={(e) => setRet({ ...ret, returnDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الوقت' : 'Time'}</label>
              <input type="time" className={inputClass} value={ret.returnTime} onChange={(e) => setRet({ ...ret, returnTime: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'استلم بواسطة' : 'Received By'}</label>
              <input className={inputClass} value={ret.receivedBy} onChange={(e) => setRet({ ...ret, receivedBy: e.target.value })} />
            </div>
          </div>

          {/* Return condition */}
          <div className="card-industrial p-4 space-y-3">
            <h4 className="text-xs font-bold text-yellow-accent uppercase">{ar ? 'حالة الاستلام' : 'Return Condition'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{ar ? 'الحالة العامة' : 'General'}</label>
                <select className={inputClass} value={ret.condition.generalCondition} onChange={(e) => updateCond({ generalCondition: e.target.value as ConditionRating })}>
                  {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'مستوى الوقود' : 'Fuel'}</label>
                <select className={inputClass} value={ret.condition.fuelLevel} onChange={(e) => updateCond({ fuelLevel: e.target.value as FuelLevel })}>
                  {allFuelLevels.map((f) => <option key={f} value={f}>{ar ? fuelLevelLabels[f].ar : fuelLevelLabels[f].en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'الإطارات' : 'Tires/Tracks'}</label>
                <select className={inputClass} value={ret.condition.tiresTracks} onChange={(e) => updateCond({ tiresTracks: e.target.value as ConditionRating })}>
                  {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'المحرك' : 'Engine'}</label>
                <select className={inputClass} value={ret.condition.engineOperating} onChange={(e) => updateCond({ engineOperating: e.target.value as ConditionRating })}>
                  {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'الملحقات' : 'Attachments'}</label>
                <select className={inputClass} value={ret.condition.attachments} onChange={(e) => updateCond({ attachments: e.target.value as ConditionRating })}>
                  {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'عدادات الساعات' : 'Hour Meter'}</label>
                <input className={inputClass} value={ret.condition.hourMeter} onChange={(e) => updateCond({ hourMeter: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ret.condition.visibleDamage} onChange={(e) => updateCond({ visibleDamage: e.target.checked })} className="w-4 h-4 accent-yellow-accent" />
              {ar ? 'يوجد ضرر ظاهر' : 'Visible damage'}
            </label>
            {ret.condition.visibleDamage && (
              <input className={inputClass} placeholder={ar ? 'وصف الضرر' : 'Damage description'} value={ret.condition.damageDescription} onChange={(e) => updateCond({ damageDescription: e.target.value })} />
            )}
          </div>

          {/* Comparison preview */}
          {(comparison.newDamage || comparison.conditionChanged) && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 space-y-1">
              {comparison.newDamage && <div className="text-sm text-red-500 flex items-center gap-2"><AlertTriangle size={14} /> {ar ? 'ضرر جديد مقارنة بالتسليم' : 'New damage compared to delivery'}</div>}
              {comparison.conditionChanged && <div className="text-sm text-orange-500 flex items-center gap-2"><AlertTriangle size={14} /> {ar ? 'تغير في الحالة مقارنة بالتسليم' : 'Condition changed compared to delivery'}</div>}
            </div>
          )}

          {/* Damage/issues + notes */}
          <div>
            <label className={labelClass}>{ar ? 'الأضرار/المشاكل' : 'Damage/Issues'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={ret.damageIssues} onChange={(e) => setRet({ ...ret, damageIssues: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={ret.notes} onChange={(e) => setRet({ ...ret, notes: e.target.value })} />
          </div>

          {/* Maintenance flag */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ret.maintenanceRequired} onChange={(e) => setRet({ ...ret, maintenanceRequired: e.target.checked })} className="w-4 h-4 accent-yellow-accent" />
            {ar ? 'الوحدة تحتاج صيانة قبل الإتاحة' : 'Unit requires maintenance before availability'}
          </label>
          {ret.maintenanceRequired && (
            <input className={inputClass} placeholder={ar ? 'ملاحظات الصيانة' : 'Maintenance notes'} value={ret.maintenanceNotes} onChange={(e) => setRet({ ...ret, maintenanceNotes: e.target.value })} />
          )}
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!ret.returnDate} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {ar ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
