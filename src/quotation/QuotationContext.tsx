import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { QuotationRow, QuotationItemDB, QuotationWithItems, QuotationDBStatus, QuotationHistoryRow, Quotation, QuotationDraft, QuotationStatus } from './types';
import { generateQuotationNumber, computeQuotationTotals, computeItemTotal } from './types';

// ─── DB submission payload ─────────────────────────────────
export interface CreateQuotationPayload {
  request_type: 'rental' | 'project';
  request_id: string;
  request_reference: string;
  customer_name: string;
  company_name?: string;
  customer_phone: string;
  customer_email?: string;
  vat_rate?: number;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  discount_amount?: number;
  terms?: Record<string, string>;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount?: number;
    tax_rate?: number;
    sort_order?: number;
  }>;
}

interface QuotationContextValue {
  // DB-backed
  dbQuotations: QuotationRow[];
  dbLoading: boolean;
  dbError: string | null;
  dbReload: () => Promise<void>;
  createDBQuotation: (payload: CreateQuotationPayload) => Promise<QuotationWithItems | null>;
  updateDBQuotation: (id: string, updates: Partial<QuotationRow>, items?: Array<Partial<QuotationItemDB> & { description: string; quantity: number; unit: string; unit_price: number; discount?: number; tax_rate?: number; sort_order?: number }>) => Promise<void>;
  updateDBQuotationStatus: (id: string, status: QuotationDBStatus, rejectReason?: string) => Promise<void>;
  deleteDBQuotation: (id: string) => Promise<void>;
  reviseDBQuotation: (id: string) => Promise<QuotationWithItems | null>;
  getDBQuotation: (id: string) => Promise<QuotationWithItems | null>;
  getDBQuotationHistory: (id: string) => Promise<QuotationHistoryRow[]>;
  // Legacy in-memory (for customer portal compatibility)
  quotations: Quotation[];
  createQuotation: (draft: QuotationDraft) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  sendQuotation: (id: string) => void;
  cancelQuotation: (id: string) => void;
  markViewed: (id: string) => void;
  acceptQuotation: (id: string, acceptedBy: string) => void;
  rejectQuotation: (id: string, reason: string) => void;
  quotationsByCustomer: (customerId: string) => Quotation[];
  getQuotation: (id: string) => Quotation | undefined;
  quotationsByRequest: (requestId: string) => Quotation[];
}

const QuotationContext = createContext<QuotationContextValue | undefined>(undefined);

