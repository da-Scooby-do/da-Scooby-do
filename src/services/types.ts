export type ServiceCategoryId = 'contracting' | 'engineering' | 'project-management';

export interface ServiceItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  displayOrder: number;
}

export interface ServiceCategory {
  id: ServiceCategoryId;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  displayOrder: number;
  services: ServiceItem[];
}

export type ProjectRequestStatus =
  | 'new'
  | 'under_review'
  | 'contacted'
  | 'quotation_preparing'
  | 'quotation_sent'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type ProjectTypeOption =
  | 'commercial'
  | 'residential'
  | 'industrial'
  | 'government'
  | 'infrastructure'
  | 'other';

export type ExpectedStartOption =
  | 'within_1_month'
  | 'within_3_months'
  | 'within_6_months'
  | 'within_12_months'
  | 'over_1_year'
  | 'unspecified';

export interface ProjectRequestAttachment {
  fileName: string;
  fileType: string;
  fileSize: string;
}

export interface ProjectRequestDraft {
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  serviceCategory: ServiceCategoryId;
  serviceType: string;
  projectDescription: string;
  city: string;
  district: string;
  projectType: ProjectTypeOption | '';
  estimatedBudget: string;
  expectedStart: ExpectedStartOption | '';
  attachments: ProjectRequestAttachment[];
}

