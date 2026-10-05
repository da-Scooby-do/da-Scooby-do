import { useState } from 'react';
import { HardHat, Eye, X, MapPin, Calendar, Clock, FileText, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useProject } from '@/project/ProjectContext';
import { statusLabels, statusColors, serviceTypeLabels, projectTypeLabels } from '@/project/types';
import type { ProjectRequest } from '@/project/types';

export default function MyProjects() {
  const { lang } = useApp();
  const { user } = useCustomer();
  const { projectRequestsByCustomer } = useProject();
  const [viewing, setViewing] = useState<ProjectRequest | null>(null);

  const ar = lang === 'ar';
  const myProjects = projectRequestsByCustomer(user?.id || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <HardHat size={28} className="text-yellow-accent" />
          {ar ? 'طلبات المشاريع' : 'My Project Requests'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? `${myProjects.length} طلب` : `${myProjects.length} requests`}</p>
      </div>

      {myProjects.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <HardHat size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{ar ? 'لا توجد طلبات مشاريع' : 'No project requests'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProjects.map((p) => (
            <button key={p.id} onClick={() => setViewing(p)} className="card-industrial p-5 w-full text-start hover-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-base-muted">{p.requestNumber}</span>
                    <span className="text-xs text-base-muted">• {p.createdAt}</span>
                  </div>
                  <div className="text-sm font-bold text-base-primary">{p.projectName}</div>
                  <div className="text-xs text-base-muted">
                    {ar ? serviceTypeLabels[p.serviceType].ar : serviceTypeLabels[p.serviceType].en} • {p.region}, {p.city}
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
              {/* Status */}
              <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${statusColors[viewing.status]}`}>
                {ar ? statusLabels[viewing.status].ar : statusLabels[viewing.status].en}
              </span>

              {/* Project info */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><HardHat size={14} /> {ar ? 'بيانات المشروع' : 'Project'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الاسم' : 'Name'}: </span><span className="font-semibold text-base-primary">{viewing.projectName}</span></div>
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
                  <div className="col-span-2"><span className="text-base-muted">{ar ? 'الموقع التفصيلي' : 'Location'}: </span><span className="font-semibold text-base-primary">{viewing.projectLocation || '—'}</span></div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Calendar size={14} /> {ar ? 'الجدول الزمني' : 'Timeline'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'تاريخ البدء' : 'Start Date'}: </span><span className="font-semibold text-base-primary">{viewing.expectedStartDate || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{viewing.expectedDuration || '—'}</span></div>
                </div>
              </div>

              {/* Attachments */}
              {viewing.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><FileText size={14} /> {ar ? 'المرفقات' : 'Attachments'}</h4>
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

              {/* Company */}
              <div>
                <h4 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Building2 size={14} /> {ar ? 'بيانات الشركة' : 'Company'}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{viewing.company.companyName || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'س.ت' : 'CR'}: </span><span className="font-semibold text-base-primary">{viewing.company.commercialRegistration || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المسؤول' : 'Contact'}: </span><span className="font-semibold text-base-primary">{viewing.company.contactPerson || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}: </span><span className="font-semibold text-base-primary">{viewing.company.companyPhone || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
