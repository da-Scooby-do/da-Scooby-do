import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { DeliveryRecord, DeliveryStatus, DeliveryCondition, DeliveryAcknowledgment, ReturnRecord, ReturnStatus } from './delivery-types';

interface DeliveryContextValue {
  deliveries: DeliveryRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addDelivery: (d: DeliveryRecord) => Promise<void>;
  updateDelivery: (d: DeliveryRecord) => Promise<void>;
  setDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<void>;
  setDeliveryCondition: (id: string, condition: DeliveryCondition) => Promise<void>;
  setAcknowledgment: (id: string, ack: DeliveryAcknowledgment) => Promise<void>;
  createReturn: (deliveryId: string, ret: ReturnRecord) => Promise<void>;
  updateReturn: (deliveryId: string, ret: ReturnRecord) => Promise<void>;
  setReturnStatus: (deliveryId: string, status: ReturnStatus) => Promise<void>;
  getDelivery: (id: string) => DeliveryRecord | undefined;
  deliveriesByCustomer: (customerId: string) => DeliveryRecord[];
  deliveriesByAllocation: (allocationId: string) => DeliveryRecord[];
  hasDeliveryForAllocation: (allocationId: string) => boolean;
}

const DeliveryContext = createContext<DeliveryContextValue | undefined>(undefined);

function mapDelivery(row: Record<string, unknown>): DeliveryRecord {
  return {
    id: row.id as string,
    deliveryNumber: (row.delivery_number as string) || '',
    allocationId: (row.allocation_id as string) || '',
    allocationNumber: '',
    contractId: (row.contract_id as string) || '',
    contractNumber: (row.contract_number as string) || '',
    customerId: '',
    customerName: (row.customer_name as string) || '',
    companyName: (row.company_name as string) || '',
    modelId: '',
    modelName: (row.model_name as string) || '',
    unitId: '',
    unitCode: (row.unit_code as string) || '',
    projectName: (row.project_name as string) || '',
    location: (row.location as string) || '',
    rentalStart: (row.rental_start as string) || '',
    rentalEnd: (row.rental_end as string) || '',
    operator: (row.operator as string) || '',
    transportation: (row.transportation as string) || '',
    diesel: (row.diesel as string) || '',
    deliveryDate: (row.delivery_date as string) || '',
    deliveryTime: (row.delivery_time as string) || '',
    driverContact: (row.driver_contact as string) || '',
    siteContactName: (row.site_contact_name as string) || '',
    siteContactMobile: (row.site_contact_mobile as string) || '',
    deliveryNotes: (row.delivery_notes as string) || '',
    condition: (row.condition as DeliveryCondition) || { generalCondition: 'good', visibleDamage: false, damageDescription: '', tiresTracks: 'good', engineOperating: 'good', attachments: 'good', fuelLevel: 'half', hourMeter: '', notes: '', photos: [] },
    acknowledgment: (row.acknowledgment as DeliveryAcknowledgment) || null,
    status: (row.status as DeliveryStatus) || 'scheduled',
    deliveryPhotos: (row.delivery_photos as string[]) || [],
    signedAcknowledgmentDoc: '',
    internalDocuments: (row.internal_documents as string[]) || [],
    returnRecord: null,
    createdAt: (row.created_at as string) || '',
    createdBy: (row.created_by as string) || '',
  };
}

