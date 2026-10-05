import { useState } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';
import {
  employeeStatusLabels,
  type Employee, type EmployeeStatus,
} from '../employee-types';

interface Props {
  existing: Employee | null;
  onClose: () => void;
}

export default function EmployeeForm({ existing, onClose }: Props) {
  const { lang } = useApp();
  const { roles, signUp, updateEmployee } = useEmployee();
  const ar = lang === 'ar';

  const [form, setForm] = useState<Employee>(
    existing ?? {
      id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fullName: '',
      email: '',
      mobile: '',
      roleId: '',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: null,
      isOwner: false,
    },
  );

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.roleId) return;
    if (existing) {
      await updateEmployee(existing.id, {
        full_name: form.fullName,
        email: form.email,
        mobile: form.mobile,
        role_id: form.roleId,
        status: form.status,
      });
    } else {
      await signUp(form.email, 'TempPass123!', form.fullName, form.mobile, form.roleId);
    }
    onClose();
  };

  const activeRoles = roles.filter((r) => r.isActive);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            {existing ? <Save size={20} className="text-yellow-accent" /> : <UserPlus size={20} className="text-yellow-accent" />}
            {existing ? (ar ? 'تعديل موظف' : 'Edit Employee') : (ar ? 'دعوة موظف' : 'Add Employee')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{ar ? 'الاسم الكامل' : 'Full Name'} *</label>
            <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder={ar ? 'اسم الموظف' : 'Employee name'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'البريد الإلكتروني' : 'Email'} *</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'رقم الجوال' : 'Mobile'}</label>
            <input type="tel" className={inputClass} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+966 5X XXX XXXX" dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الدور' : 'Role'} *</label>
            <select className={inputClass} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">{ar ? '— اختر الدور —' : '— Select role —'}</option>
              {activeRoles.map((r) => (
                <option key={r.id} value={r.id}>{ar ? r.nameAr : r.nameEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الحالة' : 'Status'}</label>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}>
              {(Object.keys(employeeStatusLabels) as EmployeeStatus[]).map((s) => (
                <option key={s} value={s}>{ar ? employeeStatusLabels[s].ar : employeeStatusLabels[s].en}</option>
              ))}
            </select>
          </div>

          {!existing && (
            <div className="p-3 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 text-xs text-yellow-accent">
              {ar
                ? 'سيتم إعداد دعوة الموظف لاحقاً عبر البريد الإلكتروني عند ربط النظام بالخدمات الخارجية.'
                : 'An email invitation will be sent when external services are connected in a future stage.'}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!form.fullName.trim() || !form.email.trim() || !form.roleId} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {existing ? (ar ? 'حفظ' : 'Save') : (ar ? 'إضافة' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
