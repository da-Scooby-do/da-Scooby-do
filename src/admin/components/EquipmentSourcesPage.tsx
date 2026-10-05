import { useState } from 'react';
import { Warehouse, Plus, Pencil, Trash2, X, Save, Phone, Mail } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import {
  sourceTypeLabels, allSourceTypes,
  type EquipmentSource, type SourceType,
  createEmptySource,
} from '../equipment-unit-types';

export default function EquipmentSourcesPage() {
  const { lang } = useApp();
  const { sources, units, addSource, updateSource, deleteSource } = useEquipmentUnit();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EquipmentSource | null>(null);

  const ar = lang === 'ar';

  const handleEdit = (src: EquipmentSource) => {
    setEditing(src);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleDelete = (src: EquipmentSource) => {
    const usedCount = units.filter((u) => u.sourceId === src.id).length;
    if (usedCount > 0) {
      alert(ar ? `لا يمكن حذف هذا المصدر - مرتبط بـ ${usedCount} وحدة` : `Cannot delete - linked to ${usedCount} units`);
      return;
    }
    if (confirm(ar ? `حذف "${src.name}"؟` : `Delete "${src.name}"?`)) {
      deleteSource(src.id);
    }
  };

  const getUnitCount = (sourceId: string) => units.filter((u) => u.sourceId === sourceId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Warehouse size={28} className="text-yellow-accent" />
            {ar ? 'مصادر المعدات' : 'Equipment Sources'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${sources.length} مصدر` : `${sources.length} sources`}</p>
        </div>
        <button onClick={handleAdd} className="btn-primary text-sm">
          <Plus size={16} />
          {ar ? 'إضافة مصدر' : 'Add Source'}
        </button>
      </div>

      {/* Sources grid */}
      {sources.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Warehouse size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد مصادر' : 'No sources'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <div key={src.id} className="card-industrial p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-base-primary">{src.name}</h3>
                  <span className="text-xs font-semibold text-yellow-accent">{ar ? sourceTypeLabels[src.type].ar : sourceTypeLabels[src.type].en}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(src)} className="p-1.5 rounded-lg text-base-muted hover:text-blue-500 hover:bg-blue-500/10">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(src)} className="p-1.5 rounded-lg text-base-muted hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {src.contactName && <div className="text-base-primary">{src.contactName}</div>}
                {src.contactPhone && <div className="flex items-center gap-1.5 text-base-muted"><Phone size={12} /> <span dir="ltr">{src.contactPhone}</span></div>}
                {src.contactEmail && <div className="flex items-center gap-1.5 text-base-muted"><Mail size={12} /> <span dir="ltr">{src.contactEmail}</span></div>}
              </div>

              {src.agreementReference && (
                <div className="text-xs text-base-muted">{ar ? 'مرجع الاتفاق' : 'Agreement'}: <span className="font-mono font-semibold text-base-primary">{src.agreementReference}</span></div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-base">
                <div className="text-xs text-base-muted">{ar ? 'الوحدات المرتبطة' : 'Linked Units'}: <span className="font-bold text-base-primary">{getUnitCount(src.id)}</span></div>
                {src.internalCost > 0 && <div className="text-xs text-base-muted">{ar ? 'التكلفة' : 'Cost'}: {src.internalCost.toLocaleString()} {ar ? 'ر.س' : 'SAR'}</div>}
              </div>

              {src.commissionMarginNotes && (
                <div className="p-2 rounded-lg bg-yellow-accent/5 border border-yellow-accent/10 text-xs text-base-muted">{src.commissionMarginNotes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SourceForm existing={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

// ─── Source Form Modal ──────────────────────────────────────────

function SourceForm({ existing, onClose }: { existing: EquipmentSource | null; onClose: () => void }) {
  const { lang } = useApp();
  const { addSource, updateSource } = useEquipmentUnit();
  const ar = lang === 'ar';
  const [form, setForm] = useState<EquipmentSource>(existing ?? createEmptySource());
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (existing) {
      updateSource(form);
    } else {
      addSource(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <Warehouse size={20} className="text-yellow-accent" />
            {existing ? (ar ? 'تعديل مصدر' : 'Edit Source') : (ar ? 'إضافة مصدر' : 'Add Source')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{ar ? 'نوع المصدر' : 'Source Type'} *</label>
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SourceType })}>
              {allSourceTypes.map((t) => <option key={t} value={t}>{ar ? sourceTypeLabels[t].ar : sourceTypeLabels[t].en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الاسم' : 'Name'} *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={ar ? 'اسم الشركة أو المالك' : 'Company or owner name'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'اسم المسؤول' : 'Contact Name'}</label>
              <input className={inputClass} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الهاتف' : 'Phone'}</label>
              <input className={inputClass} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'البريد' : 'Email'}</label>
            <input type="email" className={inputClass} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'مرجع الاتفاق الداخلي' : 'Internal Agreement Reference'}</label>
            <input className={inputClass} value={form.agreementReference} onChange={(e) => setForm({ ...form, agreementReference: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'التكلفة الداخلية' : 'Internal Cost'}</label>
            <input type="number" min={0} className={inputClass} value={form.internalCost} onChange={(e) => setForm({ ...form, internalCost: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات العمولة / الهامش' : 'Commission / Margin Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.commissionMarginNotes} onChange={(e) => setForm({ ...form, commissionMarginNotes: e.target.value })} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!form.name.trim()} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {existing ? (ar ? 'حفظ' : 'Save') : (ar ? 'إضافة' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
