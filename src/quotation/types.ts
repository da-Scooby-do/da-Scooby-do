import type { CompanyProfile } from '@/customer/types';
import type { RentalRequest } from '@/rental/types';

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface QuotationPricing {
  rentalPrice: number;
  transportation: number;
  operator: number;
  additionalCharges: number;
  discount: number;
  subtotal: number;
  vat: number;
  total: number;
}

export interface QuotationTerms {
  validityPeriod: string;
  paymentTerms: string;
  rentalTerms: string;
  additionalNotes: string;
  specialConditions: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  requestId: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  company: CompanyProfile;
  items: QuotationItem[];
  pricing: QuotationPricing;
  terms: QuotationTerms;
  status: QuotationStatus;
  validUntil: string;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
}

export interface QuotationDraft {
  requestId: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  company: CompanyProfile;
  items: QuotationItem[];
  pricing: QuotationPricing;
  terms: QuotationTerms;
  validUntil: string;
}

export function generateQuotationNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `QUO-${year}-${seq}`;
}

export function calculatePricing(
  rentalPrice: number,
  transportation: number,
  operator: number,
  additionalCharges: number,
  discount: number,
): QuotationPricing {
  const subtotal = Math.max(0, rentalPrice + transportation + operator + additionalCharges - discount);
  const vat = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  return { rentalPrice, transportation, operator, additionalCharges, discount, subtotal, vat, total };
}

export function emptyPricing(): QuotationPricing {
  return { rentalPrice: 0, transportation: 0, operator: 0, additionalCharges: 0, discount: 0, subtotal: 0, vat: 0, total: 0 };
}

export function emptyTerms(): QuotationTerms {
  return { validityPeriod: '', paymentTerms: '', rentalTerms: '', additionalNotes: '', specialConditions: '' };
}

export function createDraftFromRequest(req: RentalRequest): QuotationDraft {
  const items: QuotationItem[] = req.items.map((it) => {
    const desc = `${it.categoryNameEn} - ${it.brandNameEn} - ${it.modelNameEn} - ${it.variantLabelEn}`;
    return { description: desc, quantity: it.quantity, unit: 'unit', unitPrice: 0, total: 0 };
  });
  return {
    requestId: req.id,
    requestNumber: req.requestNumber,
    customerId: req.customerId,
    customerName: req.customerName,
    company: req.company,
    items: items.length > 0 ? items : [{ description: '', quantity: 1, unit: 'unit', unitPrice: 0, total: 0 }],
    pricing: emptyPricing(),
    terms: emptyTerms(),
    validUntil: '',
  };
}

export const quotationStatusLabels: Record<QuotationStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  sent: { ar: 'مرسل', en: 'Sent' },
  viewed: { ar: 'تمت المشاهدة', en: 'Viewed' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  expired: { ar: 'منتهي', en: 'Expired' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export const quotationStatusColors: Record<QuotationStatus, string> = {
  draft: 'bg-base-muted/10 text-base-muted',
  sent: 'bg-blue-500/10 text-blue-500',
  viewed: 'bg-purple-500/10 text-purple-500',
  accepted: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  expired: 'bg-orange-500/10 text-orange-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const allQuotationStatuses: QuotationStatus[] = [
  'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled',
];

export const PO_REQUIREMENT_AR = 'يجب تقديم أمر شراء (PO) قبل إتمام إجراءات التعاقد.';
export const PO_REQUIREMENT_EN = 'A Purchase Order (PO) must be submitted before completing the contracting process.';

export const SAHAB_INFO = {
  nameAr: 'شركة سحاب للمعدات والتأجير',
  nameEn: 'SAHAB Equipment & Rental Co.',
  addressAr: 'الرياض، المملكة العربية السعودية',
  addressEn: 'Riyadh, Saudi Arabia',
  phone: '+966 11 200 0000',
  email: 'info@sahab.com',
  vatNumber: '300000000000003',
  crNumber: '1010000000',
};

// ─── DB-backed Quotation Types ─────────────────────────────
export type QuotationDBStatus =
  | 'draft'
  | 'ready_to_send'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface QuotationItemDB {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
  sort_order: number;
}

export interface QuotationRow {
  id: string;
  quotation_reference: string;
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference: string | null;
  customer_name: string;
  company_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  status: QuotationDBStatus;
  currency: string;
  vat_rate: number;
  issue_date: string;
  expiry_date: string | null;
  notes: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  terms: Record<string, string>;
  version: number;
  parent_quotation_id: string | null;
  created_by: string | null;
  created_by_name: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationWithItems extends QuotationRow {
  items: QuotationItemDB[];
}

export interface QuotationHistoryRow {
  id: string;
  quotation_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export const dbQuotationStatusLabels: Record<QuotationDBStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  ready_to_send: { ar: 'جاهز للإرسال', en: 'Ready to Send' },
  sent: { ar: 'تم الإرسال', en: 'Sent' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  expired: { ar: 'منتهي', en: 'Expired' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export const dbQuotationStatusColors: Record<QuotationDBStatus, string> = {
  draft: 'bg-base-muted/10 text-base-muted',
  ready_to_send: 'bg-cyan-500/10 text-cyan-500',
  sent: 'bg-blue-500/10 text-blue-500',
  accepted: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  expired: 'bg-orange-500/10 text-orange-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const allQuotationDBStatuses: QuotationDBStatus[] = [
  'draft', 'ready_to_send', 'sent', 'accepted', 'rejected', 'expired', 'cancelled',
];

export const defaultQuotationTerms: Record<string, { ar: string; en: string }> = {
  validityPeriod: { ar: 'مدة صلاحية العرض', en: 'Offer Validity' },
  paymentTerms: { ar: 'شروط الدفع', en: 'Payment Terms' },
  transportTerms: { ar: 'شروط النقل', en: 'Transport Terms' },
  fuelTerms: { ar: 'الوقود', en: 'Fuel' },
  rentalDuration: { ar: 'مدة التأجير', en: 'Rental Duration' },
  poRequirement: { ar: 'متطلبات PO', en: 'PO Requirement' },
  specialConditions: { ar: 'شروط خاصة', en: 'Special Conditions' },
};

export function computeItemTotal(quantity: number, unitPrice: number, discount: number, taxRate: number): number {
  const lineSubtotal = Math.max(0, quantity * unitPrice - discount);
  const lineTax = lineSubtotal * (taxRate / 100);
  return Math.round((lineSubtotal + lineTax) * 100) / 100;
}

export function computeQuotationTotals(
  items: QuotationItemDB[],
  discountAmount: number,
  vatRate: number,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = Math.max(0, items.reduce((sum, it) => sum + it.total, 0) - discountAmount);
  const taxAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}
