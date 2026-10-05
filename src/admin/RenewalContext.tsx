import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContractRow } from '@/contract/types';
import type {
  ContractRenewal, RenewalStatus, RenewalPeriod, CustomerClassification,
  RenewalAllocationChoice, RenewalPricing, RenewalHistoryEntry,
} from './renewal-types';
import {
  generateRenewalId, generateHistoryId, periodToDays,
  calculateRenewalPricing, createEmptyRenewalPricing, daysUntilExpiry,
} from './renewal-types';

interface RenewalContextValue {
  renewals: ContractRenewal[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  renewalsByCustomer: (customerId: string) => ContractRenewal[];
  renewalsByContract: (contractId: string) => ContractRenewal[];
  getRenewal: (id: string) => ContractRenewal | undefined;
  getRenewalChain: (contractId: string) => ContractRenewal[];
  createRenewal: (contract: ContractRow, opts: {
    renewalPeriod: RenewalPeriod;
    customPeriodDays: number;
    assignedEmployeeId: string;
    assignedEmployeeName: string;
    customerClassification: CustomerClassification;
  }) => Promise<ContractRenewal | null>;
  updateRenewal: (id: string, updates: Partial<ContractRenewal>) => Promise<void>;
  updatePricing: (id: string, pricingPatch: Partial<RenewalPricing>) => Promise<void>;
  setRenewalStatus: (id: string, status: RenewalStatus, employeeId: string, employeeName: string, notes?: string) => Promise<void>;
  setAllocationChoice: (id: string, choice: RenewalAllocationChoice, newAllocationId?: string) => Promise<void>;
  setCustomerClassification: (id: string, classification: CustomerClassification) => Promise<void>;
  cancelRenewal: (id: string, employeeId: string, employeeName: string, reason: string) => Promise<void>;
  customerAccept: (id: string) => Promise<void>;
  customerReject: (id: string, reason: string) => Promise<void>;
  linkContract: (id: string, contractId: string, contractNumber: string) => Promise<void>;
}

const RenewalContext = createContext<RenewalContextValue | undefined>(undefined);

function mapRenewal(row: Record<string, unknown>): ContractRenewal {
  const pricing = (row.pricing as Record<string, number>) || {};
  return {
    id: row.id as string,
    renewalNumber: (row.renewal_number as string) || '',
    originalContractId: (row.original_contract_id as string) || '',
    originalContractNumber: (row.original_contract_number as string) || '',
    previousRenewalId: (row.previous_renewal_id as string) || null,
    previousRenewalNumber: (row.previous_renewal_number as string) || null,
    customerId: '',
    customerName: (row.customer_name as string) || '',
    companyName: (row.company_name as string) || '',
    company: {} as ContractRenewal['company'],
    customerClassification: (row.customer_classification as CustomerClassification) || 'standard',
    items: [],
    equipmentModel: (row.equipment_model as string) || '',
    quantity: Number(row.quantity) || 1,
    renewalPeriod: (row.renewal_period as RenewalPeriod) || '1_month',
    customPeriodDays: Number(row.custom_period_days) || 0,
    currentStartDate: (row.current_start_date as string) || '',
    currentEndDate: (row.current_end_date as string) || '',
    newStartDate: (row.new_start_date as string) || '',
    newEndDate: (row.new_end_date as string) || '',
    remainingDays: Number(row.remaining_days) || 0,
    pricing: {
      currentPrice: Number(pricing.currentPrice) || 0,
      newPrice: Number(pricing.newPrice) || 0,
      discount: Number(pricing.discount) || 0,
      additionalCharges: Number(pricing.additionalCharges) || 0,
      transportation: Number(pricing.transportation) || 0,
      operator: Number(pricing.operator) || 0,
      diesel: Number(pricing.diesel) || 0,
      subtotal: Number(pricing.subtotal) || 0,
      vat: Number(pricing.vat) || 0,
      total: Number(pricing.total) || 0,
    },
    operator: (row.operator as string) || '',
    diesel: (row.diesel as string) || '',
    transportation: (row.transportation as string) || '',
    projectName: (row.project_name as string) || '',
    location: (row.location as string) || '',
    status: (row.status as RenewalStatus) || 'draft',
    assignedEmployeeId: (row.assigned_employee_id as string) || '',
    assignedEmployeeName: (row.assigned_employee_name as string) || '',
    allocationChoice: (row.allocation_choice as RenewalAllocationChoice) || 'pending',
    newAllocationId: (row.new_allocation_id as string) || null,
    newContractId: (row.new_contract_id as string) || null,
    newContractNumber: (row.new_contract_number as string) || null,
    history: [],
    internalNotes: (row.internal_notes as string) || '',
    customerRejectionReason: (row.customer_rejection_reason as string) || null,
    createdAt: (row.created_at as string) || '',
    createdBy: (row.assigned_employee_name as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

export function RenewalProvider({ children }: { children: ReactNode }) {
  const [renewals, setRenewals] = useState<ContractRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('contract_renewals')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      const mapped = (data || []).map(mapRenewal);
      // Load history for all renewals
      const { data: histData, error: histError } = await supabase
        .from('contract_renewal_history')
        .select('*')
        .order('created_at', { ascending: true });
      if (histError) throw histError;
      const histByRenewal = new Map<string, RenewalHistoryEntry[]>();
      for (const h of (histData || [])) {
        const entry: RenewalHistoryEntry = {
          id: h.id as string,
          action: (h.action as string) || '',
          actionAr: (h.action_ar as string) || '',
          employeeId: (h.employee_id as string) || '',
          employeeName: (h.employee_name as string) || '',
          previousStatus: (h.previous_status as RenewalStatus) || null,
          newStatus: (h.new_status as RenewalStatus) || 'draft',
          notes: (h.notes as string) || '',
          pricingChanged: Boolean(h.pricing_changed),
          timestamp: (h.created_at as string) || '',
        };
        const arr = histByRenewal.get(h.renewal_id as string) || [];
        arr.push(entry);
        histByRenewal.set(h.renewal_id as string, arr);
      }
      setRenewals(mapped.map((r) => ({ ...r, history: histByRenewal.get(r.id) || [] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load renewals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const renewalsByCustomer = (customerId: string) => renewals.filter((r) => r.customerId === customerId || r.customerName === customerId);
  const renewalsByContract = (contractId: string) => renewals.filter((r) => r.originalContractId === contractId);
  const getRenewal = (id: string) => renewals.find((r) => r.id === id);
  const getRenewalChain = (contractId: string) => renewals.filter((r) => r.originalContractId === contractId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const createRenewal = async (contract: ContractRow, opts: {
    renewalPeriod: RenewalPeriod;
    customPeriodDays: number;
    assignedEmployeeId: string;
    assignedEmployeeName: string;
    customerClassification: CustomerClassification;
  }): Promise<ContractRenewal | null> => {
    const days = periodToDays(opts.renewalPeriod, opts.customPeriodDays);
    const today = new Date().toISOString().split('T')[0];
    const currentEnd = contract.end_date || today;
    const newStart = currentEnd;
    const newEnd = new Date(new Date(newStart).getTime() + days * 86400000).toISOString().split('T')[0];

    const { data, error: e } = await supabase.from('contract_renewals').insert({
      original_contract_id: contract.id,
      original_contract_number: contract.contract_number || '',
      customer_name: contract.customer_name || '',
      company_name: contract.company_name || '',
      customer_email: null,
      customer_classification: opts.customerClassification,
      equipment_model: contract.title || '',
      quantity: 1,
      renewal_period: opts.renewalPeriod,
      custom_period_days: opts.customPeriodDays,
      current_start_date: contract.start_date || null,
      current_end_date: contract.end_date || null,
      new_start_date: newStart,
      new_end_date: newEnd,
      remaining_days: contract.end_date ? daysUntilExpiry(contract.end_date) : 0,
      pricing: createEmptyRenewalPricing(),
      operator: '',
      diesel: '',
      transportation: '',
      project_name: '',
      location: '',
      status: 'draft',
      assigned_employee_id: opts.assignedEmployeeId || null,
      assigned_employee_name: opts.assignedEmployeeName,
      allocation_choice: 'pending',
    }).select().single();
    if (e) throw e;

    // Insert history entry
    await supabase.from('contract_renewal_history').insert({
      renewal_id: data.id,
      action: 'created',
      action_ar: 'إنشاء تجديد',
      employee_id: opts.assignedEmployeeId || null,
      employee_name: opts.assignedEmployeeName,
      new_status: 'draft',
    });

    await reload();
    return renewals.find((r) => r.id === data.id) || null;
  };

  const updateRenewal = async (id: string, updates: Partial<ContractRenewal>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;
    if (updates.assignedEmployeeId !== undefined) dbUpdates.assigned_employee_id = updates.assignedEmployeeId;
    if (updates.assignedEmployeeName !== undefined) dbUpdates.assigned_employee_name = updates.assignedEmployeeName;
    if (updates.allocationChoice !== undefined) dbUpdates.allocation_choice = updates.allocationChoice;
    if (updates.newAllocationId !== undefined) dbUpdates.new_allocation_id = updates.newAllocationId;
    if (updates.newContractId !== undefined) dbUpdates.new_contract_id = updates.newContractId;
    if (updates.newContractNumber !== undefined) dbUpdates.new_contract_number = updates.newContractNumber;
    if (updates.customerRejectionReason !== undefined) dbUpdates.customer_rejection_reason = updates.customerRejectionReason;
    if (updates.pricing !== undefined) dbUpdates.pricing = updates.pricing;
    if (Object.keys(dbUpdates).length > 0) {
      const { error: e } = await supabase.from('contract_renewals').update(dbUpdates).eq('id', id);
      if (e) throw e;
    }
    await reload();
  };

  const updatePricing = async (id: string, pricingPatch: Partial<RenewalPricing>) => {
    const renewal = renewals.find((r) => r.id === id);
    if (!renewal) return;
    const merged = { ...renewal.pricing, ...pricingPatch };
    const recalculated = calculateRenewalPricing(
      merged.newPrice, merged.discount, merged.additionalCharges,
      merged.transportation, merged.operator, merged.diesel,
    );
    recalculated.currentPrice = renewal.pricing.currentPrice;
    await updateRenewal(id, { pricing: recalculated });
  };

  const setRenewalStatus = async (id: string, status: RenewalStatus, employeeId: string, employeeName: string, notes?: string) => {
    const renewal = renewals.find((r) => r.id === id);
    const prevStatus = renewal?.status || null;
    const { error: e } = await supabase.from('contract_renewals').update({ status }).eq('id', id);
    if (e) throw e;
    await supabase.from('contract_renewal_history').insert({
      renewal_id: id,
      action: 'status_change',
      action_ar: 'تغيير الحالة',
      employee_id: employeeId || null,
      employee_name: employeeName,
      previous_status: prevStatus,
      new_status: status,
      notes: notes || '',
    });
    await reload();
  };

  const setAllocationChoice = async (id: string, choice: RenewalAllocationChoice, newAllocationId?: string) => {
    await updateRenewal(id, { allocationChoice: choice, newAllocationId: newAllocationId || null });
  };

  const setCustomerClassification = async (id: string, classification: CustomerClassification) => {
    const { error: e } = await supabase.from('contract_renewals').update({ customer_classification: classification }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const cancelRenewal = async (id: string, employeeId: string, employeeName: string, reason: string) => {
    await setRenewalStatus(id, 'cancelled', employeeId, employeeName, reason);
  };

  const customerAccept = async (id: string) => {
    const { error: e } = await supabase.rpc('customer_accept_renewal', { p_renewal_id: id });
    if (e) throw e;
    await reload();
  };

  const customerReject = async (id: string, reason: string) => {
    const { error: e } = await supabase.rpc('customer_reject_renewal', { p_renewal_id: id, p_reason: reason });
    if (e) throw e;
    await reload();
  };

  const linkContract = async (id: string, contractId: string, contractNumber: string) => {
    const { error: e } = await supabase.from('contract_renewals').update({
      new_contract_id: contractId,
      new_contract_number: contractNumber,
      status: 'active',
    }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  return (
    <RenewalContext.Provider value={{
      renewals, loading, error, reload,
      renewalsByCustomer, renewalsByContract, getRenewal, getRenewalChain,
      createRenewal, updateRenewal, updatePricing, setRenewalStatus,
      setAllocationChoice, setCustomerClassification, cancelRenewal,
      customerAccept, customerReject, linkContract,
    }}>
      {children}
    </RenewalContext.Provider>
  );
}

export function useRenewal() {
  const ctx = useContext(RenewalContext);
  if (!ctx) throw new Error('useRenewal must be used within RenewalProvider');
  return ctx;
}
