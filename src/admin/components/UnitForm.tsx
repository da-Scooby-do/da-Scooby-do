import { useState } from 'react';
import { X, Save, Boxes } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import {
  unitStatusLabels, allUnitStatuses, conditionLabels, allConditions,
  sourceTypeLabels,
  type ActualEquipmentUnit, type UnitStatus, type UnitCondition,
} from '../equipment-unit-types';

interface Props {
  existing: ActualEquipmentUnit | null;
  onClose: () => void;
}

export default function UnitForm({ existing, onClose }: Props) {
  const { lang } = useApp();
  const { models, categories, brands } = useAdmin();
  const { sources, addUnit, updateUnit } = useEquipmentUnit();
  const ar = lang === 'ar';

  const [form, setForm] = useState<ActualEquipmentUnit>(
    existing ?? {
      id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      unitId: '',
      modelId: '',
      year: '',
      serialNumber: '',
      condition: 'good' as UnitCondition,
      lastInspectionDate: '',
      nextInspectionDate: '',
      maintenanceNotes: '',
      currentRegion: '',
      currentCity: '',
      currentLocation: '',
      status: 'available' as UnitStatus,
      availableFrom: '',
      currentContractReference: '',
      internalNotes: '',
      sourceId: sources[0]?.id ?? '',
      images: [],
      createdAt: new Date().toISOString().split('T')[0],
    },
  );

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const handleSave = () => {
    if (!form.unitId.trim() || !form.modelId) return;
    if (existing) {
      updateUnit(form);
    } else {
      addUnit(form);
    }
    onClose();
  };

  const getModelName = (modelId: string) => {
    const m = models.find((x) => x.id === modelId);
    return m ? (ar ? m.name_ar : m.name_en) : '';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <Boxes size={20} className="text-yellow-accent" />
            {existing ? (ar ? 'تعديل وحدة' : 'Edit Unit') : (ar ? 'إضافة وحدة' : 'Add Unit')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Unit ID + Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'رقم الوحدة' : 'Unit ID'} *</label>
              <input className={inputClass} value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} placeholder="CAT320-001" />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الموديل' : 'Equipment Model'} *</label>
              <select className={inputClass} value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}>
                <option value="">{ar ? '— اختر الموديل —' : '— Select model —'}</option>
                {models.map((m) => {
                  const cat = categories.find((c) => c.id === m.category_id);
                  const brand = brands.find((b) => b.id === m.brand_id);
                  return (
                    <option key={m.id} value={m.id}>
                      {ar ? m.name_ar : m.name_en} ({brand ? (ar ? brand.name_ar : brand.name_en) : ''} / {cat ? (ar ? cat.name_ar : cat.name_en) : ''})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Year + Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'سنة الصنع' : 'Year'}</label>
              <input className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2023" />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الرقم التسلسلي / المرجع الداخلي' : 'Serial Number / Internal Ref'}</label>
              <input className={inputClass} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
          </div>

          {/* Condition + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'الحالة' : 'Condition'}</label>
              <select className={inputClass} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as UnitCondition })}>
                {allConditions.map((c) => <option key={c} value={c}>{ar ? conditionLabels[c].ar : conditionLabels[c].en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'حالة الوحدة' : 'Unit Status'}</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UnitStatus })}>
                {allUnitStatuses.map((s) => <option key={s} value={s}>{ar ? unitStatusLabels[s].ar : unitStatusLabels[s].en}</option>)}
              </select>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className={labelClass}>{ar ? 'المصدر / المالك' : 'Source / Owner'}</label>
            <select className={inputClass} value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })}>
              <option value="">{ar ? '— اختر المصدر —' : '— Select source —'}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({ar ? sourceTypeLabels[s.type].ar : sourceTypeLabels[s.type].en})</option>
              ))}
            </select>
          </div>

          {/* Inspection dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'آخر فحص' : 'Last Inspection'}</label>
              <input type="date" className={inputClass} value={form.lastInspectionDate} onChange={(e) => setForm({ ...form, lastInspectionDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الفحص القادم' : 'Next Inspection'}</label>
              <input type="date" className={inputClass} value={form.nextInspectionDate} onChange={(e) => setForm({ ...form, nextInspectionDate: e.target.value })} />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'المنطقة' : 'Region'}</label>
              <input className={inputClass} value={form.currentRegion} onChange={(e) => setForm({ ...form, currentRegion: e.target.value })} placeholder={ar ? 'الرياض' : 'Riyadh'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'المدينة' : 'City'}</label>
              <input className={inputClass} value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الموقع' : 'Location'}</label>
              <input className={inputClass} value={form.currentLocation} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })} placeholder={ar ? 'مستودع سحاب' : 'SAHAB Depot'} />
            </div>
          </div>

          {/* Available from + Contract ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'متاح من' : 'Available From'}</label>
              <input type="date" className={inputClass} value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'مرجع العقد الحالي' : 'Current Contract Ref'}</label>
              <input className={inputClass} value={form.currentContractReference} onChange={(e) => setForm({ ...form, currentContractReference: e.target.value })} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات الصيانة' : 'Maintenance Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.maintenanceNotes} onChange={(e) => setForm({ ...form, maintenanceNotes: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات داخلية' : 'Internal Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} />
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>{ar ? 'صور داخلية (روابط)' : 'Internal Images (URLs)'}</label>
            <textarea rows={2} className={`${inputClass} resize-none font-mono text-xs`} value={form.images.join('\n')} onChange={(e) => setForm({ ...form, images: e.target.value.split('\n').filter(Boolean) })} placeholder="https://images.pexels.com/..." />
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {form.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-base border border-base">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!form.unitId.trim() || !form.modelId} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {existing ? (ar ? 'حفظ' : 'Save') : (ar ? 'إضافة' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
