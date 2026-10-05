import { useState } from 'react';
import { ShieldCheck, Plus, Copy, Pencil, Trash2, Power, X, Save, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';
import {
  moduleLabels, actionLabels, allModules, allActions,
  type Role, type Permission, type PermissionModule, type PermissionAction,
} from '../employee-types';

export default function RolesPermissionsPage() {
  const { lang } = useApp();
  const { roles, createRole, updateRole, deleteRole, can } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const ar = lang === 'ar';

  const handleEdit = (role: Role) => {
    setEditing(role);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) return;
    if (confirm(ar ? `حذف دور "${role.nameEn}"؟` : `Delete role "${role.nameEn}"?`)) {
      deleteRole(role.id);
    }
  };

  const handleToggle = (role: Role) => {
    updateRole(role.id, { isActive: !role.isActive });
  };

  const handleDuplicate = (role: Role) => {
    createRole({
      ...role,
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nameAr: `${role.nameAr} (${ar ? 'نسخة' : 'Copy'})`,
      nameEn: `${role.nameEn} (Copy)`,
      isSystem: false,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <ShieldCheck size={28} className="text-yellow-accent" />
            {ar ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${roles.length} دور` : `${roles.length} roles`}</p>
        </div>
        {can('employees', 'manage') && (
          <button onClick={handleAdd} className="btn-primary text-sm">
            <Plus size={16} />
            {ar ? 'إنشاء دور' : 'Create Role'}
          </button>
        )}
      </div>

      {/* Roles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const enabledCount = role.permissions.filter((p) => Object.values(p.actions).some((v) => v)).length;
          return (
            <div key={role.id} className="card-industrial p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-base-primary">{ar ? role.nameAr : role.nameEn}</h3>
                    {role.isSystem && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-500 font-semibold">{ar ? 'نظام' : 'System'}</span>}
                  </div>
                  <p className="text-xs text-base-muted mt-0.5">{ar ? role.descriptionAr : role.descriptionEn}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${role.isActive ? 'bg-green-500/10 text-green-500' : 'bg-base-muted/10 text-base-muted'}`}>
                  {role.isActive ? (ar ? 'نشط' : 'Active') : (ar ? 'معطل' : 'Inactive')}
                </span>
              </div>

              <div className="text-xs text-base-muted">
                {ar ? `${enabledCount} من ${allModules.length} وحدة مفعّلة` : `${enabledCount} of ${allModules.length} modules enabled`}
              </div>

              <div className="flex flex-wrap gap-1">
                {role.permissions.filter((p) => Object.values(p.actions).some((v) => v)).slice(0, 4).map((p) => (
                  <span key={p.module} className="px-2 py-0.5 rounded text-xs bg-base border border-base text-base-muted">
                    {ar ? moduleLabels[p.module].ar : moduleLabels[p.module].en}
                  </span>
                ))}
                {enabledCount > 4 && <span className="px-2 py-0.5 rounded text-xs text-base-muted">+{enabledCount - 4}</span>}
              </div>

              <div className="flex gap-1 pt-2 border-t border-base">
                <button onClick={() => handleEdit(role)} className="flex-1 py-2 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-blue-500 flex items-center justify-center gap-1">
                  <Pencil size={14} /> {ar ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => handleDuplicate(role)} className="py-2 px-3 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-yellow-accent flex items-center justify-center gap-1">
                  <Copy size={14} />
                </button>
                {!role.isSystem && (
                  <button onClick={() => handleToggle(role)} className="py-2 px-3 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-orange-500 flex items-center justify-center gap-1">
                    <Power size={14} />
                  </button>
                )}
                {!role.isSystem && can('employees', 'delete') && (
                  <button onClick={() => handleDelete(role)} className="py-2 px-3 rounded-lg bg-base border border-base text-xs font-semibold text-base-muted hover:text-red-500 flex items-center justify-center gap-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <RoleForm existing={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}

// ─── Role Form Modal with Permission Matrix ────────────────────

function RoleForm({ existing, onClose }: { existing: Role | null; onClose: () => void }) {
  const { lang } = useApp();
  const { createRole, updateRole } = useEmployee();
  const ar = lang === 'ar';

  const [role, setRole] = useState<Role>(
    existing ?? {
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      isSystem: false,
      isActive: true,
      permissions: allModules.map((m) => ({
        module: m,
        actions: { view: false, create: false, edit: false, delete: false, manage: false },
      })),
      createdAt: new Date().toISOString().split('T')[0],
    },
  );

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const togglePerm = (module: PermissionModule, action: PermissionAction) => {
    setRole((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.module === module
          ? { ...p, actions: { ...p.actions, [action]: !p.actions[action] } }
          : p,
      ),
    }));
  };

  const toggleAllForModule = (module: PermissionModule, value: boolean) => {
    setRole((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.module === module
          ? { ...p, actions: { view: value, create: value, edit: value, delete: value, manage: value } }
          : p,
      ),
    }));
  };

  const handleSave = () => {
    if (!role.nameAr.trim() || !role.nameEn.trim()) return;
    if (existing) {
      updateRole(existing.id, role);
    } else {
      createRole(role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <ShieldCheck size={20} className="text-yellow-accent" />
            {existing ? (ar ? 'تعديل دور' : 'Edit Role') : (ar ? 'إنشاء دور' : 'Create Role')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Role info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
              <input className={inputClass} value={role.nameAr} onChange={(e) => setRole({ ...role, nameAr: e.target.value })} placeholder={ar ? 'مثال: المبيعات' : 'e.g. Sales'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الاسم (إنجليزي)' : 'Name (English)'} *</label>
              <input className={inputClass} value={role.nameEn} onChange={(e) => setRole({ ...role, nameEn: e.target.value })} placeholder="e.g. Sales" dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
              <input className={inputClass} value={role.descriptionAr} onChange={(e) => setRole({ ...role, descriptionAr: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
              <input className={inputClass} value={role.descriptionEn} onChange={(e) => setRole({ ...role, descriptionEn: e.target.value })} dir="ltr" />
            </div>
          </div>

          {/* Permission matrix */}
          <div>
            <h4 className="text-xs font-bold text-yellow-accent uppercase mb-3">{ar ? 'مصفوفة الصلاحيات' : 'Permission Matrix'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-base text-base-muted">
                    <th className="text-start font-semibold px-2 py-2">{ar ? 'الوحدة' : 'Module'}</th>
                    {allActions.map((act) => (
                      <th key={act} className="text-center font-semibold px-2 py-2">{ar ? actionLabels[act].ar : actionLabels[act].en}</th>
                    ))}
                    <th className="text-center font-semibold px-2 py-2">{ar ? 'الكل' : 'All'}</th>
                  </tr>
                </thead>
                <tbody>
                  {role.permissions.map((p) => (
                    <tr key={p.module} className="border-b border-base hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-2 py-2 font-semibold text-base-primary whitespace-nowrap">{ar ? moduleLabels[p.module].ar : moduleLabels[p.module].en}</td>
                      {allActions.map((act) => (
                        <td key={act} className="text-center px-2 py-2">
                          <button
                            onClick={() => togglePerm(p.module, act)}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                              p.actions[act]
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                : 'bg-base text-base-muted hover:bg-base-muted/10'
                            }`}
                          >
                            {p.actions[act] ? <Check size={14} /> : <span className="text-xs">—</span>}
                          </button>
                        </td>
                      ))}
                      <td className="text-center px-2 py-2">
                        <button
                          onClick={() => toggleAllForModule(p.module, !allActions.every((a) => p.actions[a]))}
                          className="px-2 py-1 rounded-md text-xs font-semibold text-yellow-accent hover:bg-yellow-accent/10"
                        >
                          {allActions.every((a) => p.actions[a]) ? (ar ? 'إلغاء' : 'Clear') : (ar ? 'تحديد' : 'Set All')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-elevated border-t border-base p-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!role.nameAr.trim() || !role.nameEn.trim()} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} />
            {existing ? (ar ? 'حفظ' : 'Save') : (ar ? 'إنشاء' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
