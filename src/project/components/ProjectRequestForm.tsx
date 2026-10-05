import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, HardHat, MapPin, Building2, Send, CheckCircle, AlertCircle, Upload, X, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useProject } from '@/project/ProjectContext';
import {
  emptyDraft, serviceTypeLabels, projectTypeLabels,
  allServiceTypes, allProjectTypes,
} from '@/project/types';
import type { ProjectRequestDraft, ProjectServiceType, ProjectRequestAttachment, ProjectRequest } from '@/project/types';

interface Props {
  prefillService?: ProjectServiceType;
  onComplete?: (req: ProjectRequest) => void;
  onCancel?: () => void;
}

const steps = [
  { id: 1, labelAr: 'المشروع', labelEn: 'Project', icon: HardHat },
  { id: 2, labelAr: 'الموقع والمدة', labelEn: 'Location & Duration', icon: MapPin },
  { id: 3, labelAr: 'الشركة', labelEn: 'Company', icon: Building2 },
  { id: 4, labelAr: 'المراجعة', labelEn: 'Review', icon: Check },
];

export default function ProjectRequestForm({ prefillService, onComplete, onCancel }: Props) {
  const { lang, dir } = useApp();
  const { user, company } = useCustomer();
  const { submitProjectRequest } = useProject();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProjectRequestDraft>(() => ({
    ...emptyDraft(company),
    serviceType: prefillService || 'contracting_construction',
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<ProjectRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const update = <K extends keyof ProjectRequestDraft>(key: K, value: ProjectRequestDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: ProjectRequestAttachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      fileType: file.type || 'unknown',
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
    }));
    update('attachments', [...form.attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    update('attachments', form.attachments.filter((a) => a.id !== id));
  };

  const validateStep = (s: number): string[] => {
    const errs: string[] = [];
    if (s === 1) {
      if (!form.projectName.trim()) errs.push(ar ? 'اسم المشروع مطلوب' : 'Project name is required');
      if (!form.projectScope.trim()) errs.push(ar ? 'نطاق المشروع مطلوب' : 'Project scope is required');
    }
    if (s === 2) {
      if (!form.region.trim()) errs.push(ar ? 'المنطقة مطلوبة' : 'Region is required');
      if (!form.city.trim()) errs.push(ar ? 'المدينة مطلوبة' : 'City is required');
      if (!form.expectedStartDate) errs.push(ar ? 'تاريخ البدء المتوقع مطلوب' : 'Expected start date is required');
      if (!form.expectedDuration.trim()) errs.push(ar ? 'المدة المتوقعة مطلوبة' : 'Expected duration is required');
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setStep((s) => Math.min(s + 1, 4));
  };

  const handlePrev = () => {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = () => {
    const errs = validateStep(1).concat(validateStep(2));
    if (errs.length > 0) { setErrors(errs); setStep(1); return; }
    if (!user) return;
    const req = submitProjectRequest(form, user.id, user.fullName);
    setSubmitted(req);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-black text-base-primary">{ar ? 'تم استلام طلبك بنجاح' : 'Request submitted successfully'}</h2>
        <div className="card-industrial p-5 max-w-md mx-auto text-start space-y-2">
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'رقم الطلب' : 'Request Number'}</span><span className="text-sm font-bold text-yellow-accent">{submitted.requestNumber}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'المشروع' : 'Project'}</span><span className="text-sm font-semibold text-base-primary">{submitted.projectName}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'الخدمة' : 'Service'}</span><span className="text-sm font-semibold text-base-primary">{ar ? serviceTypeLabels[submitted.serviceType].ar : serviceTypeLabels[submitted.serviceType].en}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'الموقع' : 'Location'}</span><span className="text-sm font-semibold text-base-primary">{submitted.region}, {submitted.city}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'الحالة' : 'Status'}</span><span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-yellow-accent/10 text-yellow-accent">{ar ? 'جديد' : 'New'}</span></div>
        </div>
        <button onClick={() => onComplete?.(submitted)} className="btn-primary">
          {ar ? 'تم' : 'Done'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between max-w-2xl">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : active ? 'bg-yellow-accent/10 border-yellow-accent text-yellow-accent'
                  : 'border-base text-base-muted'
                }`}>
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-xs font-semibold ${active ? 'text-yellow-accent' : 'text-base-muted'}`}>
                  {ar ? s.labelAr : s.labelEn}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-green-500/30' : 'bg-base'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Project */}
      {step === 1 && (
        <div className="card-industrial p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-base-primary">{ar ? 'بيانات المشروع' : 'Project Details'}</h2>
          <div>
            <label className={labelClass}>{ar ? 'اسم المشروع' : 'Project Name'}</label>
            <input className={inputClass} value={form.projectName} onChange={(e) => update('projectName', e.target.value)} placeholder={ar ? 'مشروع الرياض' : 'Riyadh Project'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'نوع الخدمة' : 'Service Type'}</label>
              <select className={inputClass} value={form.serviceType} onChange={(e) => update('serviceType', e.target.value as ProjectServiceType)}>
                {allServiceTypes.map((st) => <option key={st} value={st}>{ar ? serviceTypeLabels[st].ar : serviceTypeLabels[st].en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'نوع المشروع' : 'Project Type'}</label>
              <select className={inputClass} value={form.projectType} onChange={(e) => update('projectType', e.target.value as ProjectRequestDraft['projectType'])}>
                {allProjectTypes.map((pt) => <option key={pt} value={pt}>{ar ? projectTypeLabels[pt].ar : projectTypeLabels[pt].en}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'نطاق المشروع' : 'Project Scope'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.projectScope} onChange={(e) => update('projectScope', e.target.value)} placeholder={ar ? 'وصف نطاق العمل...' : 'Describe the scope of work...'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الوصف' : 'Description'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder={ar ? 'وصف تفصيلي للمشروع...' : 'Detailed project description...'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'المتطلبات' : 'Requirements'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} placeholder={ar ? 'متطلبات خاصة...' : 'Special requirements...'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الميزانية التقديرية (اختياري)' : 'Estimated Budget (Optional)'}</label>
            <input className={inputClass} value={form.estimatedBudget} onChange={(e) => update('estimatedBudget', e.target.value)} placeholder={ar ? 'مثال: 500,000 ر.س' : 'e.g. 500,000 SAR'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={form.additionalNotes} onChange={(e) => update('additionalNotes', e.target.value)} placeholder={ar ? 'أي ملاحظات...' : 'Any notes...'} />
          </div>
          {/* Attachments */}
          <div>
            <label className={labelClass}>{ar ? 'مرفقات المشروع' : 'Project Attachments'}</label>
            <div className="border-2 border-dashed border-base rounded-lg p-4 text-center hover:border-yellow-accent/50 transition-colors">
              <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="text-sm text-yellow-accent hover:underline flex items-center gap-2 mx-auto">
                <Upload size={16} />
                {ar ? 'اختر ملفات / صور' : 'Select files / images'}
              </button>
              <p className="text-xs text-base-muted mt-1">{ar ? 'سيتم تخزين المرفقات في النسخة المستقبلية' : 'File storage will be available in a future version'}</p>
            </div>
            {form.attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {form.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-base border border-base">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-yellow-accent flex-shrink-0" />
                      <span className="text-sm text-base-primary truncate">{att.fileName}</span>
                      <span className="text-xs text-base-muted flex-shrink-0">{att.fileSize}</span>
                    </div>
                    <button onClick={() => removeAttachment(att.id)} className="p-1 rounded text-red-500 hover:bg-red-500/10">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Location & Duration */}
      {step === 2 && (
        <div className="card-industrial p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-base-primary">{ar ? 'الموقع والمدة' : 'Location & Duration'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'المنطقة' : 'Region'}</label>
              <input className={inputClass} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder={ar ? 'الرياض' : 'Riyadh'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'المدينة' : 'City'}</label>
              <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder={ar ? 'الرياض' : 'Riyadh'} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'موقع المشروع التفصيلي' : 'Project Location'}</label>
            <input className={inputClass} value={form.projectLocation} onChange={(e) => update('projectLocation', e.target.value)} placeholder={ar ? 'الحي الصناعي، طريق الملك فهد' : 'Industrial District, King Fahd Rd'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'تاريخ البدء المتوقع' : 'Expected Start Date'}</label>
              <input type="date" className={inputClass} value={form.expectedStartDate} onChange={(e) => update('expectedStartDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'المدة المتوقعة' : 'Expected Duration'}</label>
              <input className={inputClass} value={form.expectedDuration} onChange={(e) => update('expectedDuration', e.target.value)} placeholder={ar ? 'مثال: 3 أشهر' : 'e.g. 3 months'} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Company */}
      {step === 3 && (
        <div className="card-industrial p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-base-primary">{ar ? 'بيانات الشركة' : 'Company Information'}</h2>
          <p className="text-sm text-base-muted">{ar ? 'يتم تحميل بيانات شركتك تلقائياً. يرجى المراجعة قبل الإرسال.' : 'Your company profile is loaded automatically. Please review before submission.'}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-base-muted">{ar ? 'اسم الشركة' : 'Company Name'}: </span><span className="font-semibold text-base-primary">{company.companyName || '—'}</span></div>
            <div><span className="text-base-muted">{ar ? 'السجل التجاري' : 'CR Number'}: </span><span className="font-semibold text-base-primary">{company.commercialRegistration || '—'}</span></div>
            <div><span className="text-base-muted">{ar ? 'الشخص المسؤول' : 'Contact Person'}: </span><span className="font-semibold text-base-primary">{company.contactPerson || user?.fullName || '—'}</span></div>
            <div><span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}: </span><span className="font-semibold text-base-primary">{company.companyPhone || user?.mobile || '—'}</span></div>
            <div><span className="text-base-muted">{ar ? 'البريد' : 'Email'}: </span><span className="font-semibold text-base-primary">{company.officialEmail || user?.email || '—'}</span></div>
            <div><span className="text-base-muted">{ar ? 'المنطقة' : 'Region'}: </span><span className="font-semibold text-base-primary">{company.region || '—'}</span></div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-industrial p-6">
            <h2 className="text-lg font-bold text-base-primary mb-4">{ar ? 'مراجعة الطلب' : 'Review Request'}</h2>
            <div className="space-y-4">
              {/* Project */}
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><HardHat size={14} /> {ar ? 'المشروع' : 'Project'}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الاسم' : 'Name'}: </span><span className="font-semibold text-base-primary">{form.projectName || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الخدمة' : 'Service'}: </span><span className="font-semibold text-base-primary">{ar ? serviceTypeLabels[form.serviceType].ar : serviceTypeLabels[form.serviceType].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'النوع' : 'Type'}: </span><span className="font-semibold text-base-primary">{ar ? projectTypeLabels[form.projectType].ar : projectTypeLabels[form.projectType].en}</span></div>
                  {form.estimatedBudget && <div><span className="text-base-muted">{ar ? 'الميزانية' : 'Budget'}: </span><span className="font-semibold text-base-primary">{form.estimatedBudget}</span></div>}
                </div>
                {form.projectScope && <div className="mt-2 text-sm"><span className="text-base-muted">{ar ? 'النطاق' : 'Scope'}: </span><span className="text-base-primary"> {form.projectScope}</span></div>}
                {form.description && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'الوصف' : 'Description'}: </span><span className="text-base-primary"> {form.description}</span></div>}
                {form.requirements && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'المتطلبات' : 'Requirements'}: </span><span className="text-base-primary"> {form.requirements}</span></div>}
                {form.additionalNotes && <div className="mt-1 text-sm"><span className="text-base-muted">{ar ? 'ملاحظات' : 'Notes'}: </span><span className="text-base-primary"> {form.additionalNotes}</span></div>}
              </div>
              <div className="h-px bg-base" />
              {/* Location */}
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><MapPin size={14} /> {ar ? 'الموقع والمدة' : 'Location & Duration'}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'المنطقة' : 'Region'}: </span><span className="font-semibold text-base-primary">{form.region || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدينة' : 'City'}: </span><span className="font-semibold text-base-primary">{form.city || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الموقع' : 'Location'}: </span><span className="font-semibold text-base-primary">{form.projectLocation || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{form.expectedStartDate || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{form.expectedDuration || '—'}</span></div>
                </div>
              </div>
              {form.attachments.length > 0 && (
                <>
                  <div className="h-px bg-base" />
                  <div>
                    <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2">{ar ? 'المرفقات' : 'Attachments'}</h3>
                    <div className="space-y-1">
                      {form.attachments.map((att) => (
                        <div key={att.id} className="text-sm flex items-center gap-2">
                          <FileText size={12} className="text-yellow-accent" />
                          <span className="text-base-primary">{att.fileName}</span>
                          <span className="text-base-muted text-xs">({att.fileSize})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="h-px bg-base" />
              {/* Company */}
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Building2 size={14} /> {ar ? 'بيانات الشركة' : 'Company'}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold text-base-primary">{company.companyName || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'س.ت' : 'CR'}: </span><span className="font-semibold text-base-primary">{company.commercialRegistration || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المسؤول' : 'Contact'}: </span><span className="font-semibold text-base-primary">{company.contactPerson || user?.fullName || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الجوال' : 'Mobile'}: </span><span className="font-semibold text-base-primary">{company.companyPhone || user?.mobile || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary text-sm">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
        )}
        <div className="flex gap-3 ms-auto">
          {step > 1 && (
            <button onClick={handlePrev} className="btn-secondary text-sm">
              {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              {ar ? 'السابق' : 'Previous'}
            </button>
          )}
          {step < 4 ? (
            <button onClick={handleNext} className="btn-primary text-sm">
              {ar ? 'التالي' : 'Next'}
              {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary text-sm">
              <Send size={16} />
              {ar ? 'إرسال طلب المشروع' : 'Submit Project Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