export interface ProjectRequestRecord {
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
  status: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
  request_type: string;
  project_name: string | null;
  scope_of_work: string | null;
  expected_start_date: string | null;
  expected_duration: string | null;
  preferred_visit_date: string | null;
  notes: string | null;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'contracting',
    nameAr: 'المقاولات والإنشاءات',
    nameEn: 'Contracting & Construction',
    shortDescriptionAr: 'حلول متكاملة لتنفيذ مشاريع الإنشاء والتطوير بمختلف مراحلها.',
    shortDescriptionEn: 'Integrated solutions for executing construction and development projects across all phases.',
    descriptionAr: 'نقدم خدمات مقاولات شاملة تغطي مراحل التنفيذ من الأساسات حتى التسليم، بمختلف أنواع المشاريع وأحجامها.',
    descriptionEn: 'We provide comprehensive contracting services covering execution phases from foundation to handover, across project types and sizes.',
    icon: 'Building2',
    displayOrder: 1,
    services: [
      { id: 'general-contracting', nameAr: 'المقاولات العامة والإنشاءات', nameEn: 'General Contracting & Construction', descriptionAr: 'تنفيذ مشاريع الإنشاء من الأساسات حتى التسليم وفق المعايير والجداول الزمنية المعتمدة.', descriptionEn: 'Executing construction projects from foundations to handover according to approved standards and timelines.', displayOrder: 1 },
      { id: 'renovation-restoration', nameAr: 'الترميم والتجديد', nameEn: 'Renovation & Restoration', descriptionAr: 'أعمال الترميم وتجديد المباني القائمة وإصلاح الهياكل وإعادة الحياة للمنشآت.', descriptionEn: 'Renovation and restoration of existing buildings, structural repairs, and bringing structures back to life.', displayOrder: 2 },
      { id: 'finishing-works', nameAr: 'التشطيبات', nameEn: 'Finishing Works', descriptionAr: 'أعمال التشطيبات الداخلية والخارجية بمستوى جودة عالٍ يشمل الدهانات والأرضيات والواجهات.', descriptionEn: 'Interior and exterior finishing works at a high quality level including painting, flooring, and facades.', displayOrder: 3 },
      { id: 'infrastructure', nameAr: 'أعمال البنية التحتية', nameEn: 'Infrastructure Works', descriptionAr: 'تنفيذ أعمال البنية التحتية يشمل الطرق والشبكات وأعمال الصرف والموقع العام.', descriptionEn: 'Executing infrastructure works including roads, networks, drainage, and general site works.', displayOrder: 4 },
    ],
  },
  {
    id: 'engineering',
    nameAr: 'الخدمات الهندسية',
    nameEn: 'Engineering Services',
    shortDescriptionAr: 'خدمات هندسية متخصصة لدعم التصميم والتخطيط والتنفيذ.',
    shortDescriptionEn: 'Specialized engineering services supporting design, planning, and execution.',
    descriptionAr: 'نقدم خدمات هندسية متخصصة تغطي التصميم والتخطيط والدراسات والإشراف على التنفيذ.',
    descriptionEn: 'We provide specialized engineering services covering design, planning, studies, and execution supervision.',
    icon: 'PencilRuler',
    displayOrder: 2,
    services: [
      { id: 'architectural-design', nameAr: 'التصميم المعماري', nameEn: 'Architectural Design', descriptionAr: 'تصميم معماري يجمع بين الجمال والوظيفة، يناسب متطلبات المشروع والاستخدام.', descriptionEn: 'Architectural design combining aesthetics and functionality, tailored to project and usage requirements.', displayOrder: 1 },
      { id: 'engineering-design', nameAr: 'التصميم الهندسي', nameEn: 'Engineering Design', descriptionAr: 'تصميم الأنظمة الإنشائية والكهروميكانيكية وفق المعايير الفنية المعتمدة.', descriptionEn: 'Design of structural and electromechanical systems according to approved technical standards.', displayOrder: 2 },
      { id: 'drawings-plans', nameAr: 'المخططات والرسومات', nameEn: 'Drawings & Plans', descriptionAr: 'إعداد المخططات والرسومات الفنية التنفيذية والتفصيلية للمشروع.', descriptionEn: 'Preparing technical execution and detailed drawings and plans for the project.', displayOrder: 3 },
      { id: 'studies-quantity-surveying', nameAr: 'الدراسات وحصر الكميات', nameEn: 'Studies & Quantity Surveying', descriptionAr: 'إجراء الدراسات الفنية وحصر الكميات والتكاليف بدقة لدعم اتخاذ القرار.', descriptionEn: 'Conducting technical studies, quantity takeoffs, and cost estimation to support decision-making.', displayOrder: 4 },
      { id: 'consulting-supervision', nameAr: 'الاستشارات والإشراف الهندسي', nameEn: 'Consulting & Engineering Supervision', descriptionAr: 'تقديم الاستشارات الهندسية والإشراف على التنفيذ لضمان الالتزام بالمواصفات.', descriptionEn: 'Providing engineering consulting and execution supervision to ensure compliance with specifications.', displayOrder: 5 },
    ],
  },
  {
    id: 'project-management',
    nameAr: 'إدارة المشاريع',
    nameEn: 'Project Management',
    shortDescriptionAr: 'إدارة ومتابعة المشاريع لضمان تنظيم مراحل التنفيذ ومتابعة الأعمال.',
    shortDescriptionEn: 'Managing and tracking projects to ensure organized execution phases and work monitoring.',
    descriptionAr: 'نقدم خدمات إدارة ومتابعة المشاريع لضمان تنظيم مراحل التنفيذ والالتزام بالجداول والميزانية.',
    descriptionEn: 'We provide project management and tracking services to ensure organized execution and adherence to schedules and budget.',
    icon: 'ClipboardList',
    displayOrder: 3,
    services: [
      { id: 'project-management', nameAr: 'إدارة المشروع', nameEn: 'Project Management', descriptionAr: 'إدارة شاملة للمشروع تشمل التخطيط والتنظيم والتنسيق بين جميع الأطراف.', descriptionEn: 'Comprehensive project management including planning, organizing, and coordination across all parties.', displayOrder: 1 },
      { id: 'planning-tracking', nameAr: 'التخطيط والمتابعة', nameEn: 'Planning & Tracking', descriptionAr: 'وضع خطط التنفيذ ومتابعة التقدم مقابل الجداول الزمنية والميزانية.', descriptionEn: 'Setting execution plans and tracking progress against timelines and budget.', displayOrder: 2 },
      { id: 'execution-supervision', nameAr: 'الإشراف على التنفيذ', nameEn: 'Execution Supervision', descriptionAr: 'الإشراف الميداني على التنفيذ لضمان جودة العمل والالتزام بالمواصفات.', descriptionEn: 'Field supervision of execution to ensure work quality and compliance with specifications.', displayOrder: 3 },
    ],
  },
];

