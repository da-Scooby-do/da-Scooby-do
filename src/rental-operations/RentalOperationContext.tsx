import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { RentalOperationRow, RentalOpStatus, RentalExtensionRow, RentalOpHistoryRow, CreateRentalOpPayload, TransportOption, FuelOption } from './types';
import { MAX_EXTENSION_MONTHS, durationToMonths } from './types';

interface RentalOperationContextValue {
  rentalOperations: RentalOperationRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createRentalOperation: (payload: CreateRentalOpPayload) => Promise<RentalOperationRow | null>;
  updateRentalOperation: (id: string, updates: Partial<RentalOperationRow>) => Promise<void>;
  updateRentalOpStatus: (id: string, status: RentalOpStatus) => Promise<void>;
  deleteRentalOperation: (id: string) => Promise<void>;
  recordHandover: (id: string, data: { handover_date: string; handover_location?: string; handover_notes?: string; receiver_name?: string; receiver_phone?: string }) => Promise<void>;
  recordReturn: (id: string, data: { actual_return_date: string; return_notes?: string; return_condition_note?: string }) => Promise<void>;
  createExtension: (rentalOpId: string, data: { extension_date: string; new_expected_end_date: string; extension_period: string; reason?: string }) => Promise<{ success: boolean; error?: string }>;
  getExtensions: (rentalOpId: string) => Promise<RentalExtensionRow[]>;
  getHistory: (rentalOpId: string) => Promise<RentalOpHistoryRow[]>;
}

const RentalOperationContext = createContext<RentalOperationContextValue | undefined>(undefined);

export function RentalOperationProvider({ children }: { children: ReactNode }) {
  const [rentalOperations, setRentalOperations] = useState<RentalOperationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('rental_operations')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setRentalOperations((data as RentalOperationRow[] | null) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rental operations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const createRentalOperation = async (payload: CreateRentalOpPayload): Promise<RentalOperationRow | null> => {
    const { data, error: insertError } = await supabase
      .from('rental_operations')
      .insert({
        request_type: 'rental',
        request_id: payload.request_id,
        request_reference: payload.request_reference,
        quotation_id: payload.quotation_id || null,
        quotation_reference: payload.quotation_reference || null,
        purchase_order_id: payload.purchase_order_id || null,
        po_number: payload.po_number || null,
        contract_id: payload.contract_id || null,
        contract_number: payload.contract_number || null,
        customer_name: payload.customer_name,
        company_name: payload.company_name || null,
        customer_phone: payload.customer_phone || '',
        customer_email: payload.customer_email || null,
        equipment_model_id: payload.equipment_model_id || null,
        equipment_name: payload.equipment_name || null,
        equipment_unit_id: payload.equipment_unit_id || null,
        category_name: payload.category_name || null,
        brand_name: payload.brand_name || null,
        model_name: payload.model_name || null,
        year: payload.year || null,
        start_date: payload.start_date || new Date().toISOString().split('T')[0],
        expected_end_date: payload.expected_end_date || null,
        rental_period: payload.rental_period || 'monthly',
        rental_location: payload.rental_location || null,
        agreed_amount: payload.agreed_amount || 0,
        currency: payload.currency || 'SAR',
        transport_responsibility: payload.transport_responsibility || 'renter',
        fuel_responsibility: payload.fuel_responsibility || 'renter',
        notes: payload.notes || null,
        status: 'approved',
      })
      .select()
      .single();
    if (insertError) throw insertError;
    await reload();
    return data as RentalOperationRow;
  };

  const updateRentalOperation = async (id: string, updates: Partial<RentalOperationRow>) => {
    const { error: updateError } = await supabase.from('rental_operations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const updateRentalOpStatus = async (id: string, status: RentalOpStatus) => {
    const { error: updateError } = await supabase.from('rental_operations').update({ status }).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const deleteRentalOperation = async (id: string) => {
    const { error: deleteError } = await supabase.from('rental_operations').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await reload();
  };

  const recordHandover = async (id: string, data: { handover_date: string; handover_location?: string; handover_notes?: string; receiver_name?: string; receiver_phone?: string }) => {
    const updates: Record<string, unknown> = {
      handover_date: data.handover_date,
      handover_location: data.handover_location || null,
      handover_notes: data.handover_notes || null,
      receiver_name: data.receiver_name || null,
      receiver_phone: data.receiver_phone || null,
      handover_confirmed: true,
      status: 'delivered',
    };
    const { error: updateError } = await supabase.from('rental_operations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const recordReturn = async (id: string, data: { actual_return_date: string; return_notes?: string; return_condition_note?: string }) => {
    const updates: Record<string, unknown> = {
      actual_return_date: data.actual_return_date,
      return_notes: data.return_notes || null,
      return_condition_note: data.return_condition_note || null,
      status: 'completed',
    };
    const { error: updateError } = await supabase.from('rental_operations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const createExtension = async (
    rentalOpId: string,
    data: { extension_date: string; new_expected_end_date: string; extension_period: string; reason?: string },
  ): Promise<{ success: boolean; error?: string }> => {
    const extensionMonths = durationToMonths(data.extension_period);
    if (extensionMonths > MAX_EXTENSION_MONTHS) {
      return { success: false, error: `Extension cannot exceed ${MAX_EXTENSION_MONTHS} months` };
    }

    // Calculate months between extension_date and new_expected_end_date as a secondary check
    const start = new Date(data.extension_date);
    const end = new Date(data.new_expected_end_date);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (diffMonths > MAX_EXTENSION_MONTHS) {
      return { success: false, error: `Extension period (${diffMonths} months) exceeds the maximum of ${MAX_EXTENSION_MONTHS} months` };
    }

    const { error: insertError } = await supabase
      .from('rental_extensions')
      .insert({
        rental_operation_id: rentalOpId,
        extension_date: data.extension_date,
        new_expected_end_date: data.new_expected_end_date,
        extension_period: data.extension_period,
        extension_months: extensionMonths,
        reason: data.reason || null,
      });
    if (insertError) throw insertError;

    // Update the rental operation's expected_end_date
    const { error: updateError } = await supabase
      .from('rental_operations')
      .update({ expected_end_date: data.new_expected_end_date })
      .eq('id', rentalOpId);
    if (updateError) throw updateError;

    await reload();
    return { success: true };
  };

  const getExtensions = async (rentalOpId: string): Promise<RentalExtensionRow[]> => {
    const { data, error } = await supabase
      .from('rental_extensions')
      .select('*')
      .eq('rental_operation_id', rentalOpId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as RentalExtensionRow[] | null) || [];
  };

  const getHistory = async (rentalOpId: string): Promise<RentalOpHistoryRow[]> => {
    const { data, error } = await supabase
      .from('rental_operation_history')
      .select('*')
      .eq('rental_operation_id', rentalOpId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as RentalOpHistoryRow[] | null) || [];
  };

  return (
    <RentalOperationContext.Provider
      value={{
        rentalOperations, loading, error, reload,
        createRentalOperation, updateRentalOperation, updateRentalOpStatus, deleteRentalOperation,
        recordHandover, recordReturn, createExtension, getExtensions, getHistory,
      }}
    >
      {children}
    </RentalOperationContext.Provider>
  );
}

export function useRentalOperation() {
  const ctx = useContext(RentalOperationContext);
  if (!ctx) throw new Error('useRentalOperation must be used within RentalOperationProvider');
  return ctx;
}
