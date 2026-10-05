// ─── Employee & Permission System Types ───────────────────────

export type EmployeeStatus = 'active' | 'inactive' | 'pending';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export type PermissionModule =
  | 'equipment'
  | 'equipment_images'
  | 'categories'
  | 'brands'
  | 'projects'
  | 'services'
  | 'rental_requests'
  | 'quotations'
  | 'contracts'
  | 'employees'
  | 'company_settings'
  | 'finance'
  | 'reports'
  | 'notifications';

export interface Permission {
  module: PermissionModule;
  actions: Record<PermissionAction, boolean>;
}

export interface Role {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  roleId: string;
  status: EmployeeStatus;
  createdAt: string;
  lastActivity: string | null;
  isOwner: boolean;
}

export interface AuditLogEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  actionAr: string;
  module: string;
  moduleAr: string;
  recordId: string;
  recordLabel: string;
  timestamp: string;
}

// ─── Module Labels ─────────────────────────────────────────────

export const moduleLabels: Record<PermissionModule, { ar: string; en: string }> = {
  equipment: { ar: 'المعدات', en: 'Equipment' },
  equipment_images: { ar: 'صور المعدات', en: 'Equipment Images' },
  categories: { ar: 'الفئات', en: 'Categories' },
  brands: { ar: 'الماركات', en: 'Brands' },
  projects: { ar: 'المشاريع', en: 'Projects' },
  services: { ar: 'الخدمات', en: 'Services' },
  rental_requests: { ar: 'طلبات التأجير', en: 'Rental Requests' },
  quotations: { ar: 'عروض الأسعار', en: 'Quotations' },
  contracts: { ar: 'العقود', en: 'Contracts' },
  employees: { ar: 'الموظفون', en: 'Employees' },
  company_settings: { ar: 'إعدادات الشركة', en: 'Company Settings' },
  finance: { ar: 'المالية', en: 'Finance' },
  reports: { ar: 'التقارير', en: 'Reports' },
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
};

export const actionLabels: Record<PermissionAction, { ar: string; en: string }> = {
  view: { ar: 'عرض', en: 'View' },
  create: { ar: 'إضافة', en: 'Create' },
  edit: { ar: 'تعديل', en: 'Edit' },
  delete: { ar: 'حذف', en: 'Delete' },
  manage: { ar: 'إدارة', en: 'Manage' },
};

export const allModules: PermissionModule[] = [
  'equipment', 'equipment_images', 'categories', 'brands', 'projects', 'services',
  'rental_requests', 'quotations', 'contracts', 'employees', 'company_settings',
  'finance', 'reports', 'notifications',
];

export const allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'manage'];

export const employeeStatusLabels: Record<EmployeeStatus, { ar: string; en: string }> = {
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'غير نشط', en: 'Inactive' },
  pending: { ar: 'بانتظار الدعوة', en: 'Pending Invitation' },
};

export const employeeStatusColors: Record<EmployeeStatus, string> = {
  active: 'bg-green-500/10 text-green-500',
  inactive: 'bg-base-muted/10 text-base-muted',
  pending: 'bg-orange-500/10 text-orange-500',
};

// ─── Helpers ───────────────────────────────────────────────────

export function createEmptyPermission(module: PermissionModule): Permission {
  return {
    module,
    actions: { view: false, create: false, edit: false, delete: false, manage: false },
  };
}

export function createAllPermissions(): Permission[] {
  return allModules.map((m) => ({
    module: m,
    actions: { view: true, create: true, edit: true, delete: true, manage: true },
  }));
}

export function createEmptyPermissions(): Permission[] {
  return allModules.map((m) => createEmptyPermission(m));
}

export function generateEmpId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyEmployee(): Employee {
  return {
    id: generateEmpId('emp'),
    fullName: '',
    email: '',
    mobile: '',
    roleId: '',
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
    lastActivity: null,
    isOwner: false,
  };
}

export function createEmptyRole(): Role {
  return {
    id: generateEmpId('role'),
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    isSystem: false,
    isActive: true,
    permissions: createEmptyPermissions(),
    createdAt: new Date().toISOString().split('T')[0],
  };
}

export function hasPermission(
  perms: Permission[],
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  const p = perms.find((x) => x.module === module);
  return p ? p.actions[action] : false;
}
