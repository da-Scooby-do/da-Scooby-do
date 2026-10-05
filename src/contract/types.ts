import type { CompanyProfile } from '@/customer/types';
import type { Quotation, QuotationPricing, QuotationTerms, QuotationItem } from '@/quotation/types';

export type ContractStatus =
  | 'draft'
  | 'sent'
  | 'pending_signature'
  | 'signed'
  | 'active'
  | 'completed'
  | 'terminated';

export type SignatureStatus = 'unsigned' | 'customer_signed' | 'fully_signed';

export type SignatureMethod = 'draw' | 'type';

export interface ContractSignature {
  method: SignatureMethod;
  signerName: string;
  signedAt: string;
  signatureData: string;
  authorityConfirmed: boolean;
  contractReviewed: boolean;
}

export interface ContractItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ContractTerms {
  rentalObligations: string;
  equipmentUse: string;
  payment: string;
  transportation: string;
  diesel: string;
  operator: string;
  damageResponsibility: string;
  returnConditions: string;
  termination: string;
  renewal: string;
  disputesLegal: string;
  additionalConditions: string;
}

export interface RentalContract {
  id: string;
  contractNumber: string;
  quotationId: string;
  quotationNumber: string;
  requestId: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  company: CompanyProfile;
  items: ContractItem[];
  pricing: QuotationPricing;
  quotationTerms: QuotationTerms;
  contractTerms: ContractTerms;
  startDate: string;
  duration: string;
  projectName: string;
  location: string;
  operator: string;
  diesel: string;
  transportation: string;
  status: ContractStatus;
  signatureStatus: SignatureStatus;
  signature: ContractSignature | null;
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
}

export interface ContractDraft {
  quotationId: string;
  quotationNumber: string;
  requestId: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  company: CompanyProfile;
  items: ContractItem[];
  pricing: QuotationPricing;
  quotationTerms: QuotationTerms;
  contractTerms: ContractTerms;
  startDate: string;
  duration: string;
  projectName: string;
  location: string;
  operator: string;
  diesel: string;
  transportation: string;
}

export function generateContractNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `CNT-${year}-${seq}`;
}

export function defaultContractTerms(): ContractTerms {
  return {
    rentalObligations: '',
    equipmentUse: '',
    payment: '',
    transportation: '',
    diesel: '',
    operator: '',
    damageResponsibility: '',
    returnConditions: '',
    termination: '',
    renewal: '',
    disputesLegal: '',
    additionalConditions: '',
  };
}

export function createDraftFromQuotation(q: Quotation): ContractDraft {
  return {
    quotationId: q.id,
    quotationNumber: q.quotationNumber,
    requestId: q.requestId,
    requestNumber: q.requestNumber,
    customerId: q.customerId,
    customerName: q.customerName,
    company: q.company,
    items: q.items.map((it: QuotationItem) => ({ ...it })),
    pricing: q.pricing,
    quotationTerms: q.terms,
    contractTerms: defaultContractTerms(),
    startDate: '',
    duration: '',
    projectName: '',
    location: '',
    operator: '',
    diesel: '',
    transportation: '',
  };
}

export const contractStatusLabels: Record<ContractStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  sent: { ar: 'مرسل', en: 'Sent' },
  pending_signature: { ar: 'بانتظار التوقيع', en: 'Pending Signature' },
  signed: { ar: 'موقّع', en: 'Signed' },
  active: { ar: 'ساري', en: 'Active' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  terminated: { ar: 'منتهي', en: 'Terminated' },
};

export const contractStatusColors: Record<ContractStatus, string> = {
  draft: 'bg-base-muted/10 text-base-muted',
  sent: 'bg-blue-500/10 text-blue-500',
  pending_signature: 'bg-orange-500/10 text-orange-500',
  signed: 'bg-purple-500/10 text-purple-500',
  active: 'bg-green-500/10 text-green-500',
  completed: 'bg-teal-500/10 text-teal-500',
  terminated: 'bg-red-500/10 text-red-500',
};

export const signatureStatusLabels: Record<SignatureStatus, { ar: string; en: string }> = {
  unsigned: { ar: 'غير موقّع', en: 'Unsigned' },
  customer_signed: { ar: 'موقّع من العميل', en: 'Customer Signed' },
  fully_signed: { ar: 'موقّع بالكامل', en: 'Fully Signed' },
};

export const signatureStatusColors: Record<SignatureStatus, string> = {
  unsigned: 'bg-orange-500/10 text-orange-500',
  customer_signed: 'bg-blue-500/10 text-blue-500',
  fully_signed: 'bg-green-500/10 text-green-500',
};

export const allContractStatuses: ContractStatus[] = [
  'draft', 'sent', 'pending_signature', 'signed', 'active', 'completed', 'terminated',
];

export const contractTermsLabels: Record<keyof ContractTerms, { ar: string; en: string }> = {
  rentalObligations: { ar: 'التزامات الإيجار', en: 'Rental Obligations' },
  equipmentUse: { ar: 'استخدام المعدة', en: 'Equipment Use' },
  payment: { ar: 'الدفع', en: 'Payment' },
  transportation: { ar: 'النقل', en: 'Transportation' },
  diesel: { ar: 'الديزل', en: 'Diesel' },
  operator: { ar: 'المشغل', en: 'Operator' },
  damageResponsibility: { ar: 'الأضرار والمسؤولية', en: 'Damage/Responsibility' },
  returnConditions: { ar: 'شروط الإرجاع', en: 'Return Conditions' },
  termination: { ar: 'الإنهاء', en: 'Termination' },
  renewal: { ar: 'التجديد', en: 'Renewal' },
  disputesLegal: { ar: 'النزاعات والشروط القانونية', en: 'Disputes/Legal Terms' },
  additionalConditions: { ar: 'شروط إضافية', en: 'Additional Conditions' },
};

// ─── DB-backed Contract Types ──────────────────────────────
export type ContractDBStatus = 'draft' | 'ready' | 'pending_signature' | 'active' | 'expired' | 'cancelled';

export interface ContractRow {
  id: string;
  contract_number: string;
  title: string;
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference: string | null;
  quotation_id: string | null;
  quotation_reference: string | null;
  purchase_order_id: string | null;
  po_number: string | null;
  customer_name: string;
  company_name: string | null;
  start_date: string;
  end_date: string | null;
  contract_value: number;
  currency: string;
  status: ContractDBStatus;
  document_path: string | null;
  document_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractHistoryRow {
  id: string;
  contract_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export const dbContractStatusLabels: Record<ContractDBStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  ready: { ar: 'جاهز', en: 'Ready' },
  pending_signature: { ar: 'بانتظار التوقيع', en: 'Pending Signature' },
  active: { ar: 'ساري', en: 'Active' },
  expired: { ar: 'منتهي', en: 'Expired' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export const dbContractStatusColors: Record<ContractDBStatus, string> = {
  draft: 'bg-base-muted/10 text-base-muted',
  ready: 'bg-cyan-500/10 text-cyan-500',
  pending_signature: 'bg-orange-500/10 text-orange-500',
  active: 'bg-green-500/10 text-green-500',
  expired: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const allContractDBStatuses: ContractDBStatus[] = [
  'draft', 'ready', 'pending_signature', 'active', 'expired', 'cancelled',
];

export interface CreateContractPayload {
  title: string;
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference?: string;
  quotation_id?: string;
  quotation_reference?: string;
  purchase_order_id?: string;
  po_number?: string;
  customer_name: string;
  company_name?: string;
  start_date?: string;
  end_date?: string;
  contract_value: number;
  currency?: string;
  notes?: string;
}
