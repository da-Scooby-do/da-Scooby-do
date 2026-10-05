import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActualEquipmentUnit, EquipmentSource, InspectionRecord, MaintenanceRecord, UnitStatus } from './equipment-unit-types';

interface EquipmentUnitContextValue {
  units: ActualEquipmentUnit[];
  sources: EquipmentSource[];
  inspections: InspectionRecord[];
  maintenanceRecords: MaintenanceRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addUnit: (u: ActualEquipmentUnit) => Promise<void>;
  updateUnit: (u: ActualEquipmentUnit) => Promise<void>;
  archiveUnit: (id: string) => Promise<void>;
  setUnitStatus: (id: string, status: UnitStatus) => Promise<void>;
  addSource: (s: EquipmentSource) => Promise<void>;
  updateSource: (s: EquipmentSource) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  addInspection: (r: InspectionRecord) => Promise<void>;
  updateInspection: (r: InspectionRecord) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  addMaintenance: (r: MaintenanceRecord) => Promise<void>;
  updateMaintenance: (r: MaintenanceRecord) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  inspectionsByUnit: (unitId: string) => InspectionRecord[];
  maintenanceByUnit: (unitId: string) => MaintenanceRecord[];
}

const EquipmentUnitContext = createContext<EquipmentUnitContextValue | undefined>(undefined);

// Map DB row (snake_case) to ActualEquipmentUnit (camelCase)
function mapUnit(row: Record<string, unknown>): ActualEquipmentUnit {
  return {
    id: row.id as string,
    unitId: row.unit_code as string,
    modelId: (row.model_id as string) || '',
    year: (row.year as string) || '',
    serialNumber: (row.serial_number as string) || '',
    condition: (row.condition as ActualEquipmentUnit['condition']) || 'good',
    lastInspectionDate: (row.last_inspection_date as string) || '',
    nextInspectionDate: (row.next_inspection_date as string) || '',
    maintenanceNotes: (row.maintenance_notes as string) || '',
    currentRegion: (row.current_region as string) || '',
    currentCity: (row.current_city as string) || '',
    currentLocation: (row.current_location as string) || '',
    status: (row.status as UnitStatus) || 'available',
    availableFrom: (row.available_from as string) || '',
    currentContractReference: (row.current_contract_reference as string) || '',
    internalNotes: (row.internal_notes as string) || '',
    sourceId: (row.source_id as string) || '',
    images: (row.images as string[]) || [],
    createdAt: (row.created_at as string) || '',
  };
}

function mapSource(row: Record<string, unknown>): EquipmentSource {
  return {
    id: row.id as string,
    type: (row.type as EquipmentSource['type']) || 'sahab_owned',
    name: (row.name as string) || '',
    contactName: (row.contact_name as string) || '',
    contactPhone: (row.contact_phone as string) || '',
    contactEmail: (row.contact_email as string) || '',
    agreementReference: (row.agreement_reference as string) || '',
    internalCost: Number(row.internal_cost) || 0,
    commissionMarginNotes: (row.commission_margin_notes as string) || '',
    createdAt: (row.created_at as string) || '',
  };
}

function mapInspection(row: Record<string, unknown>): InspectionRecord {
  return {
    id: row.id as string,
    unitId: row.unit_id as string,
    inspectionDate: (row.inspection_date as string) || '',
    inspector: (row.inspector as string) || '',
    condition: (row.condition as InspectionRecord['condition']) || 'good',
    notes: (row.notes as string) || '',
    attachments: (row.attachments as string[]) || [],
  };
}

function mapMaintenance(row: Record<string, unknown>): MaintenanceRecord {
  return {
    id: row.id as string,
    unitId: row.unit_id as string,
    maintenanceDate: (row.maintenance_date as string) || '',
    description: (row.description as string) || '',
    status: (row.status as MaintenanceRecord['status']) || 'scheduled',
    notes: (row.notes as string) || '',
  };
}

