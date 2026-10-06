import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { submitPublicRequest } from '@/lib/publicRequests';
import type { RentalRequestRow, RentalRequestStatus, RentalDuration, RentalRequest, RentalRequestDraft, ResponsibleParty } from './types';
import type { CompanyProfile } from '@/customer/types';
import { generateRequestNumber } from './types';

interface SubmitRentalRequestData {
  equipment_model_id: string | null;
  equipment_variant_id: string | null;
  equipment_name: string;
  equipment_name_ar: string;
  customer_name: string;
  company_name?: string;
  phone: string;
  email?: string;
  rental_period: RentalDuration;
  requested_start_date?: string;
  project_city?: string;
  project_location?: string;
  notes?: string;
  transport_by: ResponsibleParty;
  fuel_by: ResponsibleParty;
  terms_accepted: boolean;
}

interface RentalContextValue {
  // DB-backed (new)
  requests: RentalRequestRow[];
  loading: boolean;
  error: string | null;
  submitRequest: (data: SubmitRentalRequestData) => Promise<RentalRequestRow | null>;
  updateStatus: (id: string, status: RentalRequestStatus) => Promise<void>;
  updateInternalNotes: (id: string, notes: string) => Promise<void>;
  updateAssignedTo: (id: string, assignedTo: string | null) => Promise<void>;
  reload: () => Promise<void>;
  // Legacy (for customer portal + quotation system, in-memory)
  draft: RentalRequestDraft | null;
  setDraft: (d: RentalRequestDraft | null) => void;
  legacyRequests: RentalRequest[];
  legacySubmitRequest: (draft: RentalRequestDraft, customerId: string, customerName: string) => RentalRequest;
  requestsByCustomer: (customerId: string) => RentalRequest[];
}

const RentalContext = createContext<RentalContextValue | undefined>(undefined);

export function RentalProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<RentalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Legacy in-memory state for customer portal
  const [legacyRequests, setLegacyRequests] = useState<RentalRequest[]>([]);
  const [draft, setDraft] = useState<RentalRequestDraft | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('rental_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setRequests((data as RentalRequestRow[] | null) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rental requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const submitRequest = async (data: SubmitRentalRequestData): Promise<RentalRequestRow | null> => {
    const insertData = {
      equipment_model_id: data.equipment_model_id,
      equipment_variant_id: data.equipment_variant_id,
      equipment_name: data.equipment_name,
      equipment_name_ar: data.equipment_name_ar,
      customer_name: data.customer_name,
      company_name: data.company_name || null,
      phone: data.phone,
      email: data.email || null,
      rental_period: data.rental_period,
      requested_start_date: data.requested_start_date || null,
      project_city: data.project_city || null,
      project_location: data.project_location || null,
      notes: data.notes || null,
      transport_by: data.transport_by,
      fuel_by: data.fuel_by,
      terms_accepted: data.terms_accepted,
      status: 'new' as RentalRequestStatus,
    };

    const inserted = await submitPublicRequest('rental_requests', insertData);

    // Only staff/customers can list requests; a failed reload must not hide a successful submit.
    reload().catch(() => {});
    return inserted as unknown as RentalRequestRow;
  };

  const updateStatus = async (id: string, status: RentalRequestStatus) => {
    const { error: updateError } = await supabase
      .from('rental_requests')
      .update({ status })
      .eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const updateInternalNotes = async (id: string, notes: string) => {
    const { error: updateError } = await supabase
      .from('rental_requests')
      .update({ internal_notes: notes })
      .eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const updateAssignedTo = async (id: string, assignedTo: string | null) => {
    const { error: updateError } = await supabase
      .from('rental_requests')
      .update({ assigned_to: assignedTo })
      .eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  // Legacy methods for customer portal compatibility
  const legacySubmitRequest = (d: RentalRequestDraft, customerId: string, customerName: string): RentalRequest => {
    const newReq: RentalRequest = {
      id: `rr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestNumber: generateRequestNumber(legacyRequests.length),
      customerId,
      customerName,
      items: d.items,
      duration: d.duration,
      startDate: d.startDate,
      operator: d.operator,
      diesel: d.diesel,
      transport: d.transport,
      projectName: d.projectName,
      region: d.region,
      city: d.city,
      siteLocation: d.siteLocation,
      notes: d.notes,
      company: d.company || {} as CompanyProfile,
      status: 'new',
      internalNotes: '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLegacyRequests((prev) => [...prev, newReq]);
    return newReq;
  };

  const requestsByCustomer = (customerId: string) =>
    legacyRequests.filter((r) => r.customerId === customerId);

  return (
    <RentalContext.Provider
      value={{
        requests, loading, error, submitRequest, updateStatus, updateInternalNotes, updateAssignedTo, reload,
        draft, setDraft, legacyRequests, legacySubmitRequest, requestsByCustomer,
      }}
    >
      {children}
    </RentalContext.Provider>
  );
}

export function useRental() {
  const ctx = useContext(RentalContext);
  if (!ctx) throw new Error('useRental must be used within RentalProvider');
  return ctx;
}
