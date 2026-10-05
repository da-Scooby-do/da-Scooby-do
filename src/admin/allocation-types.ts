// ─── Equipment Allocation System Types ────────────────────────
// All data here is internal/admin-only. Customers never see allocations.

export type AllocationStatus =
  | 'pending'
  | 'reserved'
  | 'allocated'
  | 'cancelled'
  | 'released';

export type AllocationHistoryAction =
  | 'created'
  | 'reserved'
  | 'allocated'
  | 'cancelled'
  | 'released'
  | 'override';

// ─── Equipment Allocation ──────────────────────────────────────

export interface EquipmentAllocation {
  id: string;
  allocationNumber: string;
  contractId: string;
  contractNumber: string;
  requestId: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  companyName: string;
  modelId: string; // references AdminEquipmentModel.id
  modelName: string;
  unitId: string; // references ActualEquipmentUnit.id
  unitCode: string; // e.g. CAT320-001 (internal display)
  projectName: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  status: AllocationStatus;
  overrideReason: string;
  internalNotes: string;
  createdAt: string;
}

// ─── Allocation History ─────────────────────────────────────────

export interface AllocationHistory {
  id: string;
  allocationId: string;
  action: AllocationHistoryAction;
  employeeId: string;
  employeeName: string;
  reason: string;
  timestamp: string;
}

// ─── Labels ─────────────────────────────────────────────────────

export const allocationStatusLabels: Record<AllocationStatus, { ar: string; en: string }> = {
  pending: { ar: 'بانتظار', en: 'Pending' },
  reserved: { ar: 'محجوز', en: 'Reserved' },
  allocated: { ar: 'مخصّص', en: 'Allocated' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  released: { ar: 'مُحرر', en: 'Released' },
};

export const allocationStatusColors: Record<AllocationStatus, string> = {
  pending: 'bg-orange-500/10 text-orange-500',
  reserved: 'bg-blue-500/10 text-blue-500',
  allocated: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
  released: 'bg-purple-500/10 text-purple-500',
};

export const historyActionLabels: Record<AllocationHistoryAction, { ar: string; en: string }> = {
  created: { ar: 'إنشاء', en: 'Created' },
  reserved: { ar: 'حجز', en: 'Reserved' },
  allocated: { ar: 'تخصيص', en: 'Allocated' },
  cancelled: { ar: 'إلغاء', en: 'Cancelled' },
  released: { ar: 'تحرير', en: 'Released' },
  override: { ar: 'تجاوز', en: 'Override' },
};

export const allAllocationStatuses: AllocationStatus[] = [
  'pending', 'reserved', 'allocated', 'cancelled', 'released',
];

// ─── Helpers ───────────────────────────────────────────────────

export function generateAllocationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateAllocationNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `ALLOC-${year}-${seq}`;
}

export function createEmptyAllocation(): EquipmentAllocation {
  return {
    id: generateAllocationId('alloc'),
    allocationNumber: '',
    contractId: '',
    contractNumber: '',
    requestId: '',
    requestNumber: '',
    customerId: '',
    customerName: '',
    companyName: '',
    modelId: '',
    modelName: '',
    unitId: '',
    unitCode: '',
    projectName: '',
    location: '',
    startDate: '',
    expectedEndDate: '',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    status: 'pending',
    overrideReason: '',
    internalNotes: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
}

// Check if two date ranges overlap
export function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  return start1 < end2 && start2 < end1;
}
