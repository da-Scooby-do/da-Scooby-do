import { X, Mail, Phone, Calendar, ShieldCheck, Activity, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';
import {
  employeeStatusLabels, employeeStatusColors,
  moduleLabels, actionLabels, hasPermission,
  type Employee,
} from '../employee-types';

interface Props {
  employee: Employee;
  onClose: () => void;
}

export default function EmployeeProfile({ employee, onClose }: Props) {
  const { lang } = useApp();
  const { roles } = useEmployee();
  const ar = lang === 'ar';

  const role = roles.find((r) => r.id === employee.roleId);
  const permissions = role?.permissions ?? [];
  const isOwner = employee.isOwner;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <User size={20} className="text-yellow-accent" />
            {ar ? 'ملف الموظف' : 'Employee Profile'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-accent/10 border-2 border-yellow-accent/20 flex items-center justify-center text-2xl font-black text-yellow-accent">
              {employee.fullName.charAt(0)}
            </div>
            <div>
              <div className="text-lg font-bold text-base-primary">{employee.fullName}</div>
              {isOwner && <span className="text-xs font-bold text-yellow-accent px-2 py-0.5 rounded-md bg-yellow-accent/10">{ar ? 'المالك' : 'Owner'}</span>}
              <span className={`ms-2 px-2 py-0.5 rounded-md text-xs font-semibold ${employeeStatusColors[employee.status]}`}>
                {ar ? employeeStatusLabels[employee.status].ar : employeeStatusLabels[employee.status].en}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-base-muted" />
              <span className="text-base-muted">{ar ? 'البريد' : 'Email'}:</span>
              <span className="font-semibold text-base-primary" dir="ltr">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-base-muted" />
              <span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}:</span>
              <span className="font-semibold text-base-primary" dir="ltr">{employee.mobile || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck size={16} className="text-base-muted" />
              <span className="text-base-muted">{ar ? 'الدور' : 'Role'}:</span>
              <span className="font-semibold text-base-primary">{role ? (ar ? role.nameAr : role.nameEn) : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-base-muted" />
              <span className="text-base-muted">{ar ? 'تاريخ الإنشاء' : 'Created'}:</span>
              <span className="font-semibold text-base-primary">{employee.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity size={16} className="text-base-muted" />
              <span className="text-base-muted">{ar ? 'آخر نشاط' : 'Last Activity'}:</span>
              <span className="font-semibold text-base-primary">{employee.lastActivity || '—'}</span>
            </div>
          </div>

          {/* Permissions matrix */}
          <div>
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'الصلاحيات' : 'Permissions'}</h4>
            {isOwner ? (
              <div className="p-4 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 text-sm font-semibold text-yellow-accent">
                {ar ? 'المالك لديه جميع الصلاحيات' : 'Owner has all permissions'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-base text-base-muted">
                      <th className="text-start font-semibold px-2 py-2">{ar ? 'الوحدة' : 'Module'}</th>
                      {(['view', 'create', 'edit', 'delete', 'manage'] as const).map((act) => (
                        <th key={act} className="text-center font-semibold px-2 py-2">{ar ? actionLabels[act].ar : actionLabels[act].en}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p) => (
                      <tr key={p.module} className="border-b border-base">
                        <td className="px-2 py-2 font-semibold text-base-primary">{ar ? moduleLabels[p.module].ar : moduleLabels[p.module].en}</td>
                        {(['view', 'create', 'edit', 'delete', 'manage'] as const).map((act) => (
                          <td key={act} className="text-center px-2 py-2">
                            {p.actions[act] ? (
                              <span className="inline-block w-5 h-5 rounded bg-green-500/10 text-green-500 text-xs leading-5">✓</span>
                            ) : (
                              <span className="inline-block w-5 h-5 rounded bg-base-muted/10 text-base-muted text-xs leading-5">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
