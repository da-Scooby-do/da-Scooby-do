import { useState, useMemo } from 'react';
import { X, Save, AlertTriangle, Check, Shuffle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useContract } from '@/contract/ContractContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import { useAllocation } from '../AllocationContext';
import { useEmployee } from '../EmployeeContext';
import {
  unitStatusLabels, unitStatusColors, conditionLabels, conditionColors, sourceTypeLabels,
  type ActualEquipmentUnit,
} from '../equipment-unit-types';
import {
  allocationStatusLabels, createEmptyAllocation,
  type EquipmentAllocation, type AllocationStatus,
} from '../allocation-types';

interface Props {
  onClose: () => void;
}

export default function AllocationFormModal({ onClose }: Props) {
  const { lang } = useApp();
  const { models } = useAdmin();
  const { contracts } = useContract();
  const { units, sources } = useEquipmentUnit();
  const { hasConflict, addAllocation } = useAllocation();
  const { currentEmployee } = useEmployee();
  const ar = lang === 'ar';

  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [assignedEmployeeName, setAssignedEmployeeName] = useState(currentEmployee?.fullName ?? '');
  const [internalNotes, setInternalNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [status, setStatus] = useState<AllocationStatus>('reserved');
  const [showOverride, setShowOverride] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  // Only signed or active contracts are eligible for allocation
  const eligibleContracts = contracts.filter((c) => c.status === 'signed' || c.status === 'active');

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedContractId) || null,
    [contracts, selectedContractId],
  );

  // Suggest matching units based on contract's equipment model
  const contractModelId = selectedContract?.items[0]?.description
    ? models.find((m) => selectedContract.items[0]?.description.includes(m.name_en) || selectedContract.items[0]?.description.includes(m.name_ar))?.id
    : undefined;

  const suggestedUnits = useMemo(() => {
    if (!selectedContract) return [];
    // Match by model name in contract items description
    return units.filter((u) => {
      const model = models.find((m) => u.modelId === m.id);
      if (!model) return false;
      // Check if the unit's model name appears in any contract item description
      return selectedContract.items.some(
        (item) => item.description.includes(model.name_en) || item.description.includes(model.name_ar),
      );
    });
  }, [selectedContract, units, models]);

  const allEligibleUnits = units.filter((u) => u.status !== 'archived');

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;
  const unitSource = sources.find((s) => s.id === selectedUnit?.sourceId);
  const conflict = selectedUnitId && startDate && expectedEndDate
    ? hasConflict(selectedUnitId, startDate, expectedEndDate)
    : null;

  const canSave = selectedContract && selectedUnitId && startDate && expectedEndDate && assignedEmployeeName;

  const handleSave = async () => {
    if (!canSave || !selectedContract || !selectedUnit || !currentEmployee) return;

    // If unit is unavailable or has conflict, require override reason
    if ((conflict || (selectedUnit.status !== 'available' && selectedUnit.status !== 'reserved' && selectedUnit.status !== 'rented')) && !overrideReason.trim()) {
      setShowOverride(true);
      return;
    }

    const model = models.find((m) => m.id === selectedUnit.modelId);

    const alloc: EquipmentAllocation = {
      ...createEmptyAllocation(),
      contractId: selectedContract.id,
      contractNumber: selectedContract.contractNumber,
      requestId: selectedContract.requestId,
      requestNumber: selectedContract.requestNumber,
      customerId: selectedContract.customerId,
      customerName: selectedContract.customerName,
      companyName: selectedContract.company.companyName,
      modelId: selectedUnit.modelId,
      modelName: model ? (ar ? model.name_ar : model.name_en) : '',
      unitId: selectedUnit.id,
      unitCode: selectedUnit.unitId,
      projectName: selectedContract.projectName,
      location: selectedContract.location,
      startDate,
      expectedEndDate,
      assignedEmployeeId: currentEmployee.id,
      assignedEmployeeName,
      status,
      overrideReason,
      internalNotes,
    };

    setSaving(true);
    setSaveError(null);
    try {
      await addAllocation(alloc, currentEmployee.id, currentEmployee.fullName);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('exclude_overlapping_active_allocations') || msg.includes('overlapping')) {
        setSaveError(ar ? 'تعارض في الحجز: هذه الوحدة مخصصة بالفعل لفترة متداخلة' : 'Booking conflict: this unit is already allocated for an overlapping period');
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <Shuffle size={20} className="text-yellow-accent" />
            {ar ? 'تخصيص معدة' : 'New Allocation'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contract selection */}
          <div>
            <label className={labelClass}>{ar ? 'العقد' : 'Contract'} *</label>
            <select className={inputClass} value={selectedContractId} onChange={(e) => setSelectedContractId(e.target.value)}>
              <option value="">{ar ? '— اختر عقد —' : '— Select contract —'}</option>
              {eligibleContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} — {c.company.companyName || c.customerName} — {c.projectName || '—'}
                </option>
              ))}
            </select>
            {eligibleContracts.length === 0 && (
              <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                {ar ? 'لا توجد عقود موقعة أو سارية' : 'No signed or active contracts available'}
              </p>
            )}
          </div>

          {/* Contract summary */}
          {selectedContract && (
            <div className="card-industrial p-4 bg-black/5 dark:bg-white/5">
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'بيانات العقد' : 'Contract Info'}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'رقم العقد' : 'Contract'}: </span><span className="font-semibold text-base-primary">{selectedContract.contractNumber}</span></div>
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{selectedContract.customerName}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{selectedContract.company.companyName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'المشروع' : 'Project'}: </span><span className="font-semibold text-base-primary">{selectedContract.projectName || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{selectedContract.location || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{selectedContract.duration || '—'}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-base">
                <div className="text-xs font-bold text-base-muted uppercase mb-2">{ar ? 'البنود' : 'Items'}</div>
                {selectedContract.items.map((item, i) => (
                  <div key={i} className="text-xs text-base-muted">{i + 1}. {item.description} (×{item.quantity})</div>
                ))}
              </div>
            </div>
          )}

          {/* Unit selection */}
          {selectedContract && (
            <div>
              <label className={labelClass}>{ar ? 'الوحدة الفعلية' : 'Actual Unit'} *</label>
              {suggestedUnits.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-green-500 font-semibold mb-1.5 flex items-center gap-1">
                    <Check size={12} />
                    {ar ? `وحدات مقترحة (${suggestedUnits.length})` : `Suggested Units (${suggestedUnits.length})`}
                  </p>
                  <div className="space-y-1.5">
                    {suggestedUnits.map((u) => (
                      <UnitOption
                        key={u.id}
                        unit={u}
                        sourceName={sources.find((s) => s.id === u.sourceId)?.name ?? ''}
                        sourceType={sources.find((s) => s.id === u.sourceId)?.type}
                        selected={selectedUnitId === u.id}
                        onClick={() => setSelectedUnitId(u.id)}
                        lang={lang}
                      />
                    ))}
                  </div>
                </div>
              )}
              <select className={inputClass} value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)}>
                <option value="">{ar ? '— اختر وحدة —' : '— Select unit —'}</option>
                {allEligibleUnits.map((u) => {
                  const model = models.find((m) => m.id === u.modelId);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.unitId} — {model ? (ar ? model.name_ar : model.name_en) : '—'} ({ar ? unitStatusLabels[u.status].ar : unitStatusLabels[u.status].en})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Unit summary */}
          {selectedUnit && (
            <div className="card-industrial p-4 space-y-3">
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملخص الوحدة (داخلي)' : 'Unit Summary (Internal)'}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'رقم الوحدة' : 'Unit ID'}: </span><span className="font-mono font-semibold text-base-primary">{selectedUnit.unitId}</span></div>
                <div><span className="text-base-muted">{ar ? 'سنة الصنع' : 'Year'}: </span><span className="font-semibold text-base-primary">{selectedUnit.year || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{selectedUnit.currentRegion}, {selectedUnit.currentCity}</span></div>
                <div><span className="text-base-muted">{ar ? 'الحالة' : 'Condition'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionColors[selectedUnit.condition]}`}>{ar ? conditionLabels[selectedUnit.condition].ar : conditionLabels[selectedUnit.condition].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'حالة الوحدة' : 'Status'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${unitStatusColors[selectedUnit.status]}`}>{ar ? unitStatusLabels[selectedUnit.status].ar : unitStatusLabels[selectedUnit.status].en}</span></div>
                <div><span className="text-base-muted">{ar ? 'آخر فحص' : 'Last Inspection'}: </span><span className="font-semibold text-base-primary">{selectedUnit.lastInspectionDate || '—'}</span></div>
                {unitSource && <div><span className="text-base-muted">{ar ? 'المصدر' : 'Source'}: </span><span className="font-semibold text-base-primary">{ar ? sourceTypeLabels[unitSource.type].ar : sourceTypeLabels[unitSource.type].en}</span></div>}
              </div>
              {selectedUnit.internalNotes && <div className="text-xs text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: {selectedUnit.internalNotes}</div>}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'تاريخ البدء' : 'Start Date'} *</label>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'تاريخ الانتهاء المتوقع' : 'Expected End Date'} *</label>
              <input type="date" className={inputClass} value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
            </div>
          </div>

          {/* Conflict warning */}
          {conflict && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">{ar ? 'تعارض في الحجز' : 'Booking Conflict'}</div>
                <div className="text-xs mt-0.5">
                  {ar ? `هذه الوحدة محجوزة بتخصيص ${conflict.allocationNumber} من ${conflict.startDate} إلى ${conflict.expectedEndDate}` : `This unit is allocated under ${conflict.allocationNumber} from ${conflict.startDate} to ${conflict.expectedEndDate}`}
                </div>
              </div>
            </div>
          )}

          {/* Status + Assigned employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'الحالة' : 'Status'}</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as AllocationStatus)}>
                <option value="pending">{ar ? allocationStatusLabels.pending.ar : allocationStatusLabels.pending.en}</option>
                <option value="reserved">{ar ? allocationStatusLabels.reserved.ar : allocationStatusLabels.reserved.en}</option>
                <option value="allocated">{ar ? allocationStatusLabels.allocated.ar : allocationStatusLabels.allocated.en}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الموظف المسؤول' : 'Assigned Employee'} *</label>
              <input className={inputClass} value={assignedEmployeeName} onChange={(e) => setAssignedEmployeeName(e.target.value)} />
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات داخلية' : 'Internal Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>

          {/* Override reason */}
          {showOverride && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 space-y-2">
              <p className="text-sm font-semibold text-orange-500 flex items-center gap-2">
                <AlertTriangle size={16} />
                {ar ? 'سبب التجاوز مطلوب' : 'Override Reason Required'}
              </p>
              <textarea rows={2} className={`${inputClass} resize-none`} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder={ar ? 'سبب التجاوز...' : 'Reason for override...'} />
            </div>
          )}
          {!showOverride && (conflict || (selectedUnit && selectedUnit.status !== 'available' && selectedUnit.status !== 'reserved' && selectedUnit.status !== 'rented')) && (
            <div>
              <label className={labelClass}>{ar ? 'سبب التجاوز (إن وجد)' : 'Override Reason (if applicable)'}</label>
              <textarea rows={2} className={`${inputClass} resize-none`} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder={ar ? 'سبب تجاوز القيود...' : 'Reason for overriding restrictions...'} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          {saveError && (
            <div className="flex-1 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-1.5">
              <AlertTriangle size={14} className="flex-shrink-0" /> {saveError}
            </div>
          )}
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!canSave || saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ التخصيص' : 'Save Allocation')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unit Option Component ──────────────────────────────────────

function UnitOption({ unit, sourceName, sourceType, selected, onClick, lang }: {
  unit: ActualEquipmentUnit;
  sourceName: string;
  sourceType?: 'sahab_owned' | 'partner_owner';
  selected: boolean;
  onClick: () => void;
  lang: string;
}) {
  const ar = lang === 'ar';
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border-2 text-start transition-all ${
        selected ? 'border-yellow-accent bg-yellow-accent/10' : 'border-base hover:border-yellow-accent/50'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-mono font-bold text-base-primary">{unit.unitId}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${unitStatusColors[unit.status]}`}>
          {ar ? unitStatusLabels[unit.status].ar : unitStatusLabels[unit.status].en}
        </span>
      </div>
      <div className="text-xs text-base-muted">
        {unit.currentRegion}, {unit.currentCity} • {ar ? conditionLabels[unit.condition].ar : conditionLabels[unit.condition].en}
      </div>
      {sourceName && <div className="text-xs text-base-muted mt-0.5">{sourceName}</div>}
    </button>
  );
}
