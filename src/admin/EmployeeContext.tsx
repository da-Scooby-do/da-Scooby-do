import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Permission, PermissionAction, PermissionModule, Role, Employee } from './employee-types';
import { hasPermission } from './employee-types';

interface StaffRoleRow {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_system: boolean;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
}

interface StaffProfileRow {
  id: string;
  user_id: string;
  role_id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  is_owner: boolean;
  created_at: string;
  last_activity: string | null;
}

interface EmployeeContextValue {
  session: { user: { id: string; email: string } } | null;
  authLoading: boolean;
  currentEmployee: Employee | null;
  currentRole: Role | null;
  roles: Role[];
  employees: Employee[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, mobile: string, roleId: string) => Promise<{ error: string | null }>;
  can: (module: PermissionModule, action: PermissionAction) => boolean;
  createRole: (role: Partial<Role>) => Promise<void>;
  updateRole: (id: string, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  updateEmployee: (id: string, data: Partial<StaffProfileRow>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextValue | undefined>(undefined);

function mapRole(row: StaffRoleRow): Role {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    isSystem: row.is_system,
    isActive: row.is_active,
    permissions: row.permissions || [],
    createdAt: row.created_at,
  };
}

function mapEmployee(row: StaffProfileRow, role: Role | undefined): Employee {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    mobile: row.mobile,
    roleId: row.role_id,
    status: row.status as 'active' | 'inactive' | 'pending',
    createdAt: row.created_at,
    lastActivity: row.last_activity,
    isOwner: row.is_owner,
  };
}

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStaffData = async (userId?: string) => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from('staff_roles').select('*').order('created_at'),
        supabase.from('staff_profiles').select('*').order('created_at'),
      ]);

      const mappedRoles = (rolesRes.data as StaffRoleRow[] | null || []).map(mapRole);
      setRoles(mappedRoles);

      const profiles = profilesRes.data as StaffProfileRow[] | null || [];
      const mappedEmployees = profiles.map((p) => mapEmployee(p, mappedRoles.find((r) => r.id === p.role_id)));
      setEmployees(mappedEmployees);

      if (userId) {
        const myProfile = profiles.find((p) => p.user_id === userId);
        if (myProfile) {
          const myRole = mappedRoles.find((r) => r.id === myProfile.role_id);
          setCurrentEmployee(mapEmployee(myProfile, myRole));
          setCurrentRole(myRole || null);
        } else {
          setCurrentEmployee(null);
          setCurrentRole(null);
        }
      }
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as { user: { id: string; email: string } } | null);
      setAuthLoading(false);
      if (data.session) {
        loadStaffData(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession as { user: { id: string; email: string } } | null);
        setAuthLoading(false);
        if (newSession) {
          await loadStaffData(newSession.user.id);
        } else {
          setCurrentEmployee(null);
          setCurrentRole(null);
          setEmployees([]);
          setLoading(false);
        }
      })();
    });
  }, []);

  const reload = async () => {
    if (session) {
      await loadStaffData(session.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentEmployee(null);
    setCurrentRole(null);
  };

  const signUp = async (email: string, password: string, fullName: string, mobile: string, roleId: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Failed to create user' };

    const { error: profileError } = await supabase.from('staff_profiles').insert({
      user_id: data.user.id,
      role_id: roleId,
      full_name: fullName,
      email,
      mobile,
      status: 'active',
    });
    if (profileError) return { error: profileError.message };

    await reload();
    return { error: null };
  };

  const can = (module: PermissionModule, action: PermissionAction): boolean => {
    if (currentEmployee?.isOwner) return true;
    if (!currentRole) return false;
    return hasPermission(currentRole.permissions, module, action);
  };

  const createRole = async (roleData: Partial<Role>) => {
    const { error } = await supabase.from('staff_roles').insert({
      id: roleData.id,
      name_ar: roleData.nameAr,
      name_en: roleData.nameEn,
      description_ar: roleData.descriptionAr,
      description_en: roleData.descriptionEn,
      is_system: false,
      is_active: true,
      permissions: roleData.permissions || [],
    });
    if (error) throw error;
    await reload();
  };

  const updateRole = async (id: string, data: Partial<Role>) => {
    const updateData: Record<string, unknown> = {};
    if (data.nameAr !== undefined) updateData.name_ar = data.nameAr;
    if (data.nameEn !== undefined) updateData.name_en = data.nameEn;
    if (data.descriptionAr !== undefined) updateData.description_ar = data.descriptionAr;
    if (data.descriptionEn !== undefined) updateData.description_en = data.descriptionEn;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    const { error } = await supabase.from('staff_roles').update(updateData).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const deleteRole = async (id: string) => {
    const { error } = await supabase.from('staff_roles').delete().eq('id', id);
    if (error) throw error;
    await reload();
  };

  const updateEmployee = async (id: string, data: Partial<StaffProfileRow>) => {
    const { error } = await supabase.from('staff_profiles').update(data).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
    if (error) throw error;
    await reload();
  };

  return (
    <EmployeeContext.Provider
      value={{
        session, authLoading, currentEmployee, currentRole, roles, employees, loading,
        signIn, signOut, signUp, can, createRole, updateRole, deleteRole,
        updateEmployee, deleteEmployee, reload,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider');
  return ctx;
}
