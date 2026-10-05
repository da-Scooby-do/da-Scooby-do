// ─── Actual Equipment Unit System Types ────────────────────────
// All data here is internal/admin-only. Customers never see any of this.

import type { AdminEquipmentModel } from './types';

export type UnitStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'under_inspection'
  | 'under_maintenance'
  | 'unavailable'
  | 'archived';

export type SourceType = 'sahab_owned' | 'partner_owner';

export type UnitCondition = 'excellent' | 'good' | 'fair' | 'needs_repair';

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// ─── Equipment Source / Owner ──────────────────────────────────

export interface EquipmentSource {
  id: string;
  type: SourceType;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  agreementReference: string;
  internalCost: number;
  commissionMarginNotes: string;
  createdAt: string;
}

// ─── Actual Equipment Unit ─────────────────────────────────────

export interface ActualEquipmentUnit {
  id: string;
  unitId: string; // e.g. CAT320-001
  modelId: string; // references AdminEquipmentModel.id
  year: string;
  serialNumber: string;
  condition: UnitCondition;
  lastInspectionDate: string;
  nextInspectionDate: string;
  maintenanceNotes: string;
  currentRegion: string;
  currentCity: string;
  currentLocation: string;
  status: UnitStatus;
  availableFrom: string;
  currentContractReference: string;
  internalNotes: string;
  sourceId: string; // references EquipmentSource.id
  images: string[]; // private internal photos
  createdAt: string;
}

// ─── Inspection Record ──────────────────────────────────────────

export interface InspectionRecord {
  id: string;
  unitId: string; // references ActualEquipmentUnit.id
  inspectionDate: string;
  inspector: string;
  condition: UnitCondition;
  notes: string;
  attachments: string[];
}

// ─── Maintenance Record ──────────────────────────────────────────

export interface MaintenanceRecord {
  id: string;
  unitId: string; // references ActualEquipmentUnit.id
  maintenanceDate: string;
  description: string;
  status: MaintenanceStatus;
  notes: string;
}

// ─── Labels ─────────────────────────────────────────────────────

export const unitStatusLabels: Record<UnitStatus, { ar: string; en: string }> = {
  available: { ar: 'متاح', en: 'Available' },
  reserved: { ar: 'محجوز', en: 'Reserved' },
  rented: { ar: 'مؤجر', en: 'Rented' },
  under_inspection: { ar: 'تحت الفحص', en: 'Under Inspection' },
  under_maintenance: { ar: 'تحت الصيانة', en: 'Under Maintenance' },
  unavailable: { ar: 'غير متاح', en: 'Unavailable' },
  archived: { ar: 'مؤرشف', en: 'Archived' },
};

export const unitStatusColors: Record<UnitStatus, string> = {
  available: 'bg-green-500/10 text-green-500',
  reserved: 'bg-blue-500/10 text-blue-500',
  rented: 'bg-purple-500/10 text-purple-500',
  under_inspection: 'bg-orange-500/10 text-orange-500',
  under_maintenance: 'bg-yellow-accent/10 text-yellow-accent',
  unavailable: 'bg-red-500/10 text-red-500',
  archived: 'bg-base-muted/10 text-base-muted',
};

export const sourceTypeLabels: Record<SourceType, { ar: string; en: string }> = {
  sahab_owned: { ar: 'مملوك لسحاب', en: 'SAHAB Owned' },
  partner_owner: { ar: 'شريك / مالك معدات', en: 'Partner / Equipment Owner' },
};

export const conditionLabels: Record<UnitCondition, { ar: string; en: string }> = {
  excellent: { ar: 'ممتازة', en: 'Excellent' },
  good: { ar: 'جيدة', en: 'Good' },
  fair: { ar: 'مقبولة', en: 'Fair' },
  needs_repair: { ar: 'تحتاج إصلاح', en: 'Needs Repair' },
};

export const conditionColors: Record<UnitCondition, string> = {
  excellent: 'bg-green-500/10 text-green-500',
  good: 'bg-blue-500/10 text-blue-500',
  fair: 'bg-orange-500/10 text-orange-500',
  needs_repair: 'bg-red-500/10 text-red-500',
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, { ar: string; en: string }> = {
  scheduled: { ar: 'مجدولة', en: 'Scheduled' },
  in_progress: { ar: 'قيد التنفيذ', en: 'In Progress' },
  completed: { ar: 'مكتملة', en: 'Completed' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled' },
};

export const maintenanceStatusColors: Record<MaintenanceStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-yellow-accent/10 text-yellow-accent',
  completed: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
};

export const allUnitStatuses: UnitStatus[] = [
  'available', 'reserved', 'rented', 'under_inspection', 'under_maintenance', 'unavailable', 'archived',
];

export const allSourceTypes: SourceType[] = ['sahab_owned', 'partner_owner'];

export const allConditions: UnitCondition[] = ['excellent', 'good', 'fair', 'needs_repair'];

export const allMaintenanceStatuses: MaintenanceStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

// ─── Helpers ───────────────────────────────────────────────────

export function generateUnitId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyUnit(): ActualEquipmentUnit {
  return {
    id: generateUnitId('unit'),
    unitId: '',
    modelId: '',
    year: '',
    serialNumber: '',
    condition: 'good',
    lastInspectionDate: '',
    nextInspectionDate: '',
    maintenanceNotes: '',
    currentRegion: '',
    currentCity: '',
    currentLocation: '',
    status: 'available',
    availableFrom: '',
    currentContractReference: '',
    internalNotes: '',
    sourceId: '',
    images: [],
    createdAt: new Date().toISOString().split('T')[0],
  };
}

export function createEmptySource(): EquipmentSource {
  return {
    id: generateUnitId('src'),
    type: 'sahab_owned',
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    agreementReference: '',
    internalCost: 0,
    commissionMarginNotes: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
}

export function createEmptyInspection(unitId: string): InspectionRecord {
  return {
    id: generateUnitId('insp'),
    unitId,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspector: '',
    condition: 'good',
    notes: '',
    attachments: [],
  };
}

export function createEmptyMaintenance(unitId: string): MaintenanceRecord {
  return {
    id: generateUnitId('maint'),
    unitId,
    maintenanceDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'scheduled',
    notes: '',
  };
}

export function generateUnitCode(modelName: string, existingCount: number): string {
  const prefix = modelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'UNIT';
  const seq = String(existingCount + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}
