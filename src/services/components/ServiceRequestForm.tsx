import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Send, CheckCircle, AlertCircle, Upload, X, FileText, Building2, MapPin, Calendar, HardHat, Paperclip } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useServices } from '../ServicesContext';
import TermsConsent from '@/components/TermsConsent';
import {
  serviceCategories, serviceCategoryLabels, allServiceTypesList,
  projectTypeLabels, expectedStartLabels,
  allProjectTypes, allExpectedStartOptions,
  getCategoryForService,
} from '../types';
import type { ServiceCategoryId, ProjectTypeOption, ExpectedStartOption, ProjectRequestAttachment } from '../types';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — matches project-documents bucket limit
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
];

function validateSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Accept: 05XXXXXXXX, +9665XXXXXXXX, 9665XXXXXXXX, 5XXXXXXXX
  return /^(?:\+?966|0)?5\d{8}$/.test(cleaned);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface Props {
  preselectedService?: string;
}

export default function ServiceRequestForm({ preselectedService }: Props) {
  const { lang, dir } = useApp();
  const { submitRequest, submitting } = useServices();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ar = lang === 'ar';

  const preselectedCategory: ServiceCategoryId = preselectedService
    ? (getCategoryForService(preselectedService) || 'contracting')
    : 'contracting';

  const [form, setForm] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    email: '',
    serviceCategory: preselectedCategory,
    serviceType: preselectedService || '',
    projectDescription: '',
    city: '',
    district: '',
    projectType: '' as ProjectTypeOption | '',
    estimatedBudget: '',
    expectedStart: '' as ExpectedStartOption | '',
    attachments: [] as ProjectRequestAttachment[],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);
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
    const newAtts: ProjectRequestAttachment[] = [];
    const newErrs: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        newErrs.push(ar ? `الملف ${file.name} يتجاوز الحد الأقصى (10 ميجابايت)` : `File ${file.name} exceeds max size (10MB)`);
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
      });
    });

    if (newErrs.length > 0) {
      setErrors((prev) => [...prev, ...newErrs]);
    }
    if (newAtts.length > 0) {
      setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.customerName.trim()) errs.push(ar ? 'الاسم الكامل مطلوب' : 'Full name is required');
    if (!form.phone.trim()) {
      errs.push(ar ? 'رقم الجوال مطلوب' : 'Mobile number is required');
    } else if (!validateSaudiPhone(form.phone)) {
      errs.push(ar ? 'رقم الجوال غير صحيح (مثال: 05XXXXXXXX)' : 'Invalid Saudi mobile number (e.g. 05XXXXXXXX)');
    }
    if (form.email.trim() && !validateEmail(form.email)) {
      errs.push(ar ? 'البريد الإلكتروني غير صحيح' : 'Email is invalid');
    }
    if (!form.serviceType.trim()) errs.push(ar ? 'نوع الخدمة مطلوب' : 'Service type is required');
    if (!form.projectDescription.trim()) errs.push(ar ? 'وصف المشروع مطلوب' : 'Project description is required');
    if (!form.city.trim()) errs.push(ar ? 'المدينة مطلوبة' : 'City is required');
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (!agreed) {
      errs.push(ar ? 'يجب الموافقة على الشروط والأحكام وسياسة الخصوصية' : 'You must agree to the Terms & Conditions and Privacy Policy');
      setConsentInvalid(true);
    }
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const result = await submitRequest(form, agreed);
    if (result.deferred) return;
    if (result.success && result.record) {
      setSubmittedRef(result.record.request_reference);
    } else {
      setErrors([result.error || (ar ? 'حدث خطأ أثناء الإرسال' : 'An error occurred during submission')]);
    }
  };

  // Success screen
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
            {ar
              ? 'شكرًا لتواصلك مع SAHAB. تم استلام تفاصيل مشروعك وسيقوم فريقنا بمراجعة الطلب والتواصل معك.'
              : 'Thank you for contacting SAHAB. Your project details have been received and our team will review your request and contact you.'}
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
              <span className="text-sm font-semibold text-base-primary">
                {ar ? serviceCategoryLabels[form.serviceCategory].ar : serviceCategoryLabels[form.serviceCategory].en}
              </span>
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
                  serviceCategory: 'contracting', serviceType: '',
                  projectDescription: '', city: '', district: '',
                  projectType: '', estimatedBudget: '', expectedStart: '',
                  attachments: [],
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

  const currentCategory = serviceCategories.find((c) => c.id === form.serviceCategory);
  const currentServiceOptions = currentCategory
    ? currentCategory.services
    : allServiceTypesList.filter((s) => s.id !== 'other');

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
        <span className="text-yellow-accent font-semibold">
          {ar ? 'اطلب عرض مشروع' : 'Request a Project Quote'}
        </span>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-base-primary mb-2">
          {ar ? 'اطلب عرض مشروع' : 'Request a Project Quote'}
        </h1>
        <p className="text-base-muted">
          {ar
            ? 'أرسل تفاصيل مشروعك إلى فريق SAHAB وسنراجع طلبك ونتواصل معك.'
            : 'Send your project details to the SAHAB team and we will review your request and contact you.'}
        </p>
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

      {/* Form sections */}
      <div className="space-y-6">
        {/* Customer Information */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <Building2 size={16} />
            {ar ? 'معلومات العميل' : 'Customer Information'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'الاسم الكامل' : 'Full Name'} <span className="text-red-500">*</span></label>
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
              <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder={ar ? '05XXXXXXXX' : '05XXXXXXXX'} dir="ltr" />
              <p className="text-xs text-base-muted mt-1">{ar ? 'رقم سعودي: 05XXXXXXXX' : 'Saudi number: 05XXXXXXXX'}</p>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'البريد الإلكتروني' : 'Email'}</label>
              <input className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <HardHat size={16} />
            {ar ? 'معلومات الخدمة' : 'Service Information'}
          </h2>
          <div>
            <label className={labelClass}>{ar ? 'نوع الخدمة' : 'Service Type'} <span className="text-red-500">*</span></label>
            <select
              className={inputClass}
              value={form.serviceCategory}
              onChange={(e) => { update('serviceCategory', e.target.value); update('serviceType', ''); }}
            >
              {serviceCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'الخدمة المحددة' : 'Specific Service'} <span className="text-red-500">*</span></label>
            <select className={inputClass} value={form.serviceType} onChange={(e) => update('serviceType', e.target.value)}>
              <option value="">{ar ? '— اختر —' : '— Select —'}</option>
              {currentServiceOptions.map((svc) => (
                <option key={svc.id} value={svc.id}>{ar ? svc.nameAr : svc.nameEn}</option>
              ))}
              {form.serviceCategory === 'contracting' && (
                <option value="other">{ar ? 'أخرى' : 'Other'}</option>
              )}
            </select>
          </div>
        </div>

        {/* Project Details */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <Paperclip size={16} />
            {ar ? 'تفاصيل المشروع' : 'Project Details'}
          </h2>
          <div>
            <label className={labelClass}>{ar ? 'وصف المشروع' : 'Project Description'} <span className="text-red-500">*</span></label>
            <textarea rows={4} className={`${inputClass} resize-none`} value={form.projectDescription} onChange={(e) => update('projectDescription', e.target.value)} placeholder={ar ? 'اكتب نبذة عن المشروع ومتطلباته...' : 'Write a brief about the project and its requirements...'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'المدينة' : 'City'} <span className="text-red-500">*</span></label>
              <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder={ar ? 'الرياض' : 'Riyadh'} />
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الحي' : 'District'}</label>
              <input className={inputClass} value={form.district} onChange={(e) => update('district', e.target.value)} placeholder={ar ? 'حي العليا' : 'Al Olaya'} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{ar ? 'نوع المشروع' : 'Project Type'}</label>
              <select className={inputClass} value={form.projectType} onChange={(e) => update('projectType', e.target.value)}>
                <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                {allProjectTypes.map((pt) => (
                  <option key={pt} value={pt}>{ar ? projectTypeLabels[pt].ar : projectTypeLabels[pt].en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{ar ? 'الميزانية التقريبية' : 'Estimated Budget'}</label>
              <input className={inputClass} value={form.estimatedBudget} onChange={(e) => update('estimatedBudget', e.target.value)} placeholder={ar ? 'مثال: 500,000 ر.س' : 'e.g. 500,000 SAR'} />
              <p className="text-xs text-base-muted mt-1">{ar ? 'للمراجعة الداخلية فقط — لا يتم احتساب عرض سعر' : 'For internal review only — no quote is calculated'}</p>
            </div>
          </div>
        </div>

        {/* Project Timeline */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <Calendar size={16} />
            {ar ? 'الجدول الزمني' : 'Project Timeline'}
          </h2>
          <div>
            <label className={labelClass}>{ar ? 'المدة المتوقعة / موعد البدء' : 'Expected Duration / Start Time'}</label>
            <select className={inputClass} value={form.expectedStart} onChange={(e) => update('expectedStart', e.target.value)}>
              <option value="">{ar ? '— اختر —' : '— Select —'}</option>
              {allExpectedStartOptions.map((opt) => (
                <option key={opt} value={opt}>{ar ? expectedStartLabels[opt].ar : expectedStartLabels[opt].en}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attachments */}
        <div className="card-industrial p-6 space-y-4">
          <h2 className={sectionTitleClass}>
            <FileText size={16} />
            {ar ? 'مرفقات المشروع' : 'Project Attachments'}
          </h2>
          <p className="text-xs text-base-muted">
            {ar ? 'يمكنك إرفاق ملفات PDF، صور، رسومات، جداول كميات، أو مواصفات. الحد الأقصى 10 ميجابايت لكل ملف.'
              : 'You can attach PDF, images, drawings, BOQ, or specifications. Max 10MB per file.'}
          </p>
          <div className="border-2 border-dashed border-base rounded-lg p-4 text-center hover:border-yellow-accent/50 transition-colors">
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip" />
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

        {/* Terms consent */}
        <div className="mb-4">
          <TermsConsent
            checked={agreed}
            onChange={(v) => {
              setAgreed(v);
              if (v) setConsentInvalid(false);
            }}
            lang={lang}
            invalid={consentInvalid}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => { window.location.hash = '#home'; }} className="btn-secondary text-sm">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm">
            <Send size={16} />
            {submitting ? (ar ? 'جاري الإرسال...' : 'Submitting...') : (ar ? 'إرسال طلب المشروع' : 'Submit Project Request')}
          </button>
        </div>
      </div>
    </div>
  );
}