function mapReturn(row: Record<string, unknown>): ReturnRecord {
  return {
    id: row.id as string,
    returnNumber: (row.return_number as string) || '',
    returnDate: (row.return_date as string) || '',
    returnTime: (row.return_time as string) || '',
    receivedBy: (row.received_by as string) || '',
    condition: (row.condition as ReturnRecord['condition']) || { generalCondition: 'good', visibleDamage: false, damageDescription: '', tiresTracks: 'good', engineOperating: 'good', attachments: 'good', fuelLevel: 'half', hourMeter: '', notes: '', photos: [] },
    damageIssues: (row.damage_issues as string) || '',
    notes: (row.notes as string) || '',
    photos: (row.photos as string[]) || [],
    status: (row.status as ReturnStatus) || 'received',
    newDamage: Boolean(row.new_damage),
    missingItems: Boolean(row.missing_items),
    conditionChanged: Boolean(row.condition_changed),
    reviewNotes: (row.review_notes as string) || '',
    maintenanceRequired: Boolean(row.maintenance_required),
    maintenanceNotes: (row.maintenance_notes as string) || '',
    createdAt: (row.created_at as string) || '',
  };
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      const mapped = (data || []).map(mapDelivery);
      // Load returns for each delivery
      const { data: returnsData, error: returnsError } = await supabase
        .from('delivery_returns')
        .select('*, delivery_id')
        .order('created_at', { ascending: false });
      if (returnsError) throw returnsError;
      const returnsByDelivery = new Map<string, ReturnRecord>();
      for (const r of (returnsData || [])) {
        const mapped_r = mapReturn(r);
        returnsByDelivery.set(r.delivery_id as string, mapped_r);
      }
      setDeliveries(mapped.map((d) => ({ ...d, returnRecord: returnsByDelivery.get(d.id) || null })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addDelivery = async (d: DeliveryRecord) => {
    const { error: e } = await supabase.from('deliveries').insert({
      allocation_id: d.allocationId || null,
      rental_operation_id: null,
      contract_id: d.contractId || null,
      contract_number: d.contractNumber,
      customer_name: d.customerName,
      company_name: d.companyName,
      model_name: d.modelName,
      unit_code: d.unitCode,
      project_name: d.projectName,
      location: d.location,
      rental_start: d.rentalStart || null,
      rental_end: d.rentalEnd || null,
      operator: d.operator,
      transportation: d.transportation,
      diesel: d.diesel,
      delivery_date: d.deliveryDate || null,
      delivery_time: d.deliveryTime,
      driver_contact: d.driverContact,
      site_contact_name: d.siteContactName,
      site_contact_mobile: d.siteContactMobile,
      delivery_notes: d.deliveryNotes,
      condition: d.condition,
      acknowledgment: d.acknowledgment,
      status: d.status,
      delivery_photos: d.deliveryPhotos,
      internal_documents: d.internalDocuments,
    });
    if (e) throw e;
    await reload();
  };

  const updateDelivery = async (d: DeliveryRecord) => {
    const { error: e } = await supabase.from('deliveries').update({
      delivery_date: d.deliveryDate || null,
      delivery_time: d.deliveryTime,
      driver_contact: d.driverContact,
      site_contact_name: d.siteContactName,
      site_contact_mobile: d.siteContactMobile,
      delivery_notes: d.deliveryNotes,
      condition: d.condition,
      acknowledgment: d.acknowledgment,
      status: d.status,
      delivery_photos: d.deliveryPhotos,
      internal_documents: d.internalDocuments,
    }).eq('id', d.id);
    if (e) throw e;
    await reload();
  };

  const setDeliveryStatus = async (id: string, status: DeliveryStatus) => {
    const { error: e } = await supabase.from('deliveries').update({ status }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const setDeliveryCondition = async (id: string, condition: DeliveryCondition) => {
    const { error: e } = await supabase.from('deliveries').update({ condition }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const setAcknowledgment = async (id: string, acknowledgment: DeliveryAcknowledgment) => {
    const { error: e } = await supabase.from('deliveries').update({ acknowledgment }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const createReturn = async (deliveryId: string, ret: ReturnRecord) => {
    const { error: e } = await supabase.from('delivery_returns').insert({
      delivery_id: deliveryId,
      return_date: ret.returnDate || null,
      return_time: ret.returnTime,
      received_by: ret.receivedBy,
      condition: ret.condition,
      damage_issues: ret.damageIssues,
      notes: ret.notes,
      photos: ret.photos,
      status: ret.status,
      new_damage: ret.newDamage,
      missing_items: ret.missingItems,
      condition_changed: ret.conditionChanged,
      review_notes: ret.reviewNotes,
      maintenance_required: ret.maintenanceRequired,
      maintenance_notes: ret.maintenanceNotes,
    });
    if (e) throw e;
    await reload();
  };

  const updateReturn = async (deliveryId: string, ret: ReturnRecord) => {
    const { error: e } = await supabase.from('delivery_returns').update({
      return_date: ret.returnDate || null,
      return_time: ret.returnTime,
      received_by: ret.receivedBy,
      condition: ret.condition,
      damage_issues: ret.damageIssues,
      notes: ret.notes,
      photos: ret.photos,
      status: ret.status,
      new_damage: ret.newDamage,
      missing_items: ret.missingItems,
      condition_changed: ret.conditionChanged,
      review_notes: ret.reviewNotes,
      maintenance_required: ret.maintenanceRequired,
      maintenance_notes: ret.maintenanceNotes,
    }).eq('delivery_id', deliveryId);
    if (e) throw e;
    await reload();
  };

  const setReturnStatus = async (deliveryId: string, status: ReturnStatus) => {
    const { error: e } = await supabase.from('delivery_returns').update({ status }).eq('delivery_id', deliveryId);
    if (e) throw e;
    await reload();
  };

  const getDelivery = (id: string) => deliveries.find((d) => d.id === id);
  const deliveriesByCustomer = (customerId: string) => deliveries.filter((d) => d.customerId === customerId || d.customerName === customerId);
  const deliveriesByAllocation = (allocationId: string) => deliveries.filter((d) => d.allocationId === allocationId);
  const hasDeliveryForAllocation = (allocationId: string) => deliveries.some((d) => d.allocationId === allocationId && d.status !== 'cancelled');

  return (
    <DeliveryContext.Provider value={{
      deliveries, loading, error, reload,
      addDelivery, updateDelivery, setDeliveryStatus, setDeliveryCondition, setAcknowledgment,
      createReturn, updateReturn, setReturnStatus,
      getDelivery, deliveriesByCustomer, deliveriesByAllocation, hasDeliveryForAllocation,
    }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery must be used within DeliveryProvider');
  return ctx;
}
