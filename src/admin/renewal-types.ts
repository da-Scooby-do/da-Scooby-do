// ─── Contract Renewal & Extension System Types ────────────────

import type { QuotationPricing } from '@/quotation/types';
import type { CompanyProfile } from '@/customer/types';

export type RenewalStatus =
  | 'draft'
  | 'pending_internal_review'
  | 'quotation_required'
  | 'pending_customer_approval'
  | 'approved'
  | 'contract_preparation'
  | 'signed'
  | 'active'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type RenewalPeriod = '1_month' | '3_months' | '6_months' | '12_months' | 'custom';

export type CustomerClassification = 'standard' | 'trusted';

export type RenewalAllocationChoice = 'continue_current' | 'reallocate' | 'pending';

// ─── Renewal Item ──────────────────────────────────────────────

export interface RenewalItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

// ─── Renewal Pricing ───────────────────────────────────────────

export interface RenewalPricing {
  currentPrice: number;
  newPrice: number;
  discount: number;
  additionalCharges: number;
  transportation: number;
  operator: number;
  diesel: number;
  subtotal: number;
  vat: number;
  total: number;
}

// ─── Renewal History Entry ─────────────────────────────────────

export interface RenewalHistoryEntry {
  id: string;
  action: string;
  actionAr: string;
  employeeId: string;
  employeeName: string;
  previousStatus: RenewalStatus | null;
  newStatus: RenewalStatus;
  notes: string;
  pricingChanged: boolean;
  timestamp: string;
}

// ─── Contract Renewal ──────────────────────────────────────────

export interface ContractRenewal {
  id: string;
  renewalNumber: string;
  // Original contract reference
  originalContractId: string;
  originalContractNumber: string;
  // Previous renewal reference (for chain)
  previousRenewalId: string | null;
  previousRenewalNumber: string | null;
  // Customer info
  customerId: string;
  customerName: string;
  companyName: string;
  company: CompanyProfile;
  customerClassification: CustomerClassification;
  // Equipment info
  items: RenewalItem[];
  equipmentModel: string;
  quantity: number;
  // Period
  renewalPeriod: RenewalPeriod;
  customPeriodDays: number;
  // Dates
  currentStartDate: string;
  currentEndDate: string;
  newStartDate: string;
  newEndDate: string;
  remainingDays: number;
  // Pricing
  pricing: RenewalPricing;
  // Terms (copied from original)
  operator: string;
  diesel: string;
  transportation: string;
  projectName: string;
  location: string;
  // Workflow
  status: RenewalStatus;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  // Allocation
  allocationChoice: RenewalAllocationChoice;
  newAllocationId: string | null;
  // Resulting contract
  newContractId: string | null;
  newContractNumber: string | null;
  // Audit
  history: RenewalHistoryEntry[];
  internalNotes: string;
  customerRejectionReason: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// ─── Labels ────────────────────────────────────────────────────

export const renewalStatusLabels: Record<RenewalStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  pending_internal_review: { ar: 'بانتظار المراجعة الداخلية', en: 'Pending Internal Review' },
  quotation_required: { ar: 'مطلوب عرض سعر', en: 'Quotation Required' },
  pending_customer_approval: { ar: 'بانتظار موافقة العميل', en: 'Pending Customer Approval' },
  approved: { ar: 'معتمد', en: 'Approved' },
  contract_preparation: { ar: 'تحضير العقد', en: 'Contract Preparation' },
  signed: { ar: 'موقّع', en: 'Signed' },
  active: { ar: 'ساري', en: 'Active' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  expired: { ar: 'منتهي', en: 'Expired' },
};

export const renewalStatusColors: Record<RenewalStatus, string> = {
  draft: 'bg-base-muted/10 text-base-muted',
  pending_internal_review: 'bg-orange-500/10 text-orange-500',
  quotation_required: 'bg-yellow-accent/10 text-yellow-accent',
  pending_customer_approval: 'bg-blue-500/10 text-blue-500',
  approved: 'bg-teal-500/10 text-teal-500',
  contract_preparation: 'bg-purple-500/10 text-purple-500',
  signed: 'bg-indigo-500/10 text-indigo-500',
  active: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
  expired: 'bg-red-500/10 text-red-500',
};

export const allRenewalStatuses: RenewalStatus[] = [
  'draft', 'pending_internal_review', 'quotation_required', 'pending_customer_approval',
  'approved', 'contract_preparation', 'signed', 'active', 'rejected', 'cancelled', 'expired',
];

export const renewalPeriodLabels: Record<RenewalPeriod, { ar: string; en: string }> = {
  '1_month': { ar: 'شهر واحد', en: '1 Month' },
  '3_months': { ar: '3 أشهر', en: '3 Months' },
  '6_months': { ar: '6 أشهر', en: '6 Months' },
  '12_months': { ar: '12 شهر', en: '12 Months' },
  custom: { ar: 'فترة مخصصة', en: 'Custom Period' },
};

export const allRenewalPeriods: RenewalPeriod[] = ['1_month', '3_months', '6_months', '12_months', 'custom'];

export const customerClassificationLabels: Record<CustomerClassification, { ar: string; en: string }> = {
  standard: { ar: 'عادي', en: 'Standard' },
  trusted: { ar: 'موثوق', en: 'Trusted' },
};

export const customerClassificationColors: Record<CustomerClassification, string> = {
  standard: 'bg-base-muted/10 text-base-muted',
  trusted: 'bg-green-500/10 text-green-500',
};

export const allocationChoiceLabels: Record<RenewalAllocationChoice, { ar: string; en: string }> = {
  continue_current: { ar: 'استمرار بالوحدة الحالية', en: 'Continue Current Equipment' },
  reallocate: { ar: 'إعادة تخصيص', en: 'Reallocate Equipment' },
  pending: { ar: 'بانتظار القرار', en: 'Pending Decision' },
};

// ─── Helpers ───────────────────────────────────────────────────

export function generateRenewalNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `RNW-${year}-${seq}`;
}

