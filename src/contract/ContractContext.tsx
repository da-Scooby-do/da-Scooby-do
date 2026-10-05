import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { CompanyProfile } from '@/customer/types';
import type { Quotation, QuotationPricing, QuotationTerms, QuotationItem } from '@/quotation/types';
import type { ContractRow, ContractDBStatus, ContractHistoryRow, CreateContractPayload, RentalContract, ContractDraft, ContractStatus, ContractTerms, ContractSignature, SignatureStatus } from './types';
import { generateContractNumber, defaultContractTerms } from './types';

interface ContractContextValue {
  // DB-backed
  dbContracts: ContractRow[];
  dbLoading: boolean;
  dbError: string | null;
  dbReload: () => Promise<void>;
  createDBContract: (payload: CreateContractPayload) => Promise<ContractRow | null>;
  updateDBContract: (id: string, updates: Partial<ContractRow>) => Promise<void>;
  updateDBContractStatus: (id: string, status: ContractDBStatus) => Promise<void>;
  deleteDBContract: (id: string) => Promise<void>;
  uploadContractDocument: (id: string, file: File) => Promise<void>;
  getContractDocumentUrl: (path: string) => Promise<string | null>;
  getDBContractHistory: (id: string) => Promise<ContractHistoryRow[]>;
  // Legacy in-memory
  contracts: RentalContract[];
  createContract: (draft: ContractDraft) => RentalContract;
  updateContract: (id: string, updates: Partial<RentalContract>) => void;
  deleteContract: (id: string) => void;
  sendContract: (id: string) => void;
  activateContract: (id: string) => void;
  completeContract: (id: string) => void;
  terminateContract: (id: string, reason: string) => void;
  signContract: (id: string, signature: ContractSignature) => void;
  contractsByCustomer: (customerId: string) => RentalContract[];
  getContract: (id: string) => RentalContract | undefined;
  contractsByQuotation: (quotationId: string) => RentalContract[];
}

const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [dbContracts, setDbContracts] = useState<ContractRow[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Legacy in-memory state
  const [contracts, setContracts] = useState<RentalContract[]>([]);

  const dbReload = useCallback(async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setDbContracts((data as ContractRow[] | null) || []);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => { dbReload(); }, [dbReload]);

  const createDBContract = async (payload: CreateContractPayload): Promise<ContractRow | null> => {
    const { data, error: insertError } = await supabase
      .from('contracts')
      .insert({
        title: payload.title,
        request_type: payload.request_type,
        request_id: payload.request_id,
        request_reference: payload.request_reference || null,
        quotation_id: payload.quotation_id || null,
        quotation_reference: payload.quotation_reference || null,
        purchase_order_id: payload.purchase_order_id || null,
        po_number: payload.po_number || null,
        customer_name: payload.customer_name,
        company_name: payload.company_name || null,
        start_date: payload.start_date || new Date().toISOString().split('T')[0],
        end_date: payload.end_date || null,
        contract_value: payload.contract_value,
        currency: payload.currency || 'SAR',
        notes: payload.notes || null,
        status: 'draft',
      })
      .select()
      .single();
    if (insertError) throw insertError;
    await dbReload();
    return data as ContractRow;
  };

  const updateDBContract = async (id: string, updates: Partial<ContractRow>) => {
    const { error: updateError } = await supabase.from('contracts').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const updateDBContractStatus = async (id: string, status: ContractDBStatus) => {
    const { error: updateError } = await supabase.from('contracts').update({ status }).eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const deleteDBContract = async (id: string) => {
    const { error: deleteError } = await supabase.from('contracts').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await dbReload();
  };

  const uploadContractDocument = async (id: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('contract-documents')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('contracts')
      .update({ document_path: path, document_name: file.name })
      .eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const getContractDocumentUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('contract-documents').createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  const getDBContractHistory = async (id: string): Promise<ContractHistoryRow[]> => {
    const { data, error } = await supabase
      .from('contract_history')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ContractHistoryRow[] | null) || [];
  };

  // ─── Legacy in-memory methods ────────────────────────────
  const createContract = (draft: ContractDraft): RentalContract => {
    const today = new Date().toISOString().split('T')[0];
    const c: RentalContract = {
      id: `cnt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      contractNumber: generateContractNumber(contracts.length),
      quotationId: draft.quotationId, quotationNumber: draft.quotationNumber,
      requestId: draft.requestId, requestNumber: draft.requestNumber,
      customerId: draft.customerId, customerName: draft.customerName,
      company: draft.company, items: draft.items, pricing: draft.pricing,
      quotationTerms: draft.quotationTerms, contractTerms: draft.contractTerms,
      startDate: draft.startDate, duration: draft.duration,
      projectName: draft.projectName, location: draft.location,
      operator: draft.operator, diesel: draft.diesel, transportation: draft.transportation,
      status: 'draft', signatureStatus: 'unsigned', signature: null,
      createdAt: today, sentAt: null, signedAt: null, activatedAt: null,
      completedAt: null, terminatedAt: null, terminationReason: null,
    };
    setContracts((prev) => [...prev, c]);
    return c;
  };

  const updateContract = (id: string, updates: Partial<RentalContract>) =>
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const deleteContract = (id: string) => setContracts((prev) => prev.filter((c) => c.id !== id));

  const sendContract = (id: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'sent' as ContractStatus, sentAt: new Date().toISOString().split('T')[0] } : c));

  const activateContract = (id: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'active' as ContractStatus, activatedAt: new Date().toISOString().split('T')[0] } : c));

  const completeContract = (id: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'completed' as ContractStatus, completedAt: new Date().toISOString().split('T')[0] } : c));

  const terminateContract = (id: string, reason: string) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'terminated' as ContractStatus, terminatedAt: new Date().toISOString().split('T')[0], terminationReason: reason } : c));

  const signContract = (id: string, signature: ContractSignature) =>
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, signature, signatureStatus: 'customer_signed' as SignatureStatus, status: 'signed' as ContractStatus, signedAt: new Date().toISOString().split('T')[0] } : c));

  const contractsByCustomer = (customerId: string) => contracts.filter((c) => c.customerId === customerId);
  const getContract = (id: string) => contracts.find((c) => c.id === id);
  const contractsByQuotation = (quotationId: string) => contracts.filter((c) => c.quotationId === quotationId);

  return (
    <ContractContext.Provider
      value={{
        dbContracts, dbLoading, dbError, dbReload,
        createDBContract, updateDBContract, updateDBContractStatus, deleteDBContract,
        uploadContractDocument, getContractDocumentUrl, getDBContractHistory,
        contracts, createContract, updateContract, deleteContract,
        sendContract, activateContract, completeContract, terminateContract, signContract,
        contractsByCustomer, getContract, contractsByQuotation,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error('useContract must be used within ContractProvider');
  return ctx;
}

// Re-export for backward compatibility
export { defaultContractTerms };
export type { CompanyProfile, Quotation, QuotationPricing, QuotationTerms, QuotationItem };
