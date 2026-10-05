import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Send, CheckCircle, AlertCircle, Upload, X, FileText, Building2, MapPin, Calendar, HardHat, Paperclip, ClipboardList, PencilRuler } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useServices } from '../ServicesContext';
import { supabase } from '@/lib/supabase';

export type RequestType = 'project_execution' | 'contracting' | 'engineering' | 'project_management' | 'site_visit';

interface Props {
  requestType: RequestType;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — matches project-documents bucket limit
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
];

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: string;
  file: File;
  filePath: string;
}

const requestTypeConfig: Record<RequestType, {
  titleAr: string; titleEn: string;
  descAr: string; descEn: string;
  serviceCategory: string;
  serviceType: string;
  icon: typeof Building2;
}> = {
  project_execution: {
    titleAr: 'طلب تنفيذ مشروع',
    titleEn: 'Project Execution Request',
    descAr: 'للعملاء الذين يرغبون في تنفيذ مشروع إنشائي متكامل مع فريق سحاب.',
    descEn: 'For customers who want SAHAB to execute a complete construction project.',
    serviceCategory: 'contracting',
    serviceType: 'general-contracting',
    icon: Building2,
  },
  contracting: {
    titleAr: 'طلب أعمال مقاولات',
    titleEn: 'Contracting Works Request',
    descAr: 'للعملاء الذين يحتاجون إلى أعمال مقاولات محددة.',
    descEn: 'For customers requesting specific contracting work.',
    serviceCategory: 'contracting',
    serviceType: 'general-contracting',
    icon: HardHat,
  },
  engineering: {
    titleAr: 'طلب خدمة هندسية',
    titleEn: 'Engineering Service Request',
    descAr: 'للعملاء الذين يحتاجون إلى خدمات هندسية أو استشارات فنية.',
    descEn: 'For customers needing engineering services or technical consultation.',
    serviceCategory: 'engineering',
    serviceType: 'architectural-design',
    icon: PencilRuler,
  },
  project_management: {
    titleAr: 'طلب إدارة مشروع',
    titleEn: 'Project Management Request',
    descAr: 'للعملاء الذين يحتاجون إلى إدارة وإشراف على المشاريع.',
    descEn: 'For customers needing project management and supervision.',
    serviceCategory: 'project-management',
    serviceType: 'project-management',
    icon: ClipboardList,
  },
  site_visit: {
    titleAr: 'طلب معاينة / زيارة موقع',
    titleEn: 'Site Visit Request',
    descAr: 'اطلب معاينة الموقع لتقييم المشروع وتقديم العرض المناسب.',
    descEn: 'Request a site visit for project assessment and quotation.',
    serviceCategory: 'contracting',
    serviceType: 'general-contracting',
    icon: MapPin,
  },
};

function validateSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+?966|0)?5\d{8}$/.test(cleaned);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ServiceRequestPage({ requestType }: Props) {
  const { lang, dir } = useApp();
  const { submitServiceRequest, submitting } = useServices();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ar = lang === 'ar';
  const cfg = requestTypeConfig[requestType];
  const Icon = cfg.icon;

  const [form, setForm] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    email: '',
    projectName: '',
    projectType: '',
    city: '',
    district: '',
    projectDescription: '',
    scopeOfWork: '',
    estimatedBudget: '',
    expectedStart: '',
    expectedStartDate: '',
    expectedDuration: '',
    preferredVisitDate: '',
    notes: '',
    attachments: [] as Attachment[],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';
  const sectionTitleClass = 'text-sm font-bold text-yellow-accent uppercase tracking-wider mb-3 flex items-center gap-2';

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = [];
    const newErrs: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newErrs.push(ar ? `الملف ${file.name} يتجاوز الحد الأقصى (25 ميجابايت)` : `File ${file.name} exceeds max size (25MB)`);
        return;
      }
      if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
        newErrs.push(ar ? `نوع الملف ${file.name} غير مدعوم` : `File type ${file.name} is not supported`);
        return;
      }
      newAtts.push({
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
        file,
        filePath: '',
      });
    });

    if (newErrs.length > 0) setErrors((prev) => [...prev, ...newErrs]);
    if (newAtts.length > 0) setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.customerName.trim()) errs.push(ar ? 'الاسم مطلوب' : 'Name is required');
    if (!form.phone.trim()) {
      errs.push(ar ? 'رقم الجوال مطلوب' : 'Mobile number is required');
    } else if (!validateSaudiPhone(form.phone)) {
      errs.push(ar ? 'رقم الجوال غير صحيح (مثال: 05XXXXXXXX)' : 'Invalid Saudi mobile number (e.g. 05XXXXXXXX)');
    }
    if (form.email.trim() && !validateEmail(form.email)) {
      errs.push(ar ? 'البريد الإلكتروني غير صحيح' : 'Email is invalid');
    }
    if (!form.city.trim()) errs.push(ar ? 'المدينة مطلوبة' : 'City is required');

    if (requestType === 'project_execution') {
      if (!form.projectName.trim()) errs.push(ar ? 'اسم المشروع مطلوب' : 'Project name is required');
      if (!form.projectDescription.trim()) errs.push(ar ? 'وصف المشروع مطلوب' : 'Project description is required');
    }
    if (requestType === 'contracting') {
      if (!form.projectDescription.trim()) errs.push(ar ? 'وصف الأعمال المطلوبة مطلوب' : 'Work description is required');
    }
    if (requestType === 'engineering') {
      if (!form.projectDescription.trim()) errs.push(ar ? 'وصف الطلب مطلوب' : 'Request description is required');
    }
    if (requestType === 'project_management') {
      if (!form.projectName.trim()) errs.push(ar ? 'اسم المشروع مطلوب' : 'Project name is required');
      if (!form.projectDescription.trim()) errs.push(ar ? 'وصف المشروع مطلوب' : 'Project description is required');
    }
    if (requestType === 'site_visit') {
      if (!form.projectDescription.trim()) errs.push(ar ? 'وصف مختصر مطلوب' : 'Brief description is required');
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const result = await submitServiceRequest({
      customerName: form.customerName,
      companyName: form.companyName,
      phone: form.phone,
      email: form.email,
      serviceCategory: cfg.serviceCategory,
      serviceType: cfg.serviceType,
      requestType,
      projectDescription: form.projectDescription,
      projectName: form.projectName,
      scopeOfWork: form.scopeOfWork,
      city: form.city,
      district: form.district,
      projectType: form.projectType,
      estimatedBudget: form.estimatedBudget,
      expectedStart: form.expectedStart,
      expectedStartDate: form.expectedStartDate,
      expectedDuration: form.expectedDuration,
      preferredVisitDate: form.preferredVisitDate,
      notes: form.notes,
    });
    if (result.success && result.record) {
      const requestId = result.record.id;
      if (form.attachments.length > 0 && requestId) {
        for (const att of form.attachments) {
          const ext = att.fileName.split('.').pop() || 'bin';
          const storagePath = `${requestId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
          try {
            const { error: uploadError } = await supabase.storage
              .from('project-documents')
              .upload(storagePath, att.file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;
            await supabase.from('project_attachments').insert({
              project_request_id: requestId,
              file_name: att.fileName,
              file_path: storagePath,
              file_type: att.fileType,
              file_size: att.fileSize,
            });
          } catch {
            // Attachment upload failed — the request itself still succeeded
          }
        }
      }
      setSubmittedRef(result.record.request_reference);
    } else {
      setErrors([result.error || (ar ? 'حدث خطأ أثناء الإرسال' : 'An error occurred during submission')]);
    }
  };

  if (submittedRef) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-24">
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-base-primary">
            {ar ? 'تم استلام طلبك بنجاح' : 'Request submitted successfully'}
          </h2>
          <p className="text-base-muted max-w-md mx-auto">
            {requestType === 'site_visit'
              ? (ar ? 'سيقوم فريق سحاب بمراجعة الطلب والتواصل معك لتأكيد الموعد.' : 'The SAHAB team will review your request and contact you to confirm the appointment.')
              : (ar ? 'شكرًا لتواصلك مع سحاب. تم استلام تفاصيل طلبك وسيقوم فريقنا بمراجعته والتواصل معك.' : 'Thank you for contacting SAHAB. Your request has been received and our team will review it and contact you.')}
          </p>
          <div className="card-industrial p-5 max-w-md mx-auto text-start space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-base-muted">{ar ? 'رقم الطلب' : 'Request Number'}</span>
              <span className="text-sm font-bold text-yellow-accent">{submittedRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-base-muted">{ar ? 'الاسم' : 'Name'}</span>
              <span className="text-sm font-semibold text-base-primary">{form.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-base-muted">{ar ? 'الخدمة' : 'Service'}</span>
              <span className="text-sm font-semibold text-base-primary">{ar ? cfg.titleAr : cfg.titleEn}</span>
            </div>
          </div>
          <div className="max-w-md mx-auto p-4 rounded-lg bg-yellow-accent/5 border border-yellow-accent/20">
            <p className="text-sm text-base-primary font-semibold mb-2">
              {ar ? 'أنشئ حساباً لتتبع طلباتك وعروضك وعقودك في مكان واحد.' : 'Create an account to track your requests, quotations, and contracts in one place.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a href="#/account" className="btn-primary text-sm justify-center">
                {ar ? 'إنشاء حساب' : 'Create Account'}
              </a>
              <a href="#/account" className="btn-secondary text-sm justify-center">
                {ar ? 'لدي حساب بالفعل' : 'I Already Have an Account'}
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { window.location.hash = '#home'; }} className="btn-primary">
              {ar ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
            <button
              onClick={() => {
                setSubmittedRef(null);
                setForm({
                  customerName: '', companyName: '', phone: '', email: '',
                  projectName: '', projectType: '', city: '', district: '',
                  projectDescription: '', scopeOfWork: '', estimatedBudget: '',
                  expectedStart: '', expectedStartDate: '', expectedDuration: '',
                  preferredVisitDate: '', notes: '', attachments: [],
                });
              }}
              className="btn-secondary"
            >
              {ar ? 'إرسال طلب آخر' : 'Submit Another Request'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-24">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-wrap text-sm pb-6">
        <button onClick={() => { window.location.hash = '#home'; }} className="text-base-muted hover:text-yellow-accent transition-colors">
          {ar ? 'الرئيسية' : 'Home'}
        </button>
        <span className="text-base-muted opacity-50">/</span>
        <button onClick={() => { window.location.hash = '#home'; }} className="text-base-muted hover:text-yellow-accent transition-colors">
          {ar ? 'الخدمات' : 'Services'}
        </button>
        <span className="text-base-muted opacity-50">/</span>
        <span className="text-yellow-accent font-semibold">{ar ? cfg.titleAr : cfg.titleEn}</span>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
            <Icon size={26} className="text-yellow-accent" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-base-primary">
              {ar ? cfg.titleAr : cfg.titleEn}
            </h1>
          </div>
        </div>
        <p className="text-base-muted">{ar ? cfg.descAr : cfg.descEn}</p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1 mb-6">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} />
              {err}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Information */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <Building2 size={16} />
            {ar ? 'معلومات العميل' : 'Customer Information'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'الاسم' : 'Name'} <span className="text-red-500">*</span></label>
              <input className={inputClass} value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder={ar ? 'محمد عبدالله' : 'John Doe'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'اسم الشركة' : 'Company Name'}</label>
              <input className={inputClass} value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder={ar ? 'شركة المملكة' : 'Kingdom Co.'} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'رقم الجوال' : 'Mobile Number'} <span className="text-red-500">*</span></label>
              <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="05XXXXXXXX" dir="ltr" />
              <p className="text-xs text-base-muted mt-1">{ar ? 'رقم سعودي: 05XXXXXXXX' : 'Saudi number: 05XXXXXXXX'}</p>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Project/Request Information — type-specific fields */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <HardHat size={16} />
            {requestType === 'site_visit' ? (ar ? 'معلومات الزيارة' : 'Visit Information') : (ar ? 'معلومات المشروع / الطلب' : 'Project / Request Information')}
          </h2>

          {/* Project name — for project_execution and project_management */}
          {(requestType === 'project_execution' || requestType === 'project_management') && (
            <div>
              <label className={labelClass}>{ar ? 'اسم المشروع' : 'Project Name'} <span className="text-red-500">*</span></label>
              <input className={inputClass} value={form.projectName} onChange={(e) => update('projectName', e.target.value)} placeholder={ar ? 'مشروع الرياض' : 'Riyadh Project'} />
            </div>
          )}

          {/* Project type — for project_execution */}
          {requestType === 'project_execution' && (
            <div>
              <label className={labelClass}>{ar ? 'نوع المشروع' : 'Project Type'}</label>
              <select className={inputClass} value={form.projectType} onChange={(e) => update('projectType', e.target.value)}>
                <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                <option value="commercial">{ar ? 'تجاري' : 'Commercial'}</option>
                <option value="residential">{ar ? 'سكني' : 'Residential'}</option>
                <option value="industrial">{ar ? 'صناعي' : 'Industrial'}</option>
                <option value="infrastructure">{ar ? 'بنية تحتية' : 'Infrastructure'}</option>
                <option value="other">{ar ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          )}

          {/* City + District — all types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'المدينة' : 'City'} <span className="text-red-500">*</span></label>
              <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder={ar ? 'الرياض' : 'Riyadh'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الموقع / الحي' : 'Location / District'}</label>
              <input className={inputClass} value={form.district} onChange={(e) => update('district', e.target.value)} placeholder={ar ? 'حي العليا' : 'Al Olaya'} />
            </div>
          </div>

          {/* Description — all types, label varies */}
          <div>
            <label className={labelClass}>
              {requestType === 'site_visit' ? (ar ? 'وصف مختصر' : 'Brief Description') : requestType === 'contracting' ? (ar ? 'وصف الأعمال المطلوبة' : 'Work Description') : (ar ? 'وصف المشروع / الطلب' : 'Project / Request Description')}
              <span className="text-red-500"> *</span>
            </label>
            <textarea rows={4} className={`${inputClass} resize-none`} value={form.projectDescription} onChange={(e) => update('projectDescription', e.target.value)} placeholder={ar ? 'اكنبذة عن المشروع ومتطلباته...' : 'Brief about the project and its requirements...'} />
          </div>

          {/* Scope of work — for project_execution, contracting, project_management */}
          {(requestType === 'project_execution' || requestType === 'contracting' || requestType === 'project_management') && (
            <div>
              <label className={labelClass}>{ar ? 'نطاق الأعمال' : 'Scope of Work'}</label>
              <textarea rows={3} className={`${inputClass} resize-none`} value={form.scopeOfWork} onChange={(e) => update('scopeOfWork', e.target.value)} placeholder={ar ? 'وصف نطاق العمل المطلوب...' : 'Describe the scope of work...'} />
            </div>
          )}

          {/* Budget — optional for most types */}
          {requestType !== 'site_visit' && (
            <div>
              <label className={labelClass}>{ar ? 'الميزانية التقديرية — اختياري' : 'Estimated Budget — Optional'}</label>
              <input className={inputClass} value={form.estimatedBudget} onChange={(e) => update('estimatedBudget', e.target.value)} placeholder={ar ? 'مثال: 500,000 ر.س' : 'e.g. 500,000 SAR'} />
            </div>
          )}

          {/* Start date — for project_execution, contracting */}
          {(requestType === 'project_execution' || requestType === 'contracting') && (
            <div>
              <label className={labelClass}>{ar ? 'تاريخ البدء المتوقع — اختياري' : 'Expected Start Date — Optional'}</label>
              <input type="date" className={inputClass} value={form.expectedStartDate} onChange={(e) => update('expectedStartDate', e.target.value)} />
            </div>
          )}

          {/* Duration — for project_execution */}
          {requestType === 'project_execution' && (
            <div>
              <label className={labelClass}>{ar ? 'مدة المشروع المتوقعة — اختياري' : 'Expected Duration — Optional'}</label>
              <input className={inputClass} value={form.expectedDuration} onChange={(e) => update('expectedDuration', e.target.value)} placeholder={ar ? 'مثال: 3 أشهر' : 'e.g. 3 months'} />
            </div>
          )}

          {/* Preferred visit date — for site_visit */}
          {requestType === 'site_visit' && (
            <div>
              <label className={labelClass}>{ar ? 'التاريخ المفضل للزيارة' : 'Preferred Visit Date'}</label>
              <input type="date" className={inputClass} value={form.preferredVisitDate} onChange={(e) => update('preferredVisitDate', e.target.value)} />
            </div>
          )}

          {/* Notes — for site_visit and general */}
          {requestType === 'site_visit' && (
            <div>
              <label className={labelClass}>{ar ? 'ملاحظات' : 'Notes'}</label>
              <textarea rows={2} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder={ar ? 'أي ملاحظات إضافية...' : 'Any additional notes...'} />
            </div>
          )}
        </div>

        {/* Attachments — all types except site_visit (optional) */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <FileText size={16} />
            {ar ? 'المرفقات' : 'Attachments'}
          </h2>
          <p className="text-xs text-base-muted">
            {ar
              ? 'يمكنك إرفاق ملفات PDF، صور (JPG/PNG/WEBP)، رسومات، جداول كميات (BOQ)، مواصفات. الحد الأقصى 25 ميجابايت لكل ملف.'
              : 'You can attach PDF, images (JPG/PNG/WEBP), drawings, BOQ, specifications. Max 25MB per file.'}
          </p>
          <div className="border-2 border-dashed border-base rounded-lg p-4 text-center hover:border-yellow-accent/50 transition-colors">
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm text-yellow-accent hover:underline flex items-center gap-2 mx-auto">
              <Upload size={16} />
              {ar ? 'اختر ملفات / صور' : 'Select files / images'}
            </button>
          </div>
          {form.attachments.length > 0 && (
            <div className="space-y-1.5">
              {form.attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-base border border-base">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-yellow-accent flex-shrink-0" />
                    <span className="text-sm text-base-primary truncate">{att.fileName}</span>
                    <span className="text-xs text-base-muted flex-shrink-0">{att.fileSize}</span>
                  </div>
                  <button onClick={() => removeAttachment(i)} className="p-1 rounded text-red-500 hover:bg-red-500/10">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => { window.location.hash = '#home'; }} className="btn-secondary text-sm">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm">
            <Send size={16} />
            {submitting
              ? (ar ? 'جاري الإرسال...' : 'Submitting...')
              : (ar
                ? (requestType === 'site_visit' ? 'طلب زيارة الموقع' : requestType === 'contracting' ? 'إرسال طلب المقاولات' : 'إرسال طلب المشروع')
                : (requestType === 'site_visit' ? 'Request Site Visit' : requestType === 'contracting' ? 'Submit Contracting Request' : 'Submit Project Request'))}
          </button>
        </div>
      </div>
    </div>
  );
}
