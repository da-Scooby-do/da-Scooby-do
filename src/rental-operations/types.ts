export type RentalOpStatus = 'approved' | 'awaiting_delivery' | 'delivered' | 'active' | 'awaiting_return' | 'completed' | 'cancelled';

export type TransportOption = 'renter' | 'sahab' | 'per_agreement';
export type FuelOption = 'renter' | 'sahab' | 'per_agreement';
export type RentalDuration = 'daily' | 'weekly' | 'monthly' | '6months' | 'yearly';

export interface RentalOperationRow {
  id: string;
  rental_reference: string;
  request_type: string;
  request_id: string;
  request_reference: string | null;
  quotation_id: string | null;
  quotation_reference: string | null;
  purchase_order_id: string | null;
  po_number: string | null;
  contract_id: string | null;
  contract_number: string | null;
  customer_name: string;
  company_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  equipment_model_id: string | null;
  equipment_name: string | null;
  equipment_unit_id: string | null;
  category_name: string | null;
  brand_name: string | null;
  model_name: string | null;
  year: string | null;
  start_date: string;
  expected_end_date: string | null;
  rental_period: string;
  rental_location: string | null;
  agreed_amount: number;
  currency: string;
  status: RentalOpStatus;
  transport_responsibility: TransportOption;
  fuel_responsibility: FuelOption;
  notes: string | null;
  handover_date: string | null;
  handover_location: string | null;
  handover_notes: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  handover_confirmed: boolean;
  actual_return_date: string | null;
  return_notes: string | null;
  return_condition_note: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalExtensionRow {
  id: string;
  rental_operation_id: string;
  extension_date: string;
  new_expected_end_date: string;
  extension_period: string;
  extension_months: number;
  reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface RentalOpHistoryRow {
  id: string;
  rental_operation_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export const rentalOpStatusLabels: Record<RentalOpStatus, { ar: string; en: string }> = {
  approved: { ar: 'معتمد', en: 'Approved' },
  awaiting_delivery: { ar: 'بانتظار التسليم', en: 'Awaiting Delivery' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  active: { ar: 'نشط', en: 'Active' },
  awaiting_return: { ar: 'بانتظار الإرجاع', en: 'Awaiting Return' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export const rentalOpStatusColors: Record<RentalOpStatus, string> = {
  approved: 'bg-yellow-accent/10 text-yellow-accent',
  awaiting_delivery: 'bg-cyan-500/10 text-cyan-500',
  delivered: 'bg-blue-500/10 text-blue-500',
  active: 'bg-green-500/10 text-green-500',
  awaiting_return: 'bg-orange-500/10 text-orange-500',
  completed: 'bg-teal-500/10 text-teal-500',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const allRentalOpStatuses: RentalOpStatus[] = [
  'approved', 'awaiting_delivery', 'delivered', 'active', 'awaiting_return', 'completed', 'cancelled',
];

// Status transition map — prevents impossible transitions
export const statusTransitions: Record<RentalOpStatus, RentalOpStatus[]> = {
  approved: ['awaiting_delivery', 'cancelled'],
  awaiting_delivery: ['delivered', 'cancelled'],
  delivered: ['active', 'cancelled'],
  active: ['awaiting_return', 'cancelled'],
  awaiting_return: ['completed', 'active'],
  completed: [],
  cancelled: [],
};

export const transportLabels: Record<TransportOption, { ar: string; en: string }> = {
  renter: { ar: 'على المستأجر', en: 'Renter' },
  sahab: { ar: 'على SAHAB', en: 'SAHAB' },
  per_agreement: { ar: 'حسب الاتفاق', en: 'Per Agreement' },
};

export const fuelLabels: Record<FuelOption, { ar: string; en: string }> = {
  renter: { ar: 'على المستأجر', en: 'Renter' },
  sahab: { ar: 'على SAHAB', en: 'SAHAB' },
  per_agreement: { ar: 'حسب الاتفاق', en: 'Per Agreement' },
};

export const durationLabels: Record<RentalDuration, { ar: string; en: string }> = {
  daily: { ar: 'يومي', en: 'Daily' },
  weekly: { ar: 'أسبوعي', en: 'Weekly' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  '6months': { ar: '6 أشهر', en: '6 Months' },
  yearly: { ar: 'سنة', en: 'Yearly' },
};

export const allDurations: RentalDuration[] = ['daily', 'weekly', 'monthly', '6months', 'yearly'];

// Maximum extension period: 6 months
export const MAX_EXTENSION_MONTHS = 6;

export function durationToMonths(duration: string): number {
  switch (duration) {
    case 'daily': return 1 / 30;
    case 'weekly': return 7 / 30;
    case 'monthly': return 1;
    case '6months': return 6;
    case 'yearly': return 12;
    default: return 0;
  }
}

export interface CreateRentalOpPayload {
  request_id: string;
  request_reference: string;
  quotation_id?: string;
  quotation_reference?: string;
  purchase_order_id?: string;
  po_number?: string;
  contract_id?: string;
  contract_number?: string;
  customer_name: string;
  company_name?: string;
  customer_phone?: string;
  customer_email?: string;
  equipment_model_id?: string;
  equipment_name?: string;
  equipment_unit_id?: string;
  category_name?: string;
  brand_name?: string;
  model_name?: string;
  year?: string;
  start_date?: string;
  expected_end_date?: string;
  rental_period?: string;
  rental_location?: string;
  agreed_amount?: number;
  currency?: string;
  transport_responsibility?: TransportOption;
  fuel_responsibility?: FuelOption;
  notes?: string;
}
