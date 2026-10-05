import { useState, useMemo } from 'react';
import { X, Save, Truck, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAllocation } from '../AllocationContext';
import { useDelivery } from '../DeliveryContext';
import { useEmployee } from '../EmployeeContext';
import {
  deliveryStatusLabels, allDeliveryStatuses,
  conditionRatingLabels, allConditionRatings, fuelLevelLabels, allFuelLevels,
  createEmptyDeliveryCondition, createEmptyAcknowledgment,
  type DeliveryRecord, type DeliveryStatus, type DeliveryCondition, type DeliveryAcknowledgment, type ConditionRating, type FuelLevel,
} from '../delivery-types';

interface Props {
  onClose: () => void;
}

export default function DeliveryFormModal({ onClose }: Props) {
  const { lang } = useApp();
  const { allocations } = useAllocation();
  const { addDelivery, hasDeliveryForAllocation } = useDelivery();
  const { currentEmployee } = useEmployee();
  const ar = lang === 'ar';

  const [allocationId, setAllocationId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [siteContactName, setSiteContactName] = useState('');
  const [siteContactMobile, setSiteContactMobile] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('scheduled');
  const [condition, setCondition] = useState<DeliveryCondition>(createEmptyDeliveryCondition());
  const [acknowledgment, setAcknowledgment] = useState<DeliveryAcknowledgment>(createEmptyAcknowledgment());

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  // Only allocated allocations without existing deliveries
  const eligibleAllocations = useMemo(
    () => allocations.filter((a) => a.status === 'allocated' && !hasDeliveryForAllocation(a.id)),
    [allocations, hasDeliveryForAllocation],
  );

  const selectedAllocation = allocations.find((a) => a.id === allocationId);

  const canSave = allocationId && deliveryDate && currentEmployee;

  const handleSave = () => {
    if (!canSave || !selectedAllocation || !currentEmployee) return;

    const record: DeliveryRecord = {
      id: `dlv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deliveryNumber: '',
      allocationId: selectedAllocation.id,
      allocationNumber: selectedAllocation.allocationNumber,
      contractId: selectedAllocation.contractId,
      contractNumber: selectedAllocation.contractNumber,
      customerId: selectedAllocation.customerId,
      customerName: selectedAllocation.customerName,
      companyName: selectedAllocation.companyName,
      modelId: selectedAllocation.modelId,
      modelName: selectedAllocation.modelName,
      unitId: selectedAllocation.unitId,
      unitCode: selectedAllocation.unitCode,
      projectName: selectedAllocation.projectName,
      location: selectedAllocation.location,
      rentalStart: selectedAllocation.startDate,
      rentalEnd: selectedAllocation.expectedEndDate,
      operator: '',
      transportation: '',
      diesel: '',
      deliveryDate,
      deliveryTime,
      driverContact,
      siteContactName,
      siteContactMobile,
      deliveryNotes,
      condition,
      acknowledgment: acknowledgment.confirmed ? acknowledgment : null,
      status,
      deliveryPhotos: [],
      signedAcknowledgmentDoc: '',
      internalDocuments: [],
      returnRecord: null,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentEmployee.fullName,
    };

    addDelivery(record);
    onClose();
  };

  const updateCondition = (patch: Partial<DeliveryCondition>) => setCondition((prev) => ({ ...prev, ...patch }));
  const updateAck = (patch: Partial<DeliveryAcknowledgment>) => setAcknowledgment((prev) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <Truck size={20} className="text-yellow-accent" />
            {ar ? 'تسليم جديد' : 'New Delivery'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Allocation selection */}
          <div>
            <label className={labelClass}>{ar ? 'التخصيص' : 'Allocation'} *</label>
            <select className={inputClass} value={allocationId} onChange={(e) => setAllocationId(e.target.value)}>
              <option value="">{ar ? '— اختر تخصيص —' : '— Select allocation —'}</option>
              {eligibleAllocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.allocationNumber} — {a.contractNumber} — {a.companyName || a.customerName} — {a.modelName} → {a.unitCode}
                </option>
              ))}
            </select>
            {eligibleAllocations.length === 0 && (
              <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                {ar ? 'لا توجد تخصيصات متاحة للتسليم' : 'No allocations available for delivery'}
              </p>
            )}
          </div>

          {/* Auto-imported info */}
          {selectedAllocation && (
            <div className="card-industrial p-4 bg-black/5 dark:bg-white/5">
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'بيانات مستوردة' : 'Imported Info'}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'العقد' : 'Contract'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.contractNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.customerName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.companyName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموديل' : 'Model'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.modelName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الوحدة' : 'Unit'}: </span><span className="font-mono font-semibold text-base-primary">{selectedAllocation.unitCode}</span></div>
                <div><span className="text-base-muted">{ar ? 'المشروع' : 'Project'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.projectName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.location || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الإيجار' : 'Rental'}: </span><span className="font-semibold text-base-primary">{selectedAllocation.startDate} → {selectedAllocation.expectedEndDate}</span></div>
              </div>
            </div>
          )}

          {/* Delivery details */}
          {selectedAllocation && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{ar ? 'تاريخ التسليم' : 'Delivery Date'} *</label>
                  <input type="date" className={inputClass} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{ar ? 'وقت التسليم' : 'Delivery Time'}</label>
                  <input type="time" className={inputClass} value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{ar ? 'السائق / جهة الاتصال' : 'Driver / Delivery Contact'}</label>
                  <input className={inputClass} value={driverContact} onChange={(e) => setDriverContact(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{ar ? 'اسم جهة الموقع' : 'Site Contact Name'}</label>
                  <input className={inputClass} value={siteContactName} onChange={(e) => setSiteContactName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{ar ? 'جوال جهة الموقع' : 'Site Contact Mobile'}</label>
                <input className={inputClass} value={siteContactMobile} onChange={(e) => setSiteContactMobile(e.target.value)} dir="ltr" />
              </div>
              <div>
                <label className={labelClass}>{ar ? 'ملاحظات التسليم' : 'Delivery Notes'}</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
              </div>

              {/* Condition checklist */}
              <div className="card-industrial p-4 space-y-3">
                <h4 className="text-xs font-bold text-yellow-accent uppercase">{ar ? 'حالة التسليم' : 'Delivery Condition'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{ar ? 'الحالة العامة' : 'General Condition'}</label>
                    <select className={inputClass} value={condition.generalCondition} onChange={(e) => updateCondition({ generalCondition: e.target.value as ConditionRating })}>
                      {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{ar ? 'مستوى الوقود' : 'Fuel Level'}</label>
                    <select className={inputClass} value={condition.fuelLevel} onChange={(e) => updateCondition({ fuelLevel: e.target.value as FuelLevel })}>
                      {allFuelLevels.map((f) => <option key={f} value={f}>{ar ? fuelLevelLabels[f].ar : fuelLevelLabels[f].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{ar ? 'الإطارات/الجنزير' : 'Tires/Tracks'}</label>
                    <select className={inputClass} value={condition.tiresTracks} onChange={(e) => updateCondition({ tiresTracks: e.target.value as ConditionRating })}>
                      {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{ar ? 'المحرك/التشغيل' : 'Engine/Operating'}</label>
                    <select className={inputClass} value={condition.engineOperating} onChange={(e) => updateCondition({ engineOperating: e.target.value as ConditionRating })}>
                      {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{ar ? 'الملحقات' : 'Attachments'}</label>
                    <select className={inputClass} value={condition.attachments} onChange={(e) => updateCondition({ attachments: e.target.value as ConditionRating })}>
                      {allConditionRatings.map((c) => <option key={c} value={c}>{ar ? conditionRatingLabels[c].ar : conditionRatingLabels[c].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{ar ? 'عدادات الساعات' : 'Hour Meter'}</label>
                    <input className={inputClass} value={condition.hourMeter} onChange={(e) => updateCondition({ hourMeter: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={condition.visibleDamage} onChange={(e) => updateCondition({ visibleDamage: e.target.checked })} className="w-4 h-4 accent-yellow-accent" />
                  {ar ? 'يوجد ضرر ظاهر' : 'Visible damage'}
                </label>
                {condition.visibleDamage && (
                  <input className={inputClass} placeholder={ar ? 'وصف الضرر' : 'Damage description'} value={condition.damageDescription} onChange={(e) => updateCondition({ damageDescription: e.target.value })} />
                )}
                <textarea rows={2} className={`${inputClass} resize-none`} placeholder={ar ? 'ملاحظات الحالة' : 'Condition notes'} value={condition.notes} onChange={(e) => updateCondition({ notes: e.target.value })} />
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>{ar ? 'الحالة' : 'Status'}</label>
                <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as DeliveryStatus)}>
                  {allDeliveryStatuses.filter((s) => s !== 'cancelled').map((s) => <option key={s} value={s}>{ar ? deliveryStatusLabels[s].ar : deliveryStatusLabels[s].en}</option>)}
                </select>
              </div>

              {/* Acknowledgment */}
              <div className="card-industrial p-4 space-y-3">
                <h4 className="text-xs font-bold text-yellow-accent uppercase">{ar ? 'إقرار الاستلام' : 'Customer Acknowledgment'}</h4>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={acknowledgment.confirmed} onChange={(e) => updateAck({ confirmed: e.target.checked })} className="w-4 h-4 accent-yellow-accent" />
                  {ar ? 'تم استلام المعدة من قبل العميل' : 'Customer confirmed receipt'}
                </label>
                {acknowledgment.confirmed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{ar ? 'اسم الممثل' : 'Representative Name'}</label>
                      <input className={inputClass} value={acknowledgment.representativeName} onChange={(e) => updateAck({ representativeName: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>{ar ? 'الجوال' : 'Mobile'}</label>
                      <input className={inputClass} value={acknowledgment.representativeMobile} onChange={(e) => updateAck({ representativeMobile: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!canSave} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {ar ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
