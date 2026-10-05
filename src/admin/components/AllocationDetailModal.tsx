import { useState } from 'react';
import { X, History, AlertTriangle, Check, Ban, Unlock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAllocation } from '../AllocationContext';
import { useEmployee } from '../EmployeeContext';
import { useEquipmentUnit } from '../EquipmentUnitContext';
import { useAdmin } from '../AdminContext';
import {
  allocationStatusLabels, allocationStatusColors, historyActionLabels,
  type EquipmentAllocation, type AllocationStatus,
} from '../allocation-types';
import {
  unitStatusLabels, unitStatusColors, conditionLabels, conditionColors, sourceTypeLabels,
} from '../equipment-unit-types';

interface Props {
  allocation: EquipmentAllocation;
  onClose: () => void;
}

export default function AllocationDetailModal({ allocation, onClose }: Props) {
  const { lang } = useApp();
  const { getAllocation, setAllocationStatus, cancelAllocation, releaseAllocation, historyByAllocation } = useAllocation();
  const { can, currentEmployee } = useEmployee();
  const { units, sources } = useEquipmentUnit();
  const { models } = useAdmin();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const ar = lang === 'ar';

  // Get fresh allocation data
  const alloc = getAllocation(allocation.id) || allocation;
  const unit = units.find((u) => u.id === alloc.unitId);
  const unitSource = sources.find((s) => s.id === unit?.sourceId);
  const history = historyByAllocation(alloc.id);

  const canManage = can('rental_requests', 'manage') || can('rental_requests', 'edit');
  const isActive = alloc.status === 'pending' || alloc.status === 'reserved' || alloc.status === 'allocated';

  const handleStatusChange = (newStatus: AllocationStatus) => {
    if (!currentEmployee) return;
    setAllocationStatus(alloc.id, newStatus, currentEmployee.id, currentEmployee.fullName);
  };

  const handleCancel = () => {
    if (!currentEmployee || !cancelReason.trim()) return;
    cancelAllocation(alloc.id, currentEmployee.id, currentEmployee.fullName, cancelReason);
    setShowCancelForm(false);
    setCancelReason('');
  };

  const handleRelease = () => {
    if (!currentEmployee) return;
    releaseAllocation(alloc.id, currentEmployee.id, currentEmployee.fullName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
              <span className="font-mono text-yellow-accent">{alloc.allocationNumber}</span>
            </h3>
            <p className="text-xs text-base-muted">{ar ? 'عقد' : 'Contract'}: {alloc.contractNumber} • {alloc.companyName || alloc.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${allocationStatusColors[alloc.status]}`}>
              {ar ? allocationStatusLabels[alloc.status].ar : allocationStatusLabels[alloc.status].en}
            </span>
            <span className="text-xs text-base-muted">{ar ? 'أنشئ في' : 'Created'}: {alloc.createdAt}</span>
          </div>

          {/* Allocation info */}
          <div>
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'بيانات التخصيص' : 'Allocation Info'}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-base-muted">{ar ? 'الموديل' : 'Model'}: </span><span className="font-semibold text-base-primary">{alloc.modelName}</span></div>
              <div><span className="text-base-muted">{ar ? 'الوحدة' : 'Unit'}: </span><span className="font-mono font-semibold text-base-primary">{alloc.unitCode}</span></div>
              <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{alloc.customerName}</span></div>
              <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{alloc.companyName || '—'}</span></div>
              <div><span className="text-base-muted">{ar ? 'المشروع' : 'Project'}: </span><span className="font-semibold text-base-primary">{alloc.projectName || '—'}</span></div>
              <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{alloc.location || '—'}</span></div>
              <div><span className="text-base-muted">{ar ? 'تاريخ البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{alloc.startDate}</span></div>
              <div><span className="text-base-muted">{ar ? 'الانتهاء المتوقع' : 'Expected End'}: </span><span className="font-semibold text-base-primary">{alloc.expectedEndDate}</span></div>
              <div><span className="text-base-muted">{ar ? 'الموظف المسؤول' : 'Assigned'}: </span><span className="font-semibold text-base-primary">{alloc.assignedEmployeeName}</span></div>
            </div>
          </div>

          {/* Unit details (internal) */}
          {unit && (
            <div>
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'تفاصيل الوحدة (داخلي)' : 'Unit Details (Internal)'}</h4>
              <div className="p-3 rounded-lg bg-base border border-base">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'رقم الوحدة' : 'Unit ID'}: </span><span className="font-mono font-semibold text-base-primary">{unit.unitId}</span></div>
                  <div><span className="text-base-muted">{ar ? 'سنة الصنع' : 'Year'}: </span><span className="font-semibold text-base-primary">{unit.year || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الرقم التسلسلي' : 'Serial'}: </span><span className="font-mono font-semibold text-base-primary">{unit.serialNumber || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الحالة' : 'Condition'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${conditionColors[unit.condition]}`}>{ar ? conditionLabels[unit.condition].ar : conditionLabels[unit.condition].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'حالة الوحدة' : 'Status'}: </span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${unitStatusColors[unit.status]}`}>{ar ? unitStatusLabels[unit.status].ar : unitStatusLabels[unit.status].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{unit.currentRegion}, {unit.currentCity}</span></div>
                  <div><span className="text-base-muted">{ar ? 'آخر فحص' : 'Last Inspection'}: </span><span className="font-semibold text-base-primary">{unit.lastInspectionDate || '—'}</span></div>
                  {unitSource && <div><span className="text-base-muted">{ar ? 'المصدر' : 'Source'}: </span><span className="font-semibold text-base-primary">{ar ? sourceTypeLabels[unitSource.type].ar : sourceTypeLabels[unitSource.type].en}</span></div>}
                </div>
                {unit.internalNotes && <div className="text-xs text-base-muted mt-2">{ar ? 'ملاحظات' : 'Notes'}: {unit.internalNotes}</div>}
              </div>
            </div>
          )}

          {/* Override reason */}
          {alloc.overrideReason && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-xs font-semibold text-orange-500 mb-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {ar ? 'سبب التجاوز' : 'Override Reason'}
              </div>
              <div className="text-sm text-base-primary">{alloc.overrideReason}</div>
            </div>
          )}

          {/* Internal notes */}
          {alloc.internalNotes && (
            <div>
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'ملاحظات داخلية' : 'Internal Notes'}</h4>
              <div className="text-sm text-base-primary">{alloc.internalNotes}</div>
            </div>
          )}

          {/* History */}
          <div>
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1">
              <History size={14} />
              {ar ? 'سجل التخصيص' : 'Allocation History'}
            </h4>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 p-2 rounded-lg bg-base border border-base">
                  <div className="w-8 h-8 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-yellow-accent">{h.employeeName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-base-primary">{h.employeeName}</span>
                      <span className="text-xs text-base-muted">•</span>
                      <span className="text-sm text-base-primary">{ar ? historyActionLabels[h.action].ar : historyActionLabels[h.action].en}</span>
                    </div>
                    {h.reason && <div className="text-xs text-base-muted mt-0.5">{h.reason}</div>}
                    <div className="text-xs text-base-muted mt-0.5">{new Date(h.timestamp).toLocaleString(ar ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status actions */}
          {canManage && isActive && (
            <div className="pt-3 border-t border-base space-y-3">
              <h4 className="text-xs font-bold text-base-muted uppercase">{ar ? 'إجراءات' : 'Actions'}</h4>
              <div className="flex flex-wrap gap-2">
                {alloc.status === 'pending' && (
                  <button onClick={() => handleStatusChange('reserved')} className="btn-primary text-sm flex items-center gap-2">
                    <Check size={16} /> {ar ? 'حجز' : 'Reserve'}
                  </button>
                )}
                {alloc.status === 'reserved' && (
                  <button onClick={() => handleStatusChange('allocated')} className="btn-primary text-sm flex items-center gap-2">
                    <Check size={16} /> {ar ? 'تخصيص' : 'Allocate'}
                  </button>
                )}
                {alloc.status === 'allocated' && (
                  <button onClick={handleRelease} className="btn-secondary text-sm flex items-center gap-2">
                    <Unlock size={16} /> {ar ? 'تحرير' : 'Release'}
                  </button>
                )}
                <button onClick={() => setShowCancelForm(!showCancelForm)} className="btn-secondary text-sm flex items-center gap-2 text-red-500">
                  <Ban size={16} /> {ar ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Cancel form */}
              {showCancelForm && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                  <label className="block text-xs font-semibold text-red-500">{ar ? 'سبب الإلغاء' : 'Cancel Reason'} *</label>
                  <textarea rows={2} className="w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-red-500 focus:outline-none resize-none" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                  <button onClick={handleCancel} disabled={!cancelReason.trim()} className="btn-primary text-sm text-red-500 flex items-center gap-2 disabled:opacity-50">
                    <Ban size={16} /> {ar ? 'تأكيد الإلغاء' : 'Confirm Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
