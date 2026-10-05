import { useState } from 'react';
import { Search, Filter, Eye, X, HardHat, FileText, StickyNote, Building2, MapPin, Calendar, Paperclip } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useProject } from '@/project/ProjectContext';
import {
  statusLabels, statusColors, serviceTypeLabels, projectTypeLabels,
  allProjectStatuses, allServiceTypes,
} from '@/project/types';
import type { ProjectRequest, ProjectRequestStatus } from '@/project/types';

export default function AdminProjectRequests() {
  const { lang } = useApp();
  const { projectRequests, changeStatus, setInternalNotes, setQuotationPrepNotes } = useProject();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<ProjectRequest | null>(null);
  const [internalNotes, setInternalNotesState] = useState('');
  const [quotationPrepNotes, setQuotationPrepNotesState] = useState('');

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = projectRequests.filter((p) => {
    const matchSearch = !search ||
      p.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.company.companyName.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchService = serviceFilter === 'all' || p.serviceType === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  const handleOpen = (p: ProjectRequest) => {
    setViewing(p);
    setInternalNotesState(p.internalNotes);
    setQuotationPrepNotesState(p.quotationPrepNotes);
  };

  const handleSaveNotes = () => {
    if (!viewing) return;
    setInternalNotes(viewing.id, internalNotes);
    setQuotationPrepNotes(viewing.id, quotationPrepNotes);
    setViewing({ ...viewing, internalNotes, quotationPrepNotes });
  };

  const handleStatusChange = (status: ProjectRequestStatus) => {
    if (!viewing) return;
    changeStatus(viewing.id, status);
    setViewing({ ...viewing, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <HardHat size={28} className="text-yellow-accent" />
          {ar ? 'طلبات المشاريع' : 'Project Requests'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${filtered.length} طلب` : `${filtered.length} requests`}</p>
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث برقم الطلب أو المشروع أو الشركة...' : 'Search by request #, project, or company...'} value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {allServiceTypes.map((st) => <option key={st} value={st}>{ar ? serviceTypeLabels[st].ar : serviceTypeLabels[st].en}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <HardHat size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات مشاريع' : 'No project requests'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => handleOpen(p)} className="card-industrial p-4 w-full text-start hover-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{p.requestNumber}</span>
                    <span className="text-xs text-base-muted">• {p.createdAt}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{p.projectName}</div>
                  <div className="text-xs text-base-muted">
                    {ar ? serviceTypeLabels[p.serviceType].ar : serviceTypeLabels[p.serviceType].en} • {p.company.companyName || p.customerName} • {p.region}, {p.city}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColors[p.status]}`}>
                    {ar ? statusLabels[p.status].ar : statusLabels[p.status].en}
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
                <h3 className="text-lg font-bold text-base-primary">{viewing.projectName}</h3>
                <p className="text-xs text-base-muted">{viewing.requestNumber} • {viewing.createdAt}</p>
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

              {/* Customer/Company */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Building2 size={14} /> {ar ? 'العميل/الشركة' : 'Customer/Company'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company.companyName || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'العميل' : 'Customer'}: </span><span className="font-semibold text-base-primary">{viewing.customerName}</span></div>
                  <div><span className="text-base-muted">{ar ? 'س.ت' : 'CR'}: </span><span className="font-semibold text-base-primary">{viewing.company.commercialRegistration || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}: </span><span className="font-semibold text-base-primary">{viewing.company.companyPhone || '—'}</span></div>
                </div>
              </div>

              {/* Project info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><HardHat size={14} /> {ar ? 'بيانات المشروع' : 'Project'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الخدمة' : 'Service'}: </span><span className="font-semibold text-base-primary">{ar ? serviceTypeLabels[viewing.serviceType].ar : serviceTypeLabels[viewing.serviceType].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'النوع' : 'Type'}: </span><span className="font-semibold text-base-primary">{ar ? projectTypeLabels[viewing.projectType].ar : projectTypeLabels[viewing.projectType].en}</span></div>
                  {viewing.estimatedBudget && <div><span className="text-base-muted">{ar ? 'الميزانية' : 'Budget'}: </span><span className="font-semibold text-base-primary">{viewing.estimatedBudget}</span></div>}
                </div>
                {viewing.projectScope && <div className="mt-2 text-sm"><span className="text-base-muted">{ar ? 'النطاق' : 'Scope'}: </span><span className="text-base-primary"> {viewing.projectScope}</span></div>}
                {viewing.description && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'الوصف' : 'Description'}: </span><span className="text-base-primary"> {viewing.description}</span></div>}
                {viewing.requirements && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'المتطلبات' : 'Requirements'}: </span><span className="text-base-primary"> {viewing.requirements}</span></div>}
                {viewing.additionalNotes && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span><span className="text-base-primary"> {viewing.additionalNotes}</span></div>}
              </div>

              {/* Location */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><MapPin size={14} /> {ar ? 'الموقع' : 'Location'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'المنطقة' : 'Region'}: </span><span className="font-semibold text-base-primary">{viewing.region}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدينة' : 'City'}: </span><span className="font-semibold text-base-primary">{viewing.city}</span></div>
                  <div className="col-span-2"><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{viewing.projectLocation || '—'}</span></div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Calendar size={14} /> {ar ? 'الجدول الزمني' : 'Timeline'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{viewing.expectedStartDate || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{viewing.expectedDuration || '—'}</span></div>
                </div>
              </div>

              {/* Attachments */}
              {viewing.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Paperclip size={14} /> {ar ? 'المرفقات' : 'Attachments'}</h4>
                  <div className="space-y-1">
                    {viewing.attachments.map((att) => (
                      <div key={att.id} className="text-sm flex items-center gap-2 p-2 rounded-lg bg-base border border-base">
                        <FileText size={12} className="text-yellow-accent" />
                        <span className="text-base-primary">{att.fileName}</span>
                        <span className="text-base-muted text-xs">({att.fileSize})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal notes — admin only, never shown to customer */}
              <div className="border-t border-base pt-4">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-3">
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                    <StickyNote size={12} />
                    {ar ? 'ملاحظات داخلية — لا تظهر للعميل' : 'Internal Notes — Never visible to customer'}
                  </p>
                </div>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? 'ملاحظات داخلية' : 'Internal Notes'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={internalNotes} onChange={(e) => setInternalNotesState(e.target.value)} placeholder={ar ? 'ملاحظات للفريق الداخلي...' : 'Notes for internal team...'} />
                <label className="block text-xs font-semibold text-base-muted mb-1.5 mt-3">{ar ? 'ملاحظات إعداد العرض' : 'Quotation Preparation Notes'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={quotationPrepNotes} onChange={(e) => setQuotationPrepNotesState(e.target.value)} placeholder={ar ? 'ملاحظات لإعداد عرض السعر...' : 'Notes for quotation preparation...'} />
                <button onClick={handleSaveNotes} className="btn-primary text-xs mt-3 flex items-center gap-1.5">
                  <FileText size={14} />
                  {ar ? 'حفظ الملاحظات' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
