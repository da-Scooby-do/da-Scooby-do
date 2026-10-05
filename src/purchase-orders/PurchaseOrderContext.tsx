import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { PurchaseOrderRow, POStatus, POHistoryRow, CreatePOPayload } from './types';

interface PurchaseOrderContextValue {
  purchaseOrders: PurchaseOrderRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createPO: (payload: CreatePOPayload) => Promise<PurchaseOrderRow | null>;
  updatePO: (id: string, updates: Partial<PurchaseOrderRow>) => Promise<void>;
  updatePOStatus: (id: string, status: POStatus, notes?: string) => Promise<void>;
  deletePO: (id: string) => Promise<void>;
  uploadPODocument: (id: string, file: File) => Promise<void>;
  getPOHistory: (id: string) => Promise<POHistoryRow[]>;
  getPODocumentUrl: (path: string) => Promise<string | null>;
}

const PurchaseOrderContext = createContext<PurchaseOrderContextValue | undefined>(undefined);

export function PurchaseOrderProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setPurchaseOrders((data as PurchaseOrderRow[] | null) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const createPO = async (payload: CreatePOPayload): Promise<PurchaseOrderRow | null> => {
    const { data, error: insertError } = await supabase
      .from('purchase_orders')
      .insert({
        request_type: payload.request_type,
        request_id: payload.request_id,
        request_reference: payload.request_reference,
        quotation_id: payload.quotation_id || null,
        quotation_reference: payload.quotation_reference || null,
        customer_name: payload.customer_name,
        company_name: payload.company_name || null,
        po_date: payload.po_date || new Date().toISOString().split('T')[0],
        amount: payload.amount,
        currency: payload.currency || 'SAR',
        notes: payload.notes || null,
        status: 'requested',
      })
      .select()
      .single();
    if (insertError) throw insertError;
    await reload();
    return data as PurchaseOrderRow;
  };

  const updatePO = async (id: string, updates: Partial<PurchaseOrderRow>) => {
    const { error: updateError } = await supabase.from('purchase_orders').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const updatePOStatus = async (id: string, status: POStatus, notes?: string) => {
    const updates: Record<string, unknown> = { status };
    if (notes !== undefined) updates.notes = notes;
    const { error: updateError } = await supabase.from('purchase_orders').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const deletePO = async (id: string) => {
    const { error: deleteError } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await reload();
  };

  const uploadPODocument = async (id: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('po-documents')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ document_path: path, document_name: file.name, status: 'received' })
      .eq('id', id);
    if (updateError) throw updateError;
    await reload();
  };

  const getPODocumentUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('po-documents').createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  const getPOHistory = async (id: string): Promise<POHistoryRow[]> => {
    const { data, error } = await supabase
      .from('po_history')
      .select('*')
      .eq('po_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as POHistoryRow[] | null) || [];
  };

  return (
    <PurchaseOrderContext.Provider
      value={{ purchaseOrders, loading, error, reload, createPO, updatePO, updatePOStatus, deletePO, uploadPODocument, getPODocumentUrl, getPOHistory }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
}

export function usePurchaseOrder() {
  const ctx = useContext(PurchaseOrderContext);
  if (!ctx) throw new Error('usePurchaseOrder must be used within PurchaseOrderProvider');
  return ctx;
}
