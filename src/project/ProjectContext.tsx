import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { submitPublicRequest } from '@/lib/publicRequests';
import type { ProjectRequestRow, ProjectRequestDBStatus, ProjectRequest, ProjectRequestDraft, ProjectRequestStatus } from './types';
import { generateProjectRequestNumber } from './types';

interface SubmitProjectRequestData {
  customer_name: string;
  company_name?: string;
  phone: string;
  email?: string;
  service_category: string;
  service_type: string;
  project_description: string;
  city: string;
  district?: string;
  project_type?: string;
  estimated_budget?: string;
  expected_start?: string;
}

interface ProjectContextValue {
  // DB-backed
  dbRequests: ProjectRequestRow[];
  dbLoading: boolean;
  dbError: string | null;
  submitDBRequest: (data: SubmitProjectRequestData) => Promise<ProjectRequestRow | null>;
  updateDBStatus: (id: string, status: ProjectRequestDBStatus) => Promise<void>;
  updateDBInternalNotes: (id: string, notes: string) => Promise<void>;
  updateDBAssignedTo: (id: string, assignedTo: string | null) => Promise<void>;
  dbReload: () => Promise<void>;
  // Legacy in-memory (for customer portal compatibility)
  projectRequests: ProjectRequest[];
  submitProjectRequest: (draft: ProjectRequestDraft, customerId: string, customerName: string) => ProjectRequest;
  updateProjectRequest: (id: string, updates: Partial<ProjectRequest>) => void;
  changeStatus: (id: string, status: ProjectRequestStatus) => void;
  setInternalNotes: (id: string, notes: string) => void;
  setQuotationPrepNotes: (id: string, notes: string) => void;
  projectRequestsByCustomer: (customerId: string) => ProjectRequest[];
  getProjectRequest: (id: string) => ProjectRequest | undefined;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [dbRequests, setDbRequests] = useState<ProjectRequestRow[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Legacy in-memory state
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);

  const dbReload = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setDbRequests((data as ProjectRequestRow[] | null) || []);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed to load project requests');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    dbReload();
  }, []);

  const submitDBRequest = async (data: SubmitProjectRequestData): Promise<ProjectRequestRow | null> => {
    const inserted = await submitPublicRequest('project_requests', {
        customer_name: data.customer_name,
        company_name: data.company_name || null,
        phone: data.phone,
        email: data.email || null,
        service_category: data.service_category,
        service_type: data.service_type,
        project_description: data.project_description,
        city: data.city,
        district: data.district || null,
        project_type: data.project_type || null,
        estimated_budget: data.estimated_budget || null,
        expected_start: data.expected_start || null,
        status: 'new',
    });
    dbReload().catch(() => {});
    return inserted as unknown as ProjectRequestRow;
  };

  const updateDBStatus = async (id: string, status: ProjectRequestDBStatus) => {
    const { error: updateError } = await supabase
      .from('project_requests')
      .update({ status })
      .eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const updateDBInternalNotes = async (id: string, notes: string) => {
    const { error: updateError } = await supabase
      .from('project_requests')
      .update({ internal_notes: notes })
      .eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  const updateDBAssignedTo = async (id: string, assignedTo: string | null) => {
    const { error: updateError } = await supabase
      .from('project_requests')
      .update({ assigned_to: assignedTo })
      .eq('id', id);
    if (updateError) throw updateError;
    await dbReload();
  };

  // Legacy methods
  const submitProjectRequest = (draft: ProjectRequestDraft, customerId: string, customerName: string): ProjectRequest => {
    const today = new Date().toISOString().split('T')[0];
    const req: ProjectRequest = {
      id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestNumber: generateProjectRequestNumber(projectRequests.length),
      customerId, customerName,
      company: draft.company,
      projectName: draft.projectName,
      serviceType: draft.serviceType,
      projectType: draft.projectType,
      region: draft.region, city: draft.city,
      projectLocation: draft.projectLocation,
      expectedStartDate: draft.expectedStartDate,
      expectedDuration: draft.expectedDuration,
      projectScope: draft.projectScope,
      description: draft.description,
      requirements: draft.requirements,
      estimatedBudget: draft.estimatedBudget,
      additionalNotes: draft.additionalNotes,
      attachments: draft.attachments,
      status: 'new',
      internalNotes: '',
      quotationPrepNotes: '',
      createdAt: today,
    };
    setProjectRequests((prev) => [...prev, req]);
    return req;
  };

  const updateProjectRequest = (id: string, updates: Partial<ProjectRequest>) =>
    setProjectRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

  const changeStatus = (id: string, status: ProjectRequestStatus) =>
    setProjectRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const setInternalNotes = (id: string, notes: string) =>
    setProjectRequests((prev) => prev.map((r) => (r.id === id ? { ...r, internalNotes: notes } : r)));

  const setQuotationPrepNotes = (id: string, notes: string) =>
    setProjectRequests((prev) => prev.map((r) => (r.id === id ? { ...r, quotationPrepNotes: notes } : r)));

  const projectRequestsByCustomer = (customerId: string) =>
    projectRequests.filter((r) => r.customerId === customerId);

  const getProjectRequest = (id: string) => projectRequests.find((r) => r.id === id);

  return (
    <ProjectContext.Provider
      value={{
        dbRequests, dbLoading, dbError, submitDBRequest, updateDBStatus, updateDBInternalNotes, updateDBAssignedTo, dbReload,
        projectRequests, submitProjectRequest, updateProjectRequest, changeStatus, setInternalNotes, setQuotationPrepNotes, projectRequestsByCustomer, getProjectRequest,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
