import { useState, useMemo } from 'react';
import { X, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useContract } from '@/contract/ContractContext';
import { useRenewal } from '../RenewalContext';
import { useEmployee } from '../EmployeeContext';
import {
  renewalPeriodLabels, allRenewalPeriods, customerClassificationLabels,
  type RenewalPeriod, type CustomerClassification,
} from '../renewal-types';

interface Props {
  onClose: () => void;
}

export default function RenewalFormModal({ onClose }: Props) {
  const { lang } = useApp();
  const { dbContracts } = useContract();
  const { createRenewal } = useRenewal();
  const { currentEmployee, can } = useEmployee();
  const ar = lang === 'ar';

  const [contractId, setContractId] = useState('');
  const [renewalPeriod, setRenewalPeriod] = useState<RenewalPeriod>('1_month');
  const [customDays, setCustomDays] = useState('');
  const [classification, setClassification] = useState<CustomerClassification>('standard');

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const activeContracts = useMemo(
    () => dbContracts.filter((c) => c.status === 'active'),
    [dbContracts],
  );

  const selectedContract = dbContracts.find((c) => c.id === contractId);
  const canCustom = can('contracts', 'manage');
  const canSave = contractId && currentEmployee && (renewalPeriod !== 'custom' || (customDays && parseInt(customDays) > 0));

  const handleSave = async () => {
    if (!canSave || !selectedContract || !currentEmployee) return;
    await createRenewal(selectedContract, {
      renewalPeriod,
      customPeriodDays: renewalPeriod === 'custom' ? parseInt(customDays) || 0 : 0,
      assignedEmployeeId: currentEmployee.id,
      assignedEmployeeName: currentEmployee.fullName,
      customerClassification: classification,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <RefreshCw size={20} className="text-yellow-accent" />
            {ar ? 'تجديد عقد جديد' : 'New Contract Renewal'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contract selection */}
          <div>
            <label className={labelClass}>{ar ? 'العقد النشط' : 'Active Contract'} *</label>
            <select className={inputClass} value={contractId} onChange={(e) => setContractId(e.target.value)}>
              <option value="">{ar ? '— اختر عقد —' : '— Select contract —'}</option>
              {activeContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_number} — {c.company_name || c.customer_name} — {c.title || '—'}
                </option>
              ))}
            </select>
            {activeContracts.length === 0 && (
              <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                {ar ? 'لا توجد عقود نشطة' : 'No active contracts'}
              </p>
            )}
          </div>

          {/* Auto-imported info */}
          {selectedContract && (
            <div className="card-industrial p-4 bg-black/5 dark:bg-white/5">
              <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'بيانات مستوردة' : 'Imported Info'}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{selectedContract.customer_name}</span></div>
                <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{selectedContract.company_name || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'العنوان' : 'Title'}: </span><span className="font-semibold text-base-primary">{selectedContract.title || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{selectedContract.start_date || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'الانتهاء' : 'End'}: </span><span className="font-semibold text-base-primary">{selectedContract.end_date || '—'}</span></div>
                <div><span className="text-base-muted">{ar ? 'القيمة' : 'Value'}: </span><span className="font-semibold text-base-primary">{selectedContract.contract_value.toLocaleString()} {selectedContract.currency}</span></div>
              </div>
            </div>
          )}

          {/* Renewal period */}
          {selectedContract && (
            <>
              <div>
                <label className={labelClass}>{ar ? 'فترة التجديد' : 'Renewal Period'} *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allRenewalPeriods.map((p) => {
                    const disabled = p === 'custom' && !canCustom;
                    return (
                      <button
                        key={p}
                        onClick={() => !disabled && setRenewalPeriod(p)}
                        disabled={disabled}
                        className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                          renewalPeriod === p
                            ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                            : 'border-base text-base-muted hover:text-base-primary'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {ar ? renewalPeriodLabels[p].ar : renewalPeriodLabels[p].en}
                      </button>
                    );
                  })}
                </div>
                {renewalPeriod === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="number"
                      className={inputClass}
                      placeholder={ar ? 'عدد الأيام' : 'Number of days'}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                    />
                  </div>
                )}
                {renewalPeriod === '12_months' && (
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {ar ? 'الفترات أطول من 6 أشهر قد تتطلب دورات تجديد منفصلة' : 'Periods longer than 6 months may require separate renewal cycles'}
                  </p>
                )}
              </div>

              {/* Customer classification */}
              <div>
                <label className={labelClass}>{ar ? 'تصنيف العميل' : 'Customer Classification'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['standard', 'trusted'] as CustomerClassification[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setClassification(c)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                        classification === c
                          ? c === 'trusted'
                            ? 'border-green-500 bg-green-500/10 text-green-500'
                            : 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                          : 'border-base text-base-muted hover:text-base-primary'
                      } ${c === 'trusted' && !can('contracts', 'manage') ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={c === 'trusted' && !can('contracts', 'manage')}
                    >
                      {ar ? customerClassificationLabels[c].ar : customerClassificationLabels[c].en}
                    </button>
                  ))}
                </div>
                {!can('contracts', 'manage') && (
                  <p className="text-xs text-base-muted mt-1">{ar ? 'تغيير التصنيف إلى "موثوق" يتطلب صلاحية الإدارة' : 'Changing to "Trusted" requires manage permission'}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!canSave} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {ar ? 'إنشاء' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
