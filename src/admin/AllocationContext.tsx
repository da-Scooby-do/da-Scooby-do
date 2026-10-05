import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { EquipmentAllocation, AllocationHistory, AllocationStatus } from './allocation-types';
import { datesOverlap } from './allocation-types';

interface AllocationContextValue {
  allocations: EquipmentAllocation[];
  history: AllocationHistory[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addAllocation: (a: EquipmentAllocation, employeeId: string, employeeName: string) => Promise<void>;
  updateAllocation: (a: EquipmentAllocation) => Promise<void>;
  setAllocationStatus: (id: string, status: AllocationStatus, employeeId: string, employeeName: string, reason?: string) => Promise<void>;
  cancelAllocation: (id: string, employeeId: string, employeeName: string, reason: string) => Promise<void>;
  releaseAllocation: (id: string, employeeId: string, employeeName: string) => Promise<void>;
  getAllocation: (id: string) => EquipmentAllocation | undefined;
  allocationsByUnit: (unitId: string) => EquipmentAllocation[];
  allocationsByContract: (contractId: string) => EquipmentAllocation[];
  hasConflict: (unitId: string, startDate: string, endDate: string, excludeAllocationId?: string) => EquipmentAllocation | null;
  historyByAllocation: (allocationId: string) => AllocationHistory[];
}

const AllocationContext = createContext<AllocationContextValue | undefined>(undefined);

function mapAllocation(row: Record<string, unknown>): EquipmentAllocation {
  return {
    id: row.id as string,
    allocationNumber: (row.allocation_number as string) || '',
    contractId: (row.contract_id as string) || '',
    contractNumber: (row.contract_number as string) || '',
    requestId: (row.request_id as string) || '',
    requestNumber: (row.request_reference as string) || '',
    customerId: '',
    customerName: (row.customer_name as string) || '',
    companyName: (row.company_name as string) || '',
    modelId: (row.model_id as string) || '',
    modelName: (row.model_name as string) || '',
    unitId: (row.unit_id as string) || '',
    unitCode: (row.unit_code as string) || '',
    projectName: (row.project_name as string) || '',
    location: (row.location as string) || '',
    startDate: (row.start_date as string) || '',
    expectedEndDate: (row.expected_end_date as string) || '',
    assignedEmployeeId: (row.assigned_employee_id as string) || '',
    assignedEmployeeName: (row.assigned_employee_name as string) || '',
    status: (row.status as AllocationStatus) || 'pending',
    overrideReason: (row.override_reason as string) || '',
    internalNotes: (row.internal_notes as string) || '',
    createdAt: (row.created_at as string) || '',
  };
}

function mapHistory(row: Record<string, unknown>): AllocationHistory {
  return {
    id: row.id as string,
    allocationId: (row.allocation_id as string) || '',
    action: (row.action as AllocationHistory['action']) || 'created',
    employeeId: (row.employee_id as string) || '',
    employeeName: (row.employee_name as string) || '',
    reason: (row.reason as string) || '',
    timestamp: (row.created_at as string) || '',
  };
}

export function AllocationProvider({ children }: { children: ReactNode }) {
  const [allocations, setAllocations] = useState<EquipmentAllocation[]>([]);
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, hRes] = await Promise.all([
        supabase.from('equipment_allocations').select('*').order('created_at', { ascending: false }),
        supabase.from('equipment_allocation_history').select('*').order('created_at', { ascending: true }),
      ]);
      if (aRes.error) throw aRes.error;
      if (hRes.error) throw hRes.error;
      setAllocations((aRes.data || []).map(mapAllocation));
      setHistory((hRes.data || []).map(mapHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addAllocation = async (a: EquipmentAllocation, employeeId: string, employeeName: string) => {
    const { error: e } = await supabase.from('equipment_allocations').insert({
      rental_operation_id: a.contractId ? null : undefined,
      contract_id: a.contractId || null,
      contract_number: a.contractNumber,
      request_id: a.requestId,
      request_reference: a.requestNumber,
      customer_name: a.customerName,
      company_name: a.companyName,
      model_id: a.modelId || null,
      model_name: a.modelName,
      unit_id: a.unitId || null,
      unit_code: a.unitCode,
      project_name: a.projectName,
      location: a.location,
      start_date: a.startDate,
      expected_end_date: a.expectedEndDate || null,
      assigned_employee_id: employeeId || null,
      assigned_employee_name: employeeName,
      status: a.status,
      override_reason: a.overrideReason,
      internal_notes: a.internalNotes,
    });
    if (e) throw e;
    await reload();
  };

  const updateAllocation = async (a: EquipmentAllocation) => {
    const { error: e } = await supabase.from('equipment_allocations').update({
      contract_id: a.contractId || null,
      contract_number: a.contractNumber,
      request_id: a.requestId,
      request_reference: a.requestNumber,
      customer_name: a.customerName,
      company_name: a.companyName,
      model_id: a.modelId || null,
      model_name: a.modelName,
      unit_id: a.unitId || null,
      unit_code: a.unitCode,
      project_name: a.projectName,
      location: a.location,
      start_date: a.startDate,
      expected_end_date: a.expectedEndDate || null,
      status: a.status,
      override_reason: a.overrideReason,
      internal_notes: a.internalNotes,
    }).eq('id', a.id);
    if (e) throw e;
    await reload();
  };

  const setAllocationStatus = async (id: string, status: AllocationStatus, _employeeId: string, _employeeName: string, _reason?: string) => {
    const { error: e } = await supabase.from('equipment_allocations').update({ status }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const cancelAllocation = async (id: string, _employeeId: string, _employeeName: string, reason: string) => {
    const { error: e } = await supabase.from('equipment_allocations').update({ status: 'cancelled', override_reason: reason }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const releaseAllocation = async (id: string, _employeeId: string, _employeeName: string) => {
    const { error: e } = await supabase.from('equipment_allocations').update({ status: 'released' }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const getAllocation = (id: string) => allocations.find((a) => a.id === id);
  const allocationsByUnit = (unitId: string) => allocations.filter((a) => a.unitId === unitId && (a.status === 'reserved' || a.status === 'allocated'));
  const allocationsByContract = (contractId: string) => allocations.filter((a) => a.contractId === contractId);
  const historyByAllocation = (allocationId: string) => history.filter((h) => h.allocationId === allocationId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const hasConflict = (unitId: string, startDate: string, endDate: string, excludeAllocationId?: string): EquipmentAllocation | null => {
    const active = allocations.filter((a) =>
      a.unitId === unitId &&
      (a.status === 'reserved' || a.status === 'allocated') &&
      a.id !== excludeAllocationId
    );
    for (const a of active) {
      if (datesOverlap(startDate, endDate, a.startDate, a.expectedEndDate)) return a;
    }
    return null;
  };

  return (
    <AllocationContext.Provider value={{
      allocations, history, loading, error, reload,
      addAllocation, updateAllocation, setAllocationStatus, cancelAllocation, releaseAllocation,
      getAllocation, allocationsByUnit, allocationsByContract, hasConflict, historyByAllocation,
    }}>
      {children}
    </AllocationContext.Provider>
  );
}

export function useAllocation() {
  const ctx = useContext(AllocationContext);
  if (!ctx) throw new Error('useAllocation must be used within AllocationProvider');
  return ctx;
}
