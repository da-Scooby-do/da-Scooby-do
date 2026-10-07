export type RentalDuration = 'daily' | 'weekly' | 'monthly' | '6months' | 'yearly';

export type RentalRequestStatus =
  | 'new'
  | 'reviewing'
  | 'contacted'
  | 'awaiting_po'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

/** Who handles equipment transport / provides diesel for a rental. */
export type ResponsibleParty = 'sahab' | 'customer';

export const responsiblePartyLabels: Record<ResponsibleParty, { ar: string; en: string }> = {
  sahab: { ar: 'على سحاب', en: 'By SAHAB' },
  customer: { ar: 'على العميل', en: 'By customer' },
};

// ─── DB Row Type ─────────────────────────────────────────────
export interface RentalRequestRow {
  id: string;
  request_reference: string;
  equipment_model_id: string | null;
  equipment_variant_id: string | null;
  equipment_name: string;
  equipment_name_ar: string;
  customer_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  rental_period: RentalDuration;
  requested_start_date: string | null;
  project_city: string | null;
  project_location: string | null;
  notes: string | null;
  transport_by: ResponsibleParty | null;
  fuel_by: ResponsibleParty | null;
  quantity: number | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  status: RentalRequestStatus;
  internal_notes: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export const statusLabels: Record<RentalRequestStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  reviewing: { ar: 'قيد المراجعة', en: 'Reviewing' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  awaiting_po: { ar: 'بانتظار PO', en: 'Awaiting PO' },
  approved: { ar: 'تم اعتماد الطلب', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  completed: { ar: 'مكتمل', en: 'Completed' },
};

export const statusColors: Record<RentalRequestStatus, string> = {
  new: 'bg-yellow-accent/10 text-yellow-accent',
  reviewing: 'bg-blue-500/10 text-blue-500',
  contacted: 'bg-cyan-500/10 text-cyan-500',
  awaiting_po: 'bg-orange-500/10 text-orange-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
  completed: 'bg-green-700/10 text-green-700',
};

export const durationLabels: Record<RentalDuration, { ar: string; en: string }> = {
  daily: { ar: 'يومي', en: 'Daily' },
  weekly: { ar: 'أسبوعي', en: 'Weekly' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  '6months': { ar: '6 أشهر', en: '6 Months' },
  yearly: { ar: 'سنة', en: 'Yearly' },
};

export const allStatuses: RentalRequestStatus[] = [
  'new', 'reviewing', 'contacted', 'awaiting_po', 'approved', 'rejected', 'cancelled', 'completed',
];

// ─── Legacy types (used by quotation system and customer portal) ───
export type OperatorChoice = 'with_operator' | 'without_operator';
export type DieselChoice = 'customer' | 'sahab' | 'agreement';
export type TransportChoice = 'required' | 'not_required' | 'agreement';

export interface RentalRequestItem {
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  brandId: string;
  brandNameAr: string;
  brandNameEn: string;
  modelId: string;
  modelNameAr: string;
  modelNameEn: string;
  variantId: string;
  variantLabelAr: string;
  variantLabelEn: string;
  quantity: number;
}

export interface RentalRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  items: RentalRequestItem[];
  duration: RentalDuration;
  startDate: string;
  operator: OperatorChoice;
  diesel: DieselChoice;
  transport: TransportChoice;
  projectName: string;
  region: string;
  city: string;
  siteLocation: string;
  notes: string;
  company: import('@/customer/types').CompanyProfile;
  status: RentalRequestStatus;
  internalNotes: string;
  createdAt: string;
}

export interface RentalRequestDraft {
  items: RentalRequestItem[];
  duration: RentalDuration;
  startDate: string;
  operator: OperatorChoice;
  diesel: DieselChoice;
  transport: TransportChoice;
  projectName: string;
  region: string;
  city: string;
  siteLocation: string;
  notes: string;
  company?: import('@/customer/types').CompanyProfile;
}

export function generateRequestNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `REQ-${year}-${seq}`;
}

export function emptyItem(): RentalRequestItem {
  return {
    categoryId: '', categoryNameAr: '', categoryNameEn: '',
    brandId: '', brandNameAr: '', brandNameEn: '',
    modelId: '', modelNameAr: '', modelNameEn: '',
    variantId: '', variantLabelAr: '', variantLabelEn: '',
    quantity: 1,
  };
}

export function emptyDraft(): RentalRequestDraft {
  return {
    items: [emptyItem()],
    duration: 'daily',
    startDate: '',
    operator: 'with_operator',
    diesel: 'customer',
    transport: 'agreement',
    projectName: '',
    region: '',
    city: '',
    siteLocation: '',
    notes: '',
  };
}

export function parseForkliftTons(variantLabelEn: string): number | null {
  const match = variantLabelEn.match(/(\d+(?:\.\d+)?)\s*t/i);
  return match ? parseFloat(match[1]) : null;
}

export function isForkliftCategory(categoryId: string): boolean {
  return categoryId === 'forklifts';
}

export function isOperatorMandatory(categoryId: string, variantLabelEn: string): boolean {
  if (!isForkliftCategory(categoryId)) return false;
  const tons = parseForkliftTons(variantLabelEn);
  return tons !== null && tons > 7;
}

export const operatorLabels: Record<OperatorChoice, { ar: string; en: string }> = {
  with_operator: { ar: 'مع مشغل', en: 'With Operator' },
  without_operator: { ar: 'بدون مشغل', en: 'Without Operator' },
};

export const dieselLabels: Record<DieselChoice, { ar: string; en: string }> = {
  customer: { ar: 'العميل', en: 'Customer' },
  sahab: { ar: 'سحاب', en: 'SAHAB' },
  agreement: { ar: 'حسب الاتفاق', en: 'By Agreement' },
};

export const transportLabels: Record<TransportChoice, { ar: string; en: string }> = {
  required: { ar: 'مطلوب', en: 'Required' },
  not_required: { ar: 'غير مطلوب', en: 'Not Required' },
  agreement: { ar: 'حسب الاتفاق', en: 'By Agreement' },
};

export const ANY_BRAND_ID = '__any_brand__';
export const OTHER_BRAND_ID = '__other_brand__';
export const OTHER_MODEL_ID = '__other_model__';
export const CUSTOM_SIZE_ID = '__custom_size__';
export const SPECIAL_REQ_ID = '__special_req__';
