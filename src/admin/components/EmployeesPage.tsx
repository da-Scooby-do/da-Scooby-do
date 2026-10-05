import { useState } from 'react';
import { Users, Plus, Search, Eye, Pencil, Power, ShieldCheck, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';
import {
  employeeStatusLabels, employeeStatusColors,
  type Employee, type EmployeeStatus,
} from '../employee-types';
import EmployeeForm from './EmployeeForm';
import EmployeeProfile from './EmployeeProfile';

export default function EmployeesPage() {
  const { lang } = useApp();
  const { employees, roles, updateEmployee, can } = useEmployee();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = employees.filter((e) => {
    const matchSearch = !search ||
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.mobile.includes(search);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? (ar ? role.nameAr : role.nameEn) : '—';
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleToggleStatus = (emp: Employee) => {
    if (emp.status === 'active') {
      updateEmployee(emp.id, { status: 'inactive' });
    } else {
      updateEmployee(emp.id, { status: 'active' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Users size={28} className="text-yellow-accent" />
            {ar ? 'الموظفون' : 'Employees'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${employees.length} موظف` : `${employees.length} employees`}</p>
        </div>
        {can('employees', 'create') && (
          <button onClick={handleAdd} className="btn-primary text-sm">
            <Plus size={16} />
            {ar ? 'دعوة موظف' : 'Add Employee'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث بالاسم أو البريد أو الجوال...' : 'Search by name, email or mobile...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {(Object.keys(employeeStatusLabels) as EmployeeStatus[]).map((s) => (
              <option key={s} value={s}>{ar ? employeeStatusLabels[s].ar : employeeStatusLabels[s].en}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا يوجد موظفون' : 'No employees'}</p>
        </div>
      ) : (
        <div className="card-industrial overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base text-xs text-base-muted">
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'الاسم' : 'Name'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'البريد' : 'Email'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'الجوال' : 'Mobile'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'الدور' : 'Role'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'تاريخ الإنشاء' : 'Created'}</th>
                  <th className="text-start font-semibold px-4 py-3">{ar ? 'آخر نشاط' : 'Last Activity'}</th>
                  <th className="text-center font-semibold px-4 py-3">{ar ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-base hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center text-xs font-bold text-yellow-accent">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-base-primary">{emp.fullName}</div>
                          {emp.isOwner && <span className="text-xs text-yellow-accent font-bold">{ar ? 'المالك' : 'Owner'}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-base-muted">{emp.email}</td>
                    <td className="px-4 py-3 text-base-muted" dir="ltr">{emp.mobile}</td>
                    <td className="px-4 py-3"><span className="font-semibold text-base-primary">{getRoleName(emp.roleId)}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${employeeStatusColors[emp.status]}`}>{ar ? employeeStatusLabels[emp.status].ar : employeeStatusLabels[emp.status].en}</span></td>
                    <td className="px-4 py-3 text-base-muted">{emp.createdAt}</td>
                    <td className="px-4 py-3 text-base-muted">{emp.lastActivity || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewing(emp)} className="p-1.5 rounded-lg text-base-muted hover:text-yellow-accent hover:bg-yellow-accent/10" title={ar ? 'عرض' : 'View'}>
                          <Eye size={16} />
                        </button>
                        {can('employees', 'edit') && !emp.isOwner && (
                          <button onClick={() => handleEdit(emp)} className="p-1.5 rounded-lg text-base-muted hover:text-blue-500 hover:bg-blue-500/10" title={ar ? 'تعديل' : 'Edit'}>
                            <Pencil size={16} />
                          </button>
                        )}
                        {can('employees', 'edit') && !emp.isOwner && (
                          <button onClick={() => handleToggleStatus(emp)} className={`p-1.5 rounded-lg hover:bg-base ${emp.status === 'active' ? 'text-orange-500 hover:bg-orange-500/10' : 'text-green-500 hover:bg-green-500/10'}`} title={emp.status === 'active' ? (ar ? 'إلغاء التفعيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}>
                            <Power size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 p-3">
            {filtered.map((emp) => (
              <div key={emp.id} className="p-4 rounded-lg bg-base border border-base">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center text-sm font-bold text-yellow-accent">
                    {emp.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base-primary text-sm">{emp.fullName}</div>
                    {emp.isOwner && <span className="text-xs text-yellow-accent font-bold">{ar ? 'المالك' : 'Owner'}</span>}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${employeeStatusColors[emp.status]}`}>{ar ? employeeStatusLabels[emp.status].ar : employeeStatusLabels[emp.status].en}</span>
                </div>
                <div className="space-y-1 text-xs text-base-muted">
                  <div>{emp.email}</div>
                  <div dir="ltr">{emp.mobile}</div>
                  <div>{ar ? 'الدور' : 'Role'}: <span className="font-semibold text-base-primary">{getRoleName(emp.roleId)}</span></div>
                  <div>{ar ? 'تاريخ الإنشاء' : 'Created'}: {emp.createdAt}</div>
                  <div>{ar ? 'آخر نشاط' : 'Last Activity'}: {emp.lastActivity || '—'}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setViewing(emp)} className="flex-1 py-2 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-yellow-accent flex items-center justify-center gap-1">
                    <Eye size={14} /> {ar ? 'عرض' : 'View'}
                  </button>
                  {can('employees', 'edit') && !emp.isOwner && (
                    <button onClick={() => handleEdit(emp)} className="flex-1 py-2 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-blue-500 flex items-center justify-center gap-1">
                      <Pencil size={14} /> {ar ? 'تعديل' : 'Edit'}
                    </button>
                  )}
                  {can('employees', 'edit') && !emp.isOwner && (
                    <button onClick={() => handleToggleStatus(emp)} className="flex-1 py-2 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-orange-500 flex items-center justify-center gap-1">
                      <Power size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <EmployeeForm
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {viewing && (
        <EmployeeProfile
          employee={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
