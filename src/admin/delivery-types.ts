// ─── Delivery & Return System Types ───────────────────────────
// All data here is internal/admin-only except customer-visible delivery/return status.

export type DeliveryStatus =
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'delivery_issue'
  | 'cancelled';

export type ReturnStatus =
  | 'expected'
  | 'scheduled'
  | 'received'
  | 'under_review'
  | 'completed'
  | 'issue';

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'damaged';

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';

// ─── Delivery Condition Checklist ──────────────────────────────

export interface DeliveryCondition {
  generalCondition: ConditionRating;
  visibleDamage: boolean;
  damageDescription: string;
  tiresTracks: ConditionRating;
  engineOperating: ConditionRating;
  attachments: ConditionRating;
  fuelLevel: FuelLevel;
  hourMeter: string;
  notes: string;
  photos: string[];
}

// ─── Customer Acknowledgment ───────────────────────────────────

export interface DeliveryAcknowledgment {
  representativeName: string;
  representativeMobile: string;
  acknowledgedAt: string;
  signature: string; // base64 or placeholder
  confirmed: boolean;
}

// ─── Delivery Record ────────────────────────────────────────────

export interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  allocationId: string;
  allocationNumber: string;
  contractId: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  companyName: string;
  modelId: string;
  modelName: string;
  unitId: string;
  unitCode: string;
  projectName: string;
  location: string;
  rentalStart: string;
  rentalEnd: string;
  operator: string;
  transportation: string;
  diesel: string;
  // Delivery details
  deliveryDate: string;
  deliveryTime: string;
  driverContact: string;
  siteContactName: string;
  siteContactMobile: string;
  deliveryNotes: string;
  // Condition
  condition: DeliveryCondition;
  // Acknowledgment
  acknowledgment: DeliveryAcknowledgment | null;
  // Status
  status: DeliveryStatus;
  // Documents
  deliveryPhotos: string[];
  signedAcknowledgmentDoc: string;
  internalDocuments: string[];
  // Return
  returnRecord: ReturnRecord | null;
  // Meta
  createdAt: string;
  createdBy: string;
}

// ─── Return Condition ──────────────────────────────────────────

export interface ReturnCondition {
  generalCondition: ConditionRating;
  visibleDamage: boolean;
  damageDescription: string;
  tiresTracks: ConditionRating;
  engineOperating: ConditionRating;
  attachments: ConditionRating;
  fuelLevel: FuelLevel;
  hourMeter: string;
  notes: string;
  photos: string[];
}

// ─── Return Record ─────────────────────────────────────────────

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  returnDate: string;
  returnTime: string;
  receivedBy: string;
  condition: ReturnCondition;
  damageIssues: string;
  notes: string;
  photos: string[];
  status: ReturnStatus;
  // Comparison results
  newDamage: boolean;
  missingItems: boolean;
  conditionChanged: boolean;
  reviewNotes: string;
  // Maintenance flag
  maintenanceRequired: boolean;
  maintenanceNotes: string;
  createdAt: string;
}

// ─── Labels ────────────────────────────────────────────────────

