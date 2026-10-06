import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, HardHat, Building2, MapPin, Calendar, Paperclip, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useServices } from '@/services/ServicesContext';
import TermsAcceptanceBadge from './TermsAcceptanceBadge';
import {
  statusLabels, statusColors, serviceCategoryLabels, projectTypeLabels, expectedStartLabels,
  allProjectStatuses, allProjectTypes, allExpectedStartOptions,
  getServiceTypeName,
} from '@/services/types';
import type { ProjectRequestRecord, ProjectRequestStatus } from '@/services/types';

const requestTypeLabels: Record<string, { ar: string; en: string }> = {
  project_execution: { ar: 'تنفيذ مشروع', en: 'Project Execution' },
  contracting: { ar: 'أعمال مقاولة', en: 'Contracting Works' },
  engineering: { ar: 'خدمة هندسية', en: 'Engineering Service' },
  project_management: { ar: 'إدارة مشروع', en: 'Project Management' },
  site_visit: { ar: 'معاينة موقع', en: 'Site Visit' },
};

export default function AdminServiceRequests() {
  const { lang } = useApp();
  const { requests, loadingRequests, fetchRequests, updateStatus } = useServices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<ProjectRequestRecord | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const matchSearch = !search ||
      r.request_reference.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchService = serviceFilter === 'all' || r.service_category === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  const handleStatusChange = async (status: ProjectRequestStatus) => {
    if (!viewing) return;
    try {
      await updateStatus(viewing.id, status);
      setViewing({ ...viewing, status });
    } catch {
      // error handled by context
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <HardHat size={28} className="text-yellow-accent" />
          {ar ? 'طلبات المشاريع' : 'Service Project Requests'}
        </h1>
        <p className="text-base-muted text-sm">
          {loadingRequests ? (ar ? 'جاري التحميل...' : 'Loading...') : (ar ? `${filtered.length} طلب` : `${filtered.length} requests`)}
        </p>
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الطلب أو الاسم أو الشركة...' : 'Search by ref #, name, or company...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <select className={`${inputClass} ps-10`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
              {allProjectStatuses.map((s) => <option key={s} value={s}>{ar ? statusLabels[s].ar : statusLabels[s].en}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <select className={`${inputClass} ps-10`} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="all">{ar ? 'كل الخدمات' : 'All services'}</option>
              <option value="contracting">{ar ? 'المقاولات والإنشاءات' : 'Contracting & Construction'}</option>
              <option value="engineering">{ar ? 'الخدمات الهندسية' : 'Engineering Services'}</option>
              <option value="project-management">{ar ? 'إدارة المشاريع' : 'Project Management'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <HardHat size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات' : 'No requests'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setViewing(r)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{r.request_reference}</span>
                    <span className="text-xs text-base-muted">• {formatDate(r.created_at)}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{r.customer_name}</div>
                  <div className="text-xs text-base-muted">
                    {ar ? serviceCategoryLabels[r.service_category as keyof typeof serviceCategoryLabels]?.ar || r.service_category : serviceCategoryLabels[r.service_category as keyof typeof serviceCategoryLabels]?.en || r.service_category}
                    {' • '}
                    {r.company_name || '—'} • {r.city}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[r.status as ProjectRequestStatus] || 'bg-base text-base-muted'}`}>
                    {ar ? statusLabels[r.status as ProjectRequestStatus]?.ar || r.status : statusLabels[r.status as ProjectRequestStatus]?.en || r.status}
                  </span>
                  <Eye size={16} className="text-base-muted" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-base-primary">{viewing.customer_name}</h3>
                <p className="text-xs text-base-muted">{viewing.request_reference} • {formatDate(viewing.created_at)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status control */}
              <div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'حالة الطلب' : 'Request Status'}</label>
                <select className={inputClass} value={viewing.status} onChange={(e) => handleStatusChange(e.target.value as ProjectRequestStatus)}>
                  {allProjectStatuses.map((s) => <option key={s} value={s}>{ar ? statusLabels[s].ar : statusLabels[s].en}</option>)}
                </select>
              </div>

              {/* Customer */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Building2 size={14} /> {ar ? 'العميل' : 'Customer'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الاسم' : 'Name'}: </span><span className="font-semibold text-base-primary">{viewing.customer_name}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company_name || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الجوال' : 'Phone'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.phone}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البريد' : 'Email'}: </span><span className="font-semibold text-base-primary" dir="ltr">{viewing.email || '—'}</span></div>
                </div>
              </div>

              {/* Service */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><HardHat size={14} /> {ar ? 'الخدمة' : 'Service'}</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'التصنيف' : 'Category'}: </span><span className="font-semibold text-base-primary">{ar ? serviceCategoryLabels[viewing.service_category as keyof typeof serviceCategoryLabels]?.ar || viewing.service_category : serviceCategoryLabels[viewing.service_category as keyof typeof serviceCategoryLabels]?.en || viewing.service_category}</span></div>
                  <div><span className="text-base-muted">{ar ? 'النوع' : 'Type'}: </span><span className="font-semibold text-base-primary">{getServiceTypeName(viewing.service_type, lang)}</span></div>
                  {viewing.request_type && requestTypeLabels[viewing.request_type] && (
                    <div><span className="text-base-muted">{ar ? 'نوع الطلب' : 'Request Type'}: </span><span className="font-semibold text-base-primary">{ar ? requestTypeLabels[viewing.request_type].ar : requestTypeLabels[viewing.request_type].en}</span></div>
                  )}
                </div>
              </div>

              {/* Project */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Paperclip size={14} /> {ar ? 'المشروع' : 'Project'}</h4>
                {viewing.project_name && <div className="text-sm mb-2"><span className="text-base-muted">{ar ? 'اسم المشروع' : 'Project Name'}: </span><span className="font-semibold text-base-primary">{viewing.project_name}</span></div>}
                <div className="text-sm mb-2"><span className="text-base-muted">{ar ? 'الوصف' : 'Description'}: </span><span className="text-base-primary">{viewing.project_description}</span></div>
                {viewing.scope_of_work && <div className="text-sm mb-2"><span className="text-base-muted">{ar ? 'نطاق الأعمال' : 'Scope'}: </span><span className="text-base-primary">{viewing.scope_of_work}</span></div>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'المدينة' : 'City'}: </span><span className="font-semibold text-base-primary">{viewing.city}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الحي' : 'District'}: </span><span className="font-semibold text-base-primary">{viewing.district || '—'}</span></div>
                  {viewing.project_type && <div><span className="text-base-muted">{ar ? 'نوع المشروع' : 'Project Type'}: </span><span className="font-semibold text-base-primary">{ar ? projectTypeLabels[viewing.project_type as keyof typeof projectTypeLabels]?.ar || viewing.project_type : projectTypeLabels[viewing.project_type as keyof typeof projectTypeLabels]?.en || viewing.project_type}</span></div>}
                  {viewing.estimated_budget && <div><span className="text-base-muted">{ar ? 'الميزانية' : 'Budget'}: </span><span className="font-semibold text-base-primary">{viewing.estimated_budget}</span></div>}
                  {viewing.expected_start_date && <div><span className="text-base-muted">{ar ? 'تاريخ البدء' : 'Start Date'}: </span><span className="font-semibold text-base-primary">{viewing.expected_start_date}</span></div>}
                  {viewing.expected_duration && <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{viewing.expected_duration}</span></div>}
                  {viewing.preferred_visit_date && <div><span className="text-base-muted">{ar ? 'تاريخ الزيارة المفضل' : 'Preferred Visit'}: </span><span className="font-semibold text-base-primary">{viewing.preferred_visit_date}</span></div>}
                </div>
                {viewing.notes && <div className="text-sm mt-2"><span className="text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span><span className="text-base-primary">{viewing.notes}</span></div>}
              </div>

              {/* Timeline */}
              {viewing.expected_start && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Calendar size={14} /> {ar ? 'الجدول الزمني' : 'Timeline'}</h4>
                  <div className="text-sm">
                    <span className="text-base-muted">{ar ? 'موعد البدء' : 'Expected Start'}: </span>
                    <span className="font-semibold text-base-primary">{ar ? expectedStartLabels[viewing.expected_start as keyof typeof expectedStartLabels]?.ar || viewing.expected_start : expectedStartLabels[viewing.expected_start as keyof typeof expectedStartLabels]?.en || viewing.expected_start}</span>
                  </div>
                </div>
              )}

              {/* Request meta */}
              <div className="border-t border-base pt-4">
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><FileText size={14} /> {ar ? 'معلومات الطلب' : 'Request Info'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'رقم الطلب' : 'Reference'}: </span><span className="font-bold text-yellow-accent">{viewing.request_reference}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الحالة' : 'Status'}: </span><span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusColors[viewing.status as ProjectRequestStatus] || 'bg-base text-base-muted'}`}>{ar ? statusLabels[viewing.status as ProjectRequestStatus]?.ar || viewing.status : statusLabels[viewing.status as ProjectRequestStatus]?.en || viewing.status}</span></div>
                  <div><span className="text-base-muted">{ar ? 'تاريخ الإنشاء' : 'Created'}: </span><span className="font-semibold text-base-primary">{formatDate(viewing.created_at)}</span></div>
                  <div><span className="text-base-muted">{ar ? 'آخر تحديث' : 'Updated'}: </span><span className="font-semibold text-base-primary">{formatDate(viewing.updated_at)}</span></div>
                </div>
                <div className="mt-3">
                  <TermsAcceptanceBadge accepted={viewing.terms_accepted} acceptedAt={viewing.terms_accepted_at} lang={lang} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