export function QuotationProvider({ children }: { children: ReactNode }) {
  const [dbQuotations, setDbQuotations] = useState<QuotationRow[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Legacy in-memory state
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const dbReload = useCallback(async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setDbQuotations((data as QuotationRow[] | null) || []);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed to load quotations');
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    dbReload();
  }, [dbReload]);

  const createDBQuotation = async (payload: CreateQuotationPayload): Promise<QuotationWithItems | null> => {
    const vatRate = payload.vat_rate ?? 15;
    const itemsWithTotals = payload.items.map((it, idx) => ({
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      discount: it.discount || 0,
      tax_rate: it.tax_rate || 0,
      total: computeItemTotal(it.quantity, it.unit_price, it.discount || 0, it.tax_rate || 0),
      sort_order: it.sort_order ?? idx,
    }));

    const totals = computeQuotationTotals(
      itemsWithTotals.map((it) => ({ ...it, id: '', quotation_id: '' }) as QuotationItemDB),
      payload.discount_amount || 0,
      vatRate,
    );

    const { data: qData, error: qError } = await supabase
      .from('quotations')
      .insert({
        request_type: payload.request_type,
        request_id: payload.request_id,
        request_reference: payload.request_reference,
        customer_name: payload.customer_name,
        company_name: payload.company_name || null,
        customer_phone: payload.customer_phone,
        customer_email: payload.customer_email || null,
        status: 'draft',
        currency: 'SAR',
        vat_rate: vatRate,
        issue_date: payload.issue_date || new Date().toISOString().split('T')[0],
        expiry_date: payload.expiry_date || null,
        notes: payload.notes || null,
        subtotal: totals.subtotal,
        discount_amount: payload.discount_amount || 0,
        tax_amount: totals.taxAmount,
        total: totals.total,
        terms: payload.terms || {},
      })
      .select()
      .single();

    if (qError) throw qError;
    const newQuotation = qData as QuotationRow;

    const itemsToInsert = itemsWithTotals.map((it) => ({ ...it, quotation_id: newQuotation.id }));
    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    await dbReload();
    return { ...newQuotation, items: itemsToInsert.map((it, idx) => ({ ...it, id: `tmp-${idx}`, quotation_id: newQuotation.id })) };
  };

  const updateDBQuotation = async (
    id: string,
    updates: Partial<QuotationRow>,
    items?: Array<{ description: string; quantity: number; unit: string; unit_price: number; discount?: number; tax_rate?: number; sort_order?: number }>,
  ) => {
    if (items) {
      const itemsWithTotals = items.map((it, idx) => ({
        quotation_id: id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount || 0,
        tax_rate: it.tax_rate || 0,
        total: computeItemTotal(it.quantity, it.unit_price, it.discount || 0, it.tax_rate || 0),
        sort_order: it.sort_order ?? idx,
      }));

      const vatRate = updates.vat_rate ?? 15;
      const discountAmount = updates.discount_amount ?? 0;
      const totals = computeQuotationTotals(
        itemsWithTotals.map((it) => ({ ...it, id: '', quotation_id: '' }) as QuotationItemDB),
        discountAmount,
        vatRate,
      );

      updates.subtotal = totals.subtotal;
      updates.tax_amount = totals.taxAmount;
      updates.total = totals.total;

      // Replace all items: delete old, insert new
      await supabase.from('quotation_items').delete().eq('quotation_id', id);
      const { error: itemsError } = await supabase.from('quotation_items').insert(itemsWithTotals);
      if (itemsError) throw itemsError;
    }

    const { error: updateError } = await supabase.from('quotations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const updateDBQuotationStatus = async (id: string, status: QuotationDBStatus, rejectReason?: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'accepted') updates.accepted_at = new Date().toISOString();
    if (status === 'rejected') {
      updates.rejected_at = new Date().toISOString();
      updates.reject_reason = rejectReason || null;
    }

    const { error: updateError } = await supabase.from('quotations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const deleteDBQuotation = async (id: string) => {
    const { error: deleteError } = await supabase.from('quotations').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await dbReload();
  };

  const reviseDBQuotation = async (id: string): Promise<QuotationWithItems | null> => {
    // Load original quotation with items
    const original = await getDBQuotation(id);
    if (!original) throw new Error('Quotation not found');

    // Create a new quotation as a revision (version+1, parent = original's parent or original)
    const parentId = original.parent_quotation_id || original.id;
    const newVersion = original.version + 1;

    const { data: qData, error: qError } = await supabase
      .from('quotations')
      .insert({
        request_type: original.request_type,
        request_id: original.request_id,
        request_reference: original.request_reference,
        customer_name: original.customer_name,
        company_name: original.company_name,
        customer_phone: original.customer_phone,
        customer_email: original.customer_email,
        status: 'draft',
        currency: original.currency,
        vat_rate: original.vat_rate,
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: original.expiry_date,
        notes: original.notes,
        subtotal: original.subtotal,
        discount_amount: original.discount_amount,
        tax_amount: original.tax_amount,
        total: original.total,
        terms: original.terms,
        version: newVersion,
        parent_quotation_id: parentId,
      })
      .select()
      .single();

    if (qError) throw qError;
    const newQ = qData as QuotationRow;

    // Copy items
    const itemsToInsert = original.items.map((it) => ({
      quotation_id: newQ.id,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      discount: it.discount,
      tax_rate: it.tax_rate,
      total: it.total,
      sort_order: it.sort_order,
    }));
    const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    await dbReload();
    return { ...newQ, items: itemsToInsert.map((it, idx) => ({ ...it, id: `tmp-${idx}`, quotation_id: newQ.id })) };
  };

  const getDBQuotation = async (id: string): Promise<QuotationWithItems | null> => {
    const { data: qData, error: qError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (qError) throw qError;
    if (!qData) return null;

    const { data: itemsData, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('sort_order', { ascending: true });
    if (itemsError) throw itemsError;

    return { ...(qData as QuotationRow), items: (itemsData as QuotationItemDB[] | null) || [] };
  };

  const getDBQuotationHistory = async (id: string): Promise<QuotationHistoryRow[]> => {
    const { data, error } = await supabase
      .from('quotation_history')
      .select('*')
      .eq('quotation_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as QuotationHistoryRow[] | null) || [];
  };

  // ─── Legacy in-memory methods ────────────────────────────
  const createQuotation = (draft: QuotationDraft): Quotation => {
    const today = new Date().toISOString().split('T')[0];
    const q: Quotation = {
      id: `quo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quotationNumber: generateQuotationNumber(quotations.length),
      requestId: draft.requestId, requestNumber: draft.requestNumber,
      customerId: draft.customerId, customerName: draft.customerName,
      company: draft.company, items: draft.items, pricing: draft.pricing, terms: draft.terms,
      status: 'draft', validUntil: draft.validUntil, createdAt: today,
      sentAt: null, viewedAt: null, acceptedAt: null, acceptedBy: null, rejectedAt: null, rejectReason: null,
    };
    setQuotations((prev) => [...prev, q]);
    return q;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) =>
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));

  const deleteQuotation = (id: string) => setQuotations((prev) => prev.filter((q) => q.id !== id));

  const sendQuotation = (id: string) =>
    setQuotations((prev) => prev.map((q) => q.id === id ? { ...q, status: 'sent' as QuotationStatus, sentAt: new Date().toISOString().split('T')[0] } : q));

  const cancelQuotation = (id: string) =>
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'cancelled' as QuotationStatus } : q)));

  const markViewed = (id: string) =>
    setQuotations((prev) => prev.map((q) => q.id === id && q.status === 'sent' ? { ...q, status: 'viewed' as QuotationStatus, viewedAt: new Date().toISOString().split('T')[0] } : q));

  const acceptQuotation = (id: string, acceptedBy: string) =>
    setQuotations((prev) => prev.map((q) => q.id === id ? { ...q, status: 'accepted' as QuotationStatus, acceptedAt: new Date().toISOString().split('T')[0], acceptedBy } : q));

  const rejectQuotation = (id: string, reason: string) =>
    setQuotations((prev) => prev.map((q) => q.id === id ? { ...q, status: 'rejected' as QuotationStatus, rejectedAt: new Date().toISOString().split('T')[0], rejectReason: reason } : q));

  const quotationsByCustomer = (customerId: string) => quotations.filter((q) => q.customerId === customerId);
  const getQuotation = (id: string) => quotations.find((q) => q.id === id);
  const quotationsByRequest = (requestId: string) => quotations.filter((q) => q.requestId === requestId);

  return (
    <QuotationContext.Provider
      value={{
        dbQuotations, dbLoading, dbError, dbReload,
        createDBQuotation, updateDBQuotation, updateDBQuotationStatus, deleteDBQuotation, reviseDBQuotation, getDBQuotation, getDBQuotationHistory,
        quotations, createQuotation, updateQuotation, deleteQuotation,
        sendQuotation, cancelQuotation, markViewed, acceptQuotation, rejectQuotation,
        quotationsByCustomer, getQuotation, quotationsByRequest,
      }}
    >
      {children}
    </QuotationContext.Provider>
  );
}

export function useQuotation() {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error('useQuotation must be used within QuotationProvider');
  return ctx;
}
