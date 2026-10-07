export type POStatus = 'requested' | 'received' | 'reviewing' | 'accepted' | 'rejected';

export interface PurchaseOrderRow {
  id: string;
  po_number: string;
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference: string | null;
  quotation_id: string | null;
  quotation_reference: string | null;
  customer_name: string;
  company_name: string | null;
  po_date: string;
  amount: number;
  currency: string;
  status: POStatus;
  document_path: string | null;
  document_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  customer_email?: string | null;
  /** The customer's own PO number (po_number is SAHAB's reference). */
  customer_po_number?: string | null;
  submitted_by_customer?: boolean;
}

export interface POHistoryRow {
  id: string;
  po_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export const poStatusLabels: Record<POStatus, { ar: string; en: string }> = {
  requested: { ar: 'مطلوب', en: 'Requested' },
  received: { ar: 'تم الاستلام', en: 'Received' },
  reviewing: { ar: 'قيد المراجعة', en: 'Reviewing' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};

export const poStatusColors: Record<POStatus, string> = {
  requested: 'bg-yellow-accent/10 text-yellow-accent',
  received: 'bg-cyan-500/10 text-cyan-500',
  reviewing: 'bg-blue-500/10 text-blue-500',
  accepted: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
};

export const allPOStatuses: POStatus[] = ['requested', 'received', 'reviewing', 'accepted', 'rejected'];

export interface CreatePOPayload {
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference: string;
  quotation_id?: string;
  quotation_reference?: string;
  customer_name: string;
  company_name?: string;
  po_date?: string;
  amount: number;
  currency?: string;
  notes?: string;
}
