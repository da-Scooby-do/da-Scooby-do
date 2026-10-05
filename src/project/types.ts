import type { CompanyProfile } from '@/customer/types';

export type ProjectServiceType =
  | 'contracting_construction'
  | 'renovation_restoration'
  | 'finishing_works'
  | 'architectural_engineering';

export type ProjectType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'infrastructure'
  | 'renovation'
  | 'other';

export type ProjectRequestStatus =
  | 'new'
  | 'reviewing'
  | 'technical_site_evaluation'
  | 'preparing_quote'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ProjectRequestAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
}

export interface ProjectRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  company: CompanyProfile;
  projectName: string;
  serviceType: ProjectServiceType;
  projectType: ProjectType;
  region: string;
  city: string;
  projectLocation: string;
  expectedStartDate: string;
  expectedDuration: string;
  projectScope: string;
  description: string;
  requirements: string;
  estimatedBudget: string;
  additionalNotes: string;
  attachments: ProjectRequestAttachment[];
  status: ProjectRequestStatus;
  internalNotes: string;
  quotationPrepNotes: string;
  createdAt: string;
}

export interface ProjectRequestDraft {
  projectName: string;
  serviceType: ProjectServiceType;
  projectType: ProjectType;
  region: string;
  city: string;
  projectLocation: string;
  expectedStartDate: string;
  expectedDuration: string;
  projectScope: string;
  description: string;
  requirements: string;
  estimatedBudget: string;
  additionalNotes: string;
  attachments: ProjectRequestAttachment[];
  company: CompanyProfile;
}

export function generateProjectRequestNumber(existing: number): string {
  const year = new Date().getFullYear();
  const seq = String(existing + 1).padStart(4, '0');
  return `PRJ-${year}-${seq}`;
}

export function emptyDraft(company: CompanyProfile): ProjectRequestDraft {
  return {
    projectName: '',
    serviceType: 'contracting_construction',
    projectType: 'residential',
    region: '',
    city: '',
    projectLocation: '',
    expectedStartDate: '',
    expectedDuration: '',
    projectScope: '',
    description: '',
    requirements: '',
    estimatedBudget: '',
    additionalNotes: '',
    attachments: [],
    company,
  };
}

export const serviceTypeLabels: Record<ProjectServiceType, { ar: string; en: string }> = {
  contracting_construction: { ar: 'المقاولات والإنشاءات', en: 'Contracting & Construction' },
  renovation_restoration: { ar: 'الترميم والتجديد', en: 'Renovation & Restoration' },
  finishing_works: { ar: 'أعمال التشطيبات', en: 'Finishing Works' },
  architectural_engineering: { ar: 'الخدمات المعمارية والهندسية', en: 'Architectural & Engineering Services' },
};

export const projectTypeLabels: Record<ProjectType, { ar: string; en: string }> = {
  residential: { ar: 'سكني', en: 'Residential' },
  commercial: { ar: 'تجاري', en: 'Commercial' },
  industrial: { ar: 'صناعي', en: 'Industrial' },
  infrastructure: { ar: 'بنية تحتية', en: 'Infrastructure' },
  renovation: { ar: 'ترميم', en: 'Renovation' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const statusLabels: Record<ProjectRequestStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  reviewing: { ar: 'قيد المراجعة', en: 'Reviewing' },
  technical_site_evaluation: { ar: 'التقييم الفني / الموقع', en: 'Technical/Site Evaluation' },
  preparing_quote: { ar: 'إعداد العرض', en: 'Preparing Quote' },
  awaiting_customer_approval: { ar: 'بانتظار موافقة العميل', en: 'Awaiting Customer Approval' },
  approved: { ar: 'معتمد', en: 'Approved' },
  in_progress: { ar: 'قيد التنفيذ', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
};

export const statusColors: Record<ProjectRequestStatus, string> = {
  new: 'bg-yellow-accent/10 text-yellow-accent',
  reviewing: 'bg-blue-500/10 text-blue-500',
  technical_site_evaluation: 'bg-purple-500/10 text-purple-500',
  preparing_quote: 'bg-orange-500/10 text-orange-500',
  awaiting_customer_approval: 'bg-cyan-500/10 text-cyan-500',
  approved: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-teal-500/10 text-teal-500',
  completed: 'bg-green-600/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-500',
};

export const allProjectStatuses: ProjectRequestStatus[] = [
  'new', 'reviewing', 'technical_site_evaluation', 'preparing_quote',
  'awaiting_customer_approval', 'approved', 'in_progress', 'completed', 'cancelled',
];

export const allServiceTypes: ProjectServiceType[] = [
  'contracting_construction', 'renovation_restoration', 'finishing_works', 'architectural_engineering',
];

export const allProjectTypes: ProjectType[] = [
  'residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other',
];

// ─── DB Row Type (matches project_requests table) ───────────
export type ProjectRequestDBStatus =
  | 'new'
  | 'under_review'
  | 'contacted'
  | 'quotation_preparing'
  | 'quotation_sent'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface ProjectRequestRow {
  id: string;
  request_reference: string;
  customer_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  service_category: string;
  service_type: string;
  project_description: string;
  city: string;
  district: string | null;
  project_type: string | null;
  estimated_budget: string | null;
  expected_start: string | null;
  status: ProjectRequestDBStatus;
  internal_notes: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export const dbStatusLabels: Record<ProjectRequestDBStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  quotation_preparing: { ar: 'إعداد عرض السعر', en: 'Preparing Quote' },
  quotation_sent: { ar: 'تم إرسال عرض السعر', en: 'Quote Sent' },
  approved: { ar: 'معتمد', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
};

export const dbStatusColors: Record<ProjectRequestDBStatus, string> = {
  new: 'bg-yellow-accent/10 text-yellow-accent',
  under_review: 'bg-blue-500/10 text-blue-500',
  contacted: 'bg-cyan-500/10 text-cyan-500',
  quotation_preparing: 'bg-orange-500/10 text-orange-500',
  quotation_sent: 'bg-purple-500/10 text-purple-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  completed: 'bg-green-600/10 text-green-600',
  cancelled: 'bg-base-muted/10 text-base-muted',
};

export const allProjectDBStatuses: ProjectRequestDBStatus[] = [
  'new', 'under_review', 'contacted', 'quotation_preparing', 'quotation_sent',
  'approved', 'rejected', 'completed', 'cancelled',
];

export const expectedStartLabels: Record<string, { ar: string; en: string }> = {
  within_1_month: { ar: 'خلال شهر', en: 'Within 1 Month' },
  within_3_months: { ar: 'خلال 3 أشهر', en: 'Within 3 Months' },
  within_6_months: { ar: 'خلال 6 أشهر', en: 'Within 6 Months' },
  within_12_months: { ar: 'خلال سنة', en: 'Within 12 Months' },
  over_1_year: { ar: 'أكثر من سنة', en: 'Over 1 Year' },
  unspecified: { ar: 'غير محدد', en: 'Unspecified' },
};

export const serviceCategoryLabels: Record<string, { ar: string; en: string }> = {
  contracting: { ar: 'المقاولات', en: 'Contracting' },
  engineering: { ar: 'الهندسة', en: 'Engineering' },
  'project-management': { ar: 'إدارة المشاريع', en: 'Project Management' },
};