export const allServiceTypesList: { id: string; categoryId: ServiceCategoryId; nameAr: string; nameEn: string }[] = [
  ...serviceCategories.flatMap((cat) => cat.services.map((s) => ({ id: s.id, categoryId: cat.id, nameAr: s.nameAr, nameEn: s.nameEn }))),
  { id: 'other', categoryId: 'contracting' as ServiceCategoryId, nameAr: 'أخرى', nameEn: 'Other' },
];

export const serviceCategoryLabels: Record<ServiceCategoryId, { ar: string; en: string }> = {
  contracting: { ar: 'المقاولات والإنشاءات', en: 'Contracting & Construction' },
  engineering: { ar: 'الخدمات الهندسية', en: 'Engineering Services' },
  'project-management': { ar: 'إدارة المشاريع', en: 'Project Management' },
};

export const projectTypeLabels: Record<ProjectTypeOption, { ar: string; en: string }> = {
  commercial: { ar: 'تجاري', en: 'Commercial' },
  residential: { ar: 'سكني', en: 'Residential' },
  industrial: { ar: 'صناعي', en: 'Industrial' },
  government: { ar: 'حكومي', en: 'Government' },
  infrastructure: { ar: 'بنية تحتية', en: 'Infrastructure' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const expectedStartLabels: Record<ExpectedStartOption, { ar: string; en: string }> = {
  within_1_month: { ar: 'خلال شهر', en: 'Within 1 month' },
  within_3_months: { ar: 'خلال 1–3 أشهر', en: 'Within 1–3 months' },
  within_6_months: { ar: 'خلال 3–6 أشهر', en: 'Within 3–6 months' },
  within_12_months: { ar: 'خلال 6–12 شهرًا', en: 'Within 6–12 months' },
  over_1_year: { ar: 'أكثر من سنة', en: 'Over 1 year' },
  unspecified: { ar: 'غير محدد', en: 'Unspecified' },
};

export const statusLabels: Record<ProjectRequestStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  quotation_preparing: { ar: 'إعداد العرض', en: 'Quotation Preparing' },
  quotation_sent: { ar: 'تم إرسال العرض', en: 'Quotation Sent' },
  approved: { ar: 'معتمد', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
};

export const statusColors: Record<ProjectRequestStatus, string> = {
  new: 'bg-yellow-accent/10 text-yellow-accent',
  under_review: 'bg-blue-500/10 text-blue-500',
  contacted: 'bg-cyan-500/10 text-cyan-500',
  quotation_preparing: 'bg-orange-500/10 text-orange-500',
  quotation_sent: 'bg-teal-500/10 text-teal-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  completed: 'bg-green-600/10 text-green-600',
  cancelled: 'bg-red-600/10 text-red-600',
};

export const allProjectStatuses: ProjectRequestStatus[] = [
  'new', 'under_review', 'contacted', 'quotation_preparing',
  'quotation_sent', 'approved', 'rejected', 'completed', 'cancelled',
];

export const allProjectTypes: ProjectTypeOption[] = [
  'commercial', 'residential', 'industrial', 'government', 'infrastructure', 'other',
];

export const allExpectedStartOptions: ExpectedStartOption[] = [
  'within_1_month', 'within_3_months', 'within_6_months', 'within_12_months', 'over_1_year', 'unspecified',
];

export function getServiceCategoryById(id: ServiceCategoryId): ServiceCategory | undefined {
  return serviceCategories.find((c) => c.id === id);
}

export function getServiceTypeName(id: string, lang: 'ar' | 'en'): string {
  if (id === 'other') return lang === 'ar' ? 'أخرى' : 'Other';
  for (const cat of serviceCategories) {
    const svc = cat.services.find((s) => s.id === id);
    if (svc) return lang === 'ar' ? svc.nameAr : svc.nameEn;
  }
  return id;
}

export function getCategoryForService(serviceId: string): ServiceCategoryId | null {
  if (serviceId === 'other') return null;
  for (const cat of serviceCategories) {
    if (cat.services.find((s) => s.id === serviceId)) return cat.id;
  }
  return null;
}