export const deliveryStatusLabels: Record<DeliveryStatus, { ar: string; en: string }> = {
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  in_transit: { ar: 'قيد التوصيل', en: 'In Transit' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  delivery_issue: { ar: 'مشكلة في التسليم', en: 'Delivery Issue' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export const deliveryStatusColors: Record<DeliveryStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-500',
  in_transit: 'bg-orange-500/10 text-orange-500',
  delivered: 'bg-green-500/10 text-green-500',
  delivery_issue: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const returnStatusLabels: Record<ReturnStatus, { ar: string; en: string }> = {
  expected: { ar: 'متوقع', en: 'Expected' },
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  received: { ar: 'تم الاستلام', en: 'Received' },
  under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  issue: { ar: 'مشكلة', en: 'Issue' },
};

export const returnStatusColors: Record<ReturnStatus, string> = {
  expected: 'bg-base-muted/10 text-base-muted',
  scheduled: 'bg-blue-500/10 text-blue-500',
  received: 'bg-orange-500/10 text-orange-500',
  under_review: 'bg-yellow-accent/10 text-yellow-accent',
  completed: 'bg-green-500/10 text-green-500',
  issue: 'bg-red-500/10 text-red-500',
};

export const conditionRatingLabels: Record<ConditionRating, { ar: string; en: string }> = {
  excellent: { ar: 'ممتازة', en: 'Excellent' },
  good: { ar: 'جيدة', en: 'Good' },
  fair: { ar: 'مقبولة', en: 'Fair' },
  damaged: { ar: 'تالفة', en: 'Damaged' },
};

export const conditionRatingColors: Record<ConditionRating, string> = {
  excellent: 'bg-green-500/10 text-green-500',
  good: 'bg-blue-500/10 text-blue-500',
  fair: 'bg-orange-500/10 text-orange-500',
  damaged: 'bg-red-500/10 text-red-500',
};

export const fuelLevelLabels: Record<FuelLevel, { ar: string; en: string }> = {
  empty: { ar: 'فارغ', en: 'Empty' },
  quarter: { ar: 'ربع', en: '1/4' },
  half: { ar: 'نصف', en: '1/2' },
  three_quarter: { ar: 'ثلاثة أرباع', en: '3/4' },
  full: { ar: 'ممتلئ', en: 'Full' },
};

export const allDeliveryStatuses: DeliveryStatus[] = ['scheduled', 'in_transit', 'delivered', 'delivery_issue', 'cancelled'];
export const allReturnStatuses: ReturnStatus[] = ['expected', 'scheduled', 'received', 'under_review', 'completed', 'issue'];
export const allConditionRatings: ConditionRating[] = ['excellent', 'good', 'fair', 'damaged'];
export const allFuelLevels: FuelLevel[] = ['empty', 'quarter', 'half', 'three_quarter', 'full'];

// ─── Helpers ───────────────────────────────────────────────────

export function generateDeliveryId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateDeliveryNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `DLV-${year}-${seq}`;
}

export function generateReturnNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `RTN-${year}-${seq}`;
}

export function createEmptyDeliveryCondition(): DeliveryCondition {
  return {
    generalCondition: 'good',
    visibleDamage: false,
    damageDescription: '',
    tiresTracks: 'good',
    engineOperating: 'good',
    attachments: 'good',
    fuelLevel: 'half',
    hourMeter: '',
    notes: '',
    photos: [],
  };
}

export function createEmptyReturnCondition(): ReturnCondition {
  return {
    generalCondition: 'good',
    visibleDamage: false,
    damageDescription: '',
    tiresTracks: 'good',
    engineOperating: 'good',
    attachments: 'good',
    fuelLevel: 'half',
    hourMeter: '',
    notes: '',
    photos: [],
  };
}

export function createEmptyAcknowledgment(): DeliveryAcknowledgment {
  return {
    representativeName: '',
    representativeMobile: '',
    acknowledgedAt: '',
    signature: '',
    confirmed: false,
  };
}

export function createEmptyReturn(): ReturnRecord {
  return {
    id: generateDeliveryId('rtn'),
    returnNumber: '',
    returnDate: '',
    returnTime: '',
    receivedBy: '',
    condition: createEmptyReturnCondition(),
    damageIssues: '',
    notes: '',
    photos: [],
    status: 'received',
    newDamage: false,
    missingItems: false,
    conditionChanged: false,
    reviewNotes: '',
    maintenanceRequired: false,
    maintenanceNotes: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
}

// Compare delivery condition with return condition
export function compareConditions(delivery: DeliveryCondition, ret: ReturnCondition) {
  const newDamage = ret.visibleDamage && !delivery.visibleDamage;
  const conditionChanged =
    delivery.generalCondition !== ret.generalCondition ||
    delivery.tiresTracks !== ret.tiresTracks ||
    delivery.engineOperating !== ret.engineOperating ||
    delivery.attachments !== ret.attachments;
  const missingItems = false; // Placeholder for future item tracking
  return { newDamage, conditionChanged, missingItems };
}
