import { useState } from 'react';
import { X, Wrench, ClipboardCheck, Image as ImageIcon, Plus, Trash2, Save, Calendar, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import {
  unitStatusLabels, unitStatusColors, conditionLabels, conditionColors,
  sourceTypeLabels, maintenanceStatusLabels, maintenanceStatusColors, allMaintenanceStatuses, allConditions,
  type ActualEquipmentUnit, type InspectionRecord, type MaintenanceRecord, type UnitCondition, type MaintenanceStatus,
  createEmptyInspection, createEmptyMaintenance,
} from '../equipment-unit-types';

interface Props {
  unit: ActualEquipmentUnit;
  onClose: () => void;
}

type Tab = 'details' | 'inspections' | 'maintenance' | 'images';

export default function UnitDetailModal({ unit, onClose }: Props) {
  const { lang } = useApp();
  const { models, categories, brands } = useAdmin();
  const { sources, inspectionsByUnit, maintenanceByUnit, addInspection, updateInspection, deleteInspection, addMaintenance, updateMaintenance, deleteMaintenance } = useEquipmentUnit();
  const [tab, setTab] = useState<Tab>('details');
  const [showInspForm, setShowInspForm] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [editingInsp, setEditingInsp] = useState<InspectionRecord | null>(null);
  const [editingMaint, setEditingMaint] = useState<MaintenanceRecord | null>(null);

  const ar = lang === 'ar';
  const model = models.find((m) => m.id === unit.modelId);
  const cat = model ? categories.find((c) => c.id === model.category_id) : null;
  const brand = model ? brands.find((b) => b.id === model.brand_id) : null;
  const source = sources.find((s) => s.id === unit.sourceId);

  const inspections = inspectionsByUnit(unit.id);
  const maintenanceRecords = maintenanceByUnit(unit.id);

  const tabs: { id: Tab; labelAr: string; labelEn: string; icon: typeof X }[] = [
    { id: 'details', labelAr: 'التفاصيل', labelEn: 'Details', icon: MapPin },
    { id: 'inspections', labelAr: 'الفحوصات', labelEn: 'Inspections', icon: ClipboardCheck },
    { id: 'maintenance', labelAr: 'الصيانة', labelEn: 'Maintenance', icon: Wrench },
    { id: 'images', labelAr: 'الصور', labelEn: 'Images', icon: ImageIcon },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
              <span className="font-mono text-yellow-accent">{unit.unitId}</span>
            </h3>
            <p className="text-xs text-base-muted">{model ? (ar ? model.name_ar : model.name_en) : '—'} • {unit.year}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base sticky top-[73px] bg-elevated z-[5]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${active ? 'text-yellow-accent border-b-2 border-yellow-accent' : 'text-base-muted hover:text-base-primary'}`}>
                <Icon size={16} />
                {ar ? t.labelAr : t.labelEn}
                {t.id === 'inspections' && inspections.length > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-base">{inspections.length}</span>}
                {t.id === 'maintenance' && maintenanceRecords.length > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-base">{maintenanceRecords.length}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* Details tab */}
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'الفئة' : 'Category'}: </span><span className="font-semibold text-base-primary">{cat ? (ar ? cat.name_ar : cat.name_en) : '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الماركة' : 'Brand'}: </span><span className="font-semibold text-base-primary">{brand ? (ar ? brand.name_ar : brand.name_en) : '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموديل' : 'Model'}: </span><span className="font-semibold text-base-primary">{model ? (ar ? model.name_ar : model.name_en) : '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'سنة الصنع' : 'Year'}: </span><span className="font-semibold text-base-primary">{unit.year || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الرقم التسلسلي' : 'Serial'}: </span><span className="font-semibold text-base-primary font-mono">{unit.serialNumber || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الحالة' : 'Condition'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionColors[unit.condition]}`}>{ar ? conditionLabels[unit.condition].ar : conditionLabels[unit.condition].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'حالة الوحدة' : 'Status'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${unitStatusColors[unit.status]}`}>{ar ? unitStatusLabels[unit.status].ar : unitStatusLabels[unit.status].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'متاح من' : 'Available From'}: </span><span className="font-semibold text-base-primary">{unit.availableFrom || '—'}</span></div>
              </div>

              <div className="h-px bg-base" />

              {/* Location */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الموقع الحالي' : 'Current Location'}</h4>
                <div className="text-sm text-base-primary">{unit.currentRegion}, {unit.currentCity}</div>
                <div className="text-sm text-base-muted">{unit.currentLocation}</div>
              </div>

              {/* Inspection dates */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'الفحوصات' : 'Inspections'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'آخر فحص' : 'Last'}: </span><span className="font-semibold text-base-primary">{unit.lastInspectionDate || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الفحص القادم' : 'Next'}: </span><span className="font-semibold text-base-primary">{unit.nextInspectionDate || '—'}</span></div>
                </div>
              </div>

              {/* Source */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'المصدر / المالك' : 'Source / Owner'}</h4>
                {source ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-base-primary">{source.name}</div>
                    <div className="text-base-muted">{ar ? sourceTypeLabels[source.type].ar : sourceTypeLabels[source.type].en}</div>
                    <div className="text-base-muted">{source.contactName} • {source.contactPhone}</div>
                    {source.agreementReference && <div className="text-base-muted">{ar ? 'مرجع الاتفاق' : 'Agreement'}: {source.agreementReference}</div>}
                    {source.internalCost > 0 && <div className="text-base-muted">{ar ? 'التكلفة الداخلية' : 'Internal Cost'}: {source.internalCost.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</div>}
                    {source.commissionMarginNotes && <div className="text-base-muted">{source.commissionMarginNotes}</div>}
                  </div>
                ) : <div className="text-sm text-base-muted">—</div>}
              </div>

              {/* Contract ref */}
              {unit.currentContractReference && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'مرجع العقد' : 'Contract Reference'}</h4>
                  <div className="text-sm font-semibold text-base-primary font-mono">{unit.currentContractReference}</div>
                </div>
              )}

              {/* Notes */}
              {unit.maintenanceNotes && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملاحظات الصيانة' : 'Maintenance Notes'}</h4>
                  <div className="text-sm text-base-primary">{unit.maintenanceNotes}</div>
                </div>
              )}
              {unit.internalNotes && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملاحظات داخلية' : 'Internal Notes'}</h4>
                  <div className="text-sm text-base-primary">{unit.internalNotes}</div>
                </div>
              )}
            </div>
          )}

          {/* Inspections tab */}
          {tab === 'inspections' && (
            <div className="space-y-3">
              <button onClick={() => { setEditingInsp(null); setShowInspForm(true); }} className="btn-secondary text-sm">
                <Plus size={16} /> {ar ? 'إضافة فحص' : 'Add Inspection'}
              </button>
              {inspections.length === 0 ? (
                <div className="text-center py-8 text-sm text-base-muted">{ar ? 'لا توجد فحوصات' : 'No inspections'}</div>
              ) : (
                inspections.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg bg-base border border-base">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-base-muted" />
                        <span className="text-sm font-semibold text-base-primary">{r.inspectionDate}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionColors[r.condition]}`}>{ar ? conditionLabels[r.condition].ar : conditionLabels[r.condition].en}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingInsp(r); setShowInspForm(true); }} className="p-1.5 rounded text-base-muted hover:text-blue-500"><Wrench size={14} /></button>
                        <button onClick={() => deleteInspection(r.id)} className="p-1.5 rounded text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="text-xs text-base-muted mb-1">{ar ? 'الفاحص' : 'Inspector'}: {r.inspector || '—'}</div>
                    {r.notes && <div className="text-sm text-base-primary">{r.notes}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Maintenance tab */}
          {tab === 'maintenance' && (
            <div className="space-y-3">
              <button onClick={() => { setEditingMaint(null); setShowMaintForm(true); }} className="btn-secondary text-sm">
                <Plus size={16} /> {ar ? 'إضافة صيانة' : 'Add Maintenance'}
              </button>
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-base-muted">{ar ? 'لا توجد سجلات صيانة' : 'No maintenance records'}</div>
              ) : (
                maintenanceRecords.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg bg-base border border-base">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-base-muted" />
                        <span className="text-sm font-semibold text-base-primary">{r.maintenanceDate}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${maintenanceStatusColors[r.status]}`}>{ar ? maintenanceStatusLabels[r.status].ar : maintenanceStatusLabels[r.status].en}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingMaint(r); setShowMaintForm(true); }} className="p-1.5 rounded text-base-muted hover:text-blue-500"><Wrench size={14} /></button>
                        <button onClick={() => deleteMaintenance(r.id)} className="p-1.5 rounded text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-base-primary">{r.description}</div>
                    {r.notes && <div className="text-sm text-base-muted mt-1">{r.notes}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Images tab */}
          {tab === 'images' && (
            <div>
              {unit.images.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
                  <p className="text-sm text-base-muted">{ar ? 'لا توجد صور داخلية' : 'No internal images'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {unit.images.map((img, i) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-base border border-base">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inspection form */}
        {showInspForm && (
          <InspectionFormModal
            existing={editingInsp}
            unitId={unit.id}
            onClose={() => { setShowInspForm(false); setEditingInsp(null); }}
            onSave={(r) => { editingInsp ? updateInspection(r) : addInspection(r); setShowInspForm(false); setEditingInsp(null); }}
          />
        )}

        {/* Maintenance form */}
        {showMaintForm && (
          <MaintenanceFormModal
            existing={editingMaint}
            unitId={unit.id}
            onClose={() => { setShowMaintForm(false); setEditingMaint(null); }}
            onSave={(r) => { editingMaint ? updateMaintenance(r) : addMaintenance(r); setShowMaintForm(false); setEditingMaint(null); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Inspection Form Modal ──────────────────────────────────────

function InspectionFormModal({ existing, unitId, onClose, onSave }: { existing: InspectionRecord | null; unitId: string; onClose: () => void; onSave: (r: InspectionRecord) => void }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [form, setForm] = useState<InspectionRecord>(existing ?? createEmptyInspection(unitId));
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-base flex items-center justify-between">
          <h4 className="font-bold text-base-primary">{existing ? (ar ? 'تعديل فحص' : 'Edit Inspection') : (ar ? 'إضافة فحص' : 'Add Inspection')}</h4>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={labelClass}>{ar ? 'تاريخ الفحص' : 'Inspection Date'}</label>
            <input type="date" className={inputClass} value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الفاحص' : 'Inspector'}</label>
            <input className={inputClass} value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الحالة' : 'Condition'}</label>
            <select className={inputClass} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as UnitCondition })}>
              {allConditions.map((c) => <option key={c} value={c}>{ar ? conditionLabels[c].ar : conditionLabels[c].en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="p-5 border-t border-base flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm flex items-center gap-2"><Save size={16} /> {ar ? 'حفظ' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance Form Modal ─────────────────────────────────────

function MaintenanceFormModal({ existing, unitId, onClose, onSave }: { existing: MaintenanceRecord | null; unitId: string; onClose: () => void; onSave: (r: MaintenanceRecord) => void }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [form, setForm] = useState<MaintenanceRecord>(existing ?? createEmptyMaintenance(unitId));
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-base flex items-center justify-between">
          <h4 className="font-bold text-base-primary">{existing ? (ar ? 'تعديل صيانة' : 'Edit Maintenance') : (ar ? 'إضافة صيانة' : 'Add Maintenance')}</h4>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={labelClass}>{ar ? 'تاريخ الصيانة' : 'Maintenance Date'}</label>
            <input type="date" className={inputClass} value={form.maintenanceDate} onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الوصف' : 'Description'}</label>
            <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الحالة' : 'Status'}</label>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}>
              {allMaintenanceStatuses.map((s) => <option key={s} value={s}>{ar ? maintenanceStatusLabels[s].ar : maintenanceStatusLabels[s].en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="p-5 border-t border-base flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm flex items-center gap-2"><Save size={16} /> {ar ? 'حفظ' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
