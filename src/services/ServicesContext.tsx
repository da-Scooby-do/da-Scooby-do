import { createContext, useContext, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProjectRequestRecord, ProjectRequestDraft, ProjectRequestStatus } from './types';

interface ServiceRequestData {
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  serviceCategory: string;
  serviceType: string;
  requestType: string;
  projectDescription: string;
  projectName: string;
  scopeOfWork: string;
  city: string;
  district: string;
  projectType: string;
  estimatedBudget: string;
  expectedStart: string;
  expectedStartDate: string;
  expectedDuration: string;
  preferredVisitDate: string;
  notes: string;
}

interface ServicesContextValue {
  submitting: boolean;
  submitError: string | null;
  submitServiceRequest: (data: ServiceRequestData) => Promise<{ success: boolean; record?: ProjectRequestRecord; error?: string }>;
  submitRequest: (draft: ProjectRequestDraft) => Promise<{ success: boolean; record?: ProjectRequestRecord; error?: string }>;
  requests: ProjectRequestRecord[];
  loadingRequests: boolean;
  fetchRequests: () => Promise<void>;
  updateStatus: (id: string, status: ProjectRequestStatus) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ProjectRequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const submitServiceRequest: ServicesContextValue['submitServiceRequest'] = async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const insertData: Record<string, string | null> = {
        customer_name: data.customerName,
        company_name: data.companyName || null,
        phone: data.phone,
        email: data.email || null,
        service_category: data.serviceCategory,
        service_type: data.serviceType,
        request_type: data.requestType,
        project_description: data.projectDescription,
        project_name: data.projectName || null,
        scope_of_work: data.scopeOfWork || null,
        city: data.city,
        district: data.district || null,
        project_type: data.projectType || null,
        estimated_budget: data.estimatedBudget || null,
        expected_start: data.expectedStart || null,
        expected_start_date: data.expectedStartDate || null,
        expected_duration: data.expectedDuration || null,
        preferred_visit_date: data.preferredVisitDate || null,
        notes: data.notes || null,
        status: 'new',
      };

      const { data: result, error } = await supabase
        .from('project_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, record: result as ProjectRequestRecord };
    } catch (err) {
      console.error('Service request submission failed', err);
      const msg = 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى. / We could not submit your request. Please try again.';
      setSubmitError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequest: ServicesContextValue['submitRequest'] = async (draft) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const insertData = {
        customer_name: draft.customerName,
        company_name: draft.companyName || null,
        phone: draft.phone,
        email: draft.email || null,
        service_category: draft.serviceCategory,
        service_type: draft.serviceType,
        project_description: draft.projectDescription,
        city: draft.city,
        district: draft.district || null,
        project_type: draft.projectType || null,
        estimated_budget: draft.estimatedBudget || null,
        expected_start: draft.expectedStart || null,
        status: 'new',
      };

      const { data, error } = await supabase
        .from('project_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, record: data as ProjectRequestRecord };
    } catch (err) {
      console.error('Service request submission failed', err);
      const msg = 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى. / We could not submit your request. Please try again.';
      setSubmitError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data as ProjectRequestRecord[]) || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateStatus = async (id: string, status: ProjectRequestStatus) => {
    const { error } = await supabase
      .from('project_requests')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <ServicesContext.Provider
      value={{ submitting, submitError, submitServiceRequest, submitRequest, requests, loadingRequests, fetchRequests, updateStatus }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