export function generateRenewalId(): string {
  return `rnw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateHistoryId(): string {
  return `rnh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function periodToDays(period: RenewalPeriod, customDays: number): number {
  switch (period) {
    case '1_month': return 30;
    case '3_months': return 90;
    case '6_months': return 180;
    case '12_months': return 365;
    case 'custom': return customDays || 0;
  }
}

export function calculateRenewalPricing(
  newPrice: number,
  discount: number,
  additionalCharges: number,
  transportation: number,
  operator: number,
  diesel: number,
): RenewalPricing {
  const subtotal = Math.max(0, newPrice + transportation + operator + diesel + additionalCharges - discount);
  const vat = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  return {
    currentPrice: 0,
    newPrice,
    discount,
    additionalCharges,
    transportation,
    operator,
    diesel,
    subtotal,
    vat,
    total,
  };
}

export function createEmptyRenewalPricing(): RenewalPricing {
  return {
    currentPrice: 0, newPrice: 0, discount: 0, additionalCharges: 0,
    transportation: 0, operator: 0, diesel: 0, subtotal: 0, vat: 0, total: 0,
  };
}

export function daysUntilExpiry(endDate: string): number {
  if (!endDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function expiryAlertLevel(days: number): 'none' | '30' | '14' | '7' | '1' {
  if (days <= 1) return '1';
  if (days <= 7) return '7';
  if (days <= 14) return '14';
  if (days <= 30) return '30';
  return 'none';
}

export const expiryAlertLabels: Record<string, { ar: string; en: string }> = {
  '30': { ar: '30 يوم', en: '30 Days' },
  '14': { ar: '14 يوم', en: '14 Days' },
  '7': { ar: '7 أيام', en: '7 Days' },
  '1': { ar: 'يوم واحد', en: '1 Day' },
};

export const expiryAlertColors: Record<string, string> = {
  '30': 'text-yellow-accent',
  '14': 'text-orange-500',
  '7': 'text-red-500',
  '1': 'text-red-500 font-bold',
};