export function EquipmentUnitProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<ActualEquipmentUnit[]>([]);
  const [sources, setSources] = useState<EquipmentSource[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, sRes, iRes, mRes] = await Promise.all([
        supabase.from('equipment_units').select('*').order('created_at', { ascending: true }),
        supabase.from('equipment_sources').select('*').order('created_at', { ascending: true }),
        supabase.from('equipment_inspections').select('*').order('created_at', { ascending: false }),
        supabase.from('equipment_maintenance').select('*').order('created_at', { ascending: false }),
      ]);
      if (uRes.error) throw uRes.error;
      if (sRes.error) throw sRes.error;
      if (iRes.error) throw iRes.error;
      if (mRes.error) throw mRes.error;
      setUnits((uRes.data || []).map(mapUnit));
      setSources((sRes.data || []).map(mapSource));
      setInspections((iRes.data || []).map(mapInspection));
      setMaintenanceRecords((mRes.data || []).map(mapMaintenance));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addUnit = async (u: ActualEquipmentUnit) => {
    const { error: e } = await supabase.from('equipment_units').insert({
      unit_code: u.unitId,
      model_id: u.modelId || null,
      year: u.year,
      serial_number: u.serialNumber,
      condition: u.condition,
      status: u.status,
      current_region: u.currentRegion,
      current_city: u.currentCity,
      current_location: u.currentLocation,
      available_from: u.availableFrom || null,
      current_contract_reference: u.currentContractReference,
      internal_notes: u.internalNotes,
      source_id: u.sourceId || null,
      last_inspection_date: u.lastInspectionDate || null,
      next_inspection_date: u.nextInspectionDate || null,
      maintenance_notes: u.maintenanceNotes,
      images: u.images,
    });
    if (e) throw e;
    await reload();
  };

  const updateUnit = async (u: ActualEquipmentUnit) => {
    const { error: e } = await supabase.from('equipment_units').update({
      unit_code: u.unitId,
      model_id: u.modelId || null,
      year: u.year,
      serial_number: u.serialNumber,
      condition: u.condition,
      status: u.status,
      current_region: u.currentRegion,
      current_city: u.currentCity,
      current_location: u.currentLocation,
      available_from: u.availableFrom || null,
      current_contract_reference: u.currentContractReference,
      internal_notes: u.internalNotes,
      source_id: u.sourceId || null,
      last_inspection_date: u.lastInspectionDate || null,
      next_inspection_date: u.nextInspectionDate || null,
      maintenance_notes: u.maintenanceNotes,
      images: u.images,
    }).eq('id', u.id);
    if (e) throw e;
    await reload();
  };

  const archiveUnit = async (id: string) => {
    const { error: e } = await supabase.from('equipment_units').update({ status: 'archived' }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const setUnitStatus = async (id: string, status: UnitStatus) => {
    const { error: e } = await supabase.from('equipment_units').update({ status }).eq('id', id);
    if (e) throw e;
    await reload();
  };

  const addSource = async (s: EquipmentSource) => {
    const { error: e } = await supabase.from('equipment_sources').insert({
      type: s.type,
      name: s.name,
      contact_name: s.contactName,
      contact_phone: s.contactPhone,
      contact_email: s.contactEmail,
      agreement_reference: s.agreementReference,
      internal_cost: s.internalCost,
      commission_margin_notes: s.commissionMarginNotes,
    });
    if (e) throw e;
    await reload();
  };

  const updateSource = async (s: EquipmentSource) => {
    const { error: e } = await supabase.from('equipment_sources').update({
      type: s.type,
      name: s.name,
      contact_name: s.contactName,
      contact_phone: s.contactPhone,
      contact_email: s.contactEmail,
      agreement_reference: s.agreementReference,
      internal_cost: s.internalCost,
      commission_margin_notes: s.commissionMarginNotes,
    }).eq('id', s.id);
    if (e) throw e;
    await reload();
  };

  const deleteSource = async (id: string) => {
    const { error: e } = await supabase.from('equipment_sources').delete().eq('id', id);
    if (e) throw e;
    await reload();
  };

  const addInspection = async (r: InspectionRecord) => {
    const { error: e } = await supabase.from('equipment_inspections').insert({
      unit_id: r.unitId,
      inspection_date: r.inspectionDate,
      inspector: r.inspector,
      condition: r.condition,
      notes: r.notes,
      attachments: r.attachments,
    });
    if (e) throw e;
    await reload();
  };

  const updateInspection = async (r: InspectionRecord) => {
    const { error: e } = await supabase.from('equipment_inspections').update({
      inspection_date: r.inspectionDate,
      inspector: r.inspector,
      condition: r.condition,
      notes: r.notes,
      attachments: r.attachments,
    }).eq('id', r.id);
    if (e) throw e;
    await reload();
  };

  const deleteInspection = async (id: string) => {
    const { error: e } = await supabase.from('equipment_inspections').delete().eq('id', id);
    if (e) throw e;
    await reload();
  };

  const addMaintenance = async (r: MaintenanceRecord) => {
    const { error: e } = await supabase.from('equipment_maintenance').insert({
      unit_id: r.unitId,
      maintenance_date: r.maintenanceDate,
      description: r.description,
      status: r.status,
      notes: r.notes,
    });
    if (e) throw e;
    await reload();
  };

  const updateMaintenance = async (r: MaintenanceRecord) => {
    const { error: e } = await supabase.from('equipment_maintenance').update({
      maintenance_date: r.maintenanceDate,
      description: r.description,
      status: r.status,
      notes: r.notes,
    }).eq('id', r.id);
    if (e) throw e;
    await reload();
  };

  const deleteMaintenance = async (id: string) => {
    const { error: e } = await supabase.from('equipment_maintenance').delete().eq('id', id);
    if (e) throw e;
    await reload();
  };

  const inspectionsByUnit = (unitId: string) => inspections.filter((i) => i.unitId === unitId);
  const maintenanceByUnit = (unitId: string) => maintenanceRecords.filter((m) => m.unitId === unitId);

  return (
    <EquipmentUnitContext.Provider value={{
      units, sources, inspections, maintenanceRecords, loading, error, reload,
      addUnit, updateUnit, archiveUnit, setUnitStatus,
      addSource, updateSource, deleteSource,
      addInspection, updateInspection, deleteInspection,
      addMaintenance, updateMaintenance, deleteMaintenance,
      inspectionsByUnit, maintenanceByUnit,
    }}>
      {children}
    </EquipmentUnitContext.Provider>
  );
}

export function useEquipmentUnit() {
  const ctx = useContext(EquipmentUnitContext);
  if (!ctx) throw new Error('useEquipmentUnit must be used within EquipmentUnitProvider');
  return ctx;
}
