import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Package, Calendar, MapPin, Building2, Send, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '@/customer/CustomerContext';
import { useRental } from '@/rental/RentalContext';
import { sizeClasses } from '@/catalog/sizeClasses';
import { rentalPeriods } from '@/catalog/types';
import { useCatalogData } from '@/catalog/useCatalogData';
import {
  getCategoryById, getBrandById, getModelById,
  getModelsByCategoryAndBrand, getBrandsByCategory,
} from '@/catalog/catalogApi';
import type {
  RentalRequestDraft, RentalDuration, OperatorChoice, DieselChoice, TransportChoice,
  RentalRequest, RentalRequestItem,
} from '@/rental/types';
import {
  emptyDraft, emptyItem, isOperatorMandatory, isForkliftCategory, parseForkliftTons,
  durationLabels, operatorLabels, dieselLabels, transportLabels,
  ANY_BRAND_ID, OTHER_BRAND_ID, OTHER_MODEL_ID, CUSTOM_SIZE_ID, SPECIAL_REQ_ID,
} from '@/rental/types';

interface Props {
  prefill?: Partial<RentalRequestDraft>;
  onComplete?: (req: RentalRequest) => void;
  onCancel?: () => void;
}

const steps = [
  { id: 1, labelAr: 'المعدات', labelEn: 'Equipment', icon: Package },
  { id: 2, labelAr: 'الإيجار', labelEn: 'Rental', icon: Calendar },
  { id: 3, labelAr: 'المشروع', labelEn: 'Project', icon: MapPin },
  { id: 4, labelAr: 'المراجعة', labelEn: 'Review', icon: Check },
];

export default function RentalRequestForm({ prefill, onComplete, onCancel }: Props) {
  const { lang, dir } = useApp();
  const { user, company } = useCustomer();
  const { legacySubmitRequest } = useRental();
  const { categories: allCategories, brands: allBrands, models: allModels, loading: catLoading } = useCatalogData();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RentalRequestDraft>(() => ({ ...emptyDraft(), ...prefill }));
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<RentalRequest | null>(null);

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const update = <K extends keyof RentalRequestDraft>(key: K, value: RentalRequestDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateItemAt = (index: number, patch: Partial<RentalRequestItem>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItemAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
    }));
  };

  const validateStep = (s: number): string[] => {
    const errs: string[] = [];
    if (s === 1) {
      form.items.forEach((it, i) => {
        if (!it.categoryId) errs.push(ar ? `معدة ${i + 1}: الفئة مطلوبة` : `Item ${i + 1}: Category is required`);
        if (!it.variantId && !it.variantLabelEn) errs.push(ar ? `معدة ${i + 1}: الحجم/السعة مطلوب` : `Item ${i + 1}: Size/Capacity is required`);
        if (!it.quantity || it.quantity < 1) errs.push(ar ? `معدة ${i + 1}: الكمية يجب أن تكون 1 على الأقل` : `Item ${i + 1}: Quantity must be at least 1`);
      });
    }
    if (s === 2) {
      if (!form.startDate) errs.push(ar ? 'تاريخ البدء مطلوب' : 'Start date is required');
      form.items.forEach((it) => {
        if (isForkliftCategory(it.categoryId) && it.variantLabelEn) {
          const tons = parseForkliftTons(it.variantLabelEn);
          if (tons !== null && tons > 7 && form.operator === 'without_operator') {
            errs.push(ar ? `الرافعات الشوكية فوق 7 أطنان تتطلب مشغلاً` : `Forklifts above 7 tons require an operator`);
          }
        }
      });
    }
    if (s === 3) {
      if (!form.projectName.trim()) errs.push(ar ? 'اسم المشروع/الموقع مطلوب' : 'Project/Site name is required');
      if (!form.region.trim()) errs.push(ar ? 'المنطقة مطلوبة' : 'Region is required');
      if (!form.city.trim()) errs.push(ar ? 'المدينة مطلوبة' : 'City is required');
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
    const errs = validateStep(1).concat(validateStep(2)).concat(validateStep(3));
    if (errs.length > 0) { setErrors(errs); setStep(1); return; }
    if (!user) return;
    const draftWithCompany = { ...form, company };
    const req = legacySubmitRequest(draftWithCompany, user.id, user.fullName);
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
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'عدد المعدات' : 'Items'}</span><span className="text-sm font-semibold text-base-primary">{submitted.items.length}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'تاريخ الطلب' : 'Requested Date'}</span><span className="text-sm font-semibold text-base-primary">{submitted.createdAt}</span></div>
          <div className="flex justify-between"><span className="text-sm text-base-muted">{ar ? 'الحالة' : 'Status'}</span><span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-yellow-accent/10 text-yellow-accent">{ar ? 'جديد' : 'New'}</span></div>
        </div>
        <button onClick={() => onComplete?.(submitted)} className="btn-primary">
          {ar ? 'عرض طلباتي' : 'View My Requests'}
          {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    );
  }

  const operatorMandatory = form.items.some((it) => isOperatorMandatory(it.categoryId, it.variantLabelEn));

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

      {/* Step 1: Equipment (multi-item) */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          {form.items.map((item, idx) => (
            <div key={idx} className="card-industrial p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-yellow-accent flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-accent/10 flex items-center justify-center text-xs">{idx + 1}</span>
                  {ar ? 'معدة' : 'Equipment'} #{idx + 1}
                </h3>
                {form.items.length > 1 && (
                  <button onClick={() => removeItemAt(idx)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Category selector — dynamic from data */}
              <div>
                <label className={labelClass}>{ar ? 'الفئة' : 'Category'}</label>
                <select className={inputClass} value={item.categoryId} onChange={(e) => {
                  const cat = getCategoryById(allCategories, e.target.value);
                  if (cat) updateItemAt(idx, {
                    categoryId: cat.id, categoryNameAr: cat.nameAr, categoryNameEn: cat.nameEn,
                    brandId: '', brandNameAr: '', brandNameEn: '',
                    modelId: '', modelNameAr: '', modelNameEn: '',
                    variantId: '', variantLabelAr: '', variantLabelEn: '',
                  });
                }}>
                  <option value="">{ar ? 'اختر الفئة' : 'Select category'}</option>
                  {allCategories.map((c) => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>)}
                  {catLoading && <option disabled>{ar ? 'جاري التحميل...' : 'Loading...'}</option>}
                </select>
              </div>

              {/* Size/Capacity selector — from sizeClasses, shown when category selected */}
              {item.categoryId && (
                <div>
                  <label className={labelClass}>{ar ? 'الحجم/السعة' : 'Size/Capacity'}</label>
                  <select className={inputClass} value={item.variantId} onChange={(e) => {
                    const val = e.target.value;
                    if (val === CUSTOM_SIZE_ID) {
                      updateItemAt(idx, { variantId: val, variantLabelAr: ar ? 'حجم مخصص' : 'Custom Size', variantLabelEn: 'Custom Size' });
                    } else if (val === SPECIAL_REQ_ID) {
                      updateItemAt(idx, { variantId: val, variantLabelAr: ar ? 'طلب خاص' : 'Special Requirement', variantLabelEn: 'Special Requirement' });
                    } else {
                      const sc = (sizeClasses[item.categoryId] || []).find((s) => s.id === val);
                      if (sc) updateItemAt(idx, { variantId: sc.id, variantLabelAr: sc.labelAr, variantLabelEn: sc.labelEn });
                    }
                  }}>
                    <option value="">{ar ? 'اختر الحجم/السعة' : 'Select size/capacity'}</option>
                    {(sizeClasses[item.categoryId] || []).map((sc) => (
                      <option key={sc.id} value={sc.id}>{ar ? sc.labelAr : sc.labelEn}</option>
                    ))}
                    <option value={CUSTOM_SIZE_ID}>{ar ? 'حجم آخر' : 'Custom Size'}</option>
                    <option value={SPECIAL_REQ_ID}>{ar ? 'طلب خاص' : 'Special Requirement'}</option>
                  </select>
                </div>
              )}

              {/* Brand selector — Any Brand default, optional */}
              {item.categoryId && (
                <div>
                  <label className={labelClass}>{ar ? 'الماركة (اختياري)' : 'Brand (Optional)'}</label>
                  <select className={inputClass} value={item.brandId} onChange={(e) => {
                    const val = e.target.value;
                    if (val === ANY_BRAND_ID) {
                      updateItemAt(idx, { brandId: val, brandNameAr: ar ? 'لا يهمني' : 'Any Brand', brandNameEn: 'Any Brand', modelId: '', modelNameAr: '', modelNameEn: '' });
                    } else if (val === OTHER_BRAND_ID) {
                      updateItemAt(idx, { brandId: val, brandNameAr: ar ? 'علامة أخرى' : 'Other Brand', brandNameEn: 'Other Brand', modelId: '', modelNameAr: '', modelNameEn: '' });
                    } else {
                      const b = getBrandById(allBrands, val);
                      if (b) updateItemAt(idx, { brandId: b.id, brandNameAr: b.nameAr, brandNameEn: b.nameEn, modelId: '', modelNameAr: '', modelNameEn: '' });
                    }
                  }}>
                    <option value={ANY_BRAND_ID}>{ar ? 'لا يهمني — أي علامة' : 'Any Brand'}</option>
                    {getBrandsByCategory(allModels, allBrands, item.categoryId).map((b) => (
                      <option key={b.id} value={b.id}>{ar ? b.nameAr : b.nameEn}</option>
                    ))}
                    <option value={OTHER_BRAND_ID}>{ar ? 'علامة أخرى' : 'Other Brand'}</option>
                  </select>
                </div>
              )}

              {/* Model selector — only when a specific brand is selected */}
              {item.brandId && item.brandId !== ANY_BRAND_ID && item.brandId !== OTHER_BRAND_ID && (
                <div>
                  <label className={labelClass}>{ar ? 'الموديل (اختياري)' : 'Model (Optional)'}</label>
                  <select className={inputClass} value={item.modelId} onChange={(e) => {
                    const val = e.target.value;
                    if (val === OTHER_MODEL_ID) {
                      updateItemAt(idx, { modelId: val, modelNameAr: ar ? 'موديل آخر' : 'Other Model', modelNameEn: 'Other Model' });
                    } else {
                      const m = getModelById(allModels, val);
                      if (m) updateItemAt(idx, { modelId: m.id, modelNameAr: m.nameAr, modelNameEn: m.nameEn });
                    }
                  }}>
                    <option value="">{ar ? '— اختر الموديل —' : '— Select model —'}</option>
                    {getModelsByCategoryAndBrand(allModels, item.categoryId, item.brandId).map((m) => (
                      <option key={m.id} value={m.id}>{ar ? m.nameAr : m.nameEn}</option>
                    ))}
                    <option value={OTHER_MODEL_ID}>{ar ? 'موديل آخر' : 'Other Model'}</option>
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className={labelClass}>{ar ? 'الكمية' : 'Quantity'}</label>
                <input type="number" min={1} className={inputClass} value={item.quantity} onChange={(e) => updateItemAt(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
              </div>
            </div>
          ))}

          {/* Add another equipment */}
          <button onClick={addItem} className="w-full p-4 rounded-lg border-2 border-dashed border-base text-yellow-accent hover:border-yellow-accent/50 transition-colors text-sm font-bold flex items-center justify-center gap-2">
            <Plus size={18} />
            {ar ? '+ إضافة معدة أخرى' : '+ Add Another Equipment'}
          </button>
        </div>
      )}

      {/* Step 2: Rental */}
      {step === 2 && (
        <div className="card-industrial p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-base-primary">{ar ? 'تفاصيل الإيجار' : 'Rental Details'}</h2>
          {/* Duration */}
          <div>
            <label className={labelClass}>{ar ? 'مدة الإيجار' : 'Rental Duration'}</label>
            <div className="flex flex-wrap gap-2">
              {rentalPeriods.map((p) => (
                <button key={p.id} onClick={() => update('duration', p.id as RentalDuration)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.duration === p.id ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted hover:border-yellow-accent/50'
                  }`}>
                  {ar ? p.labelAr : p.labelEn}
                </button>
              ))}
            </div>
          </div>
          {/* Start date */}
          <div>
            <label className={labelClass}>{ar ? 'تاريخ البدء' : 'Start Date'}</label>
            <input type="date" className={inputClass} value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </div>
          {/* Operator */}
          <div>
            <label className={labelClass}>{ar ? 'المشغل' : 'Operator'}</label>
            <div className="flex flex-wrap gap-2">
              {(['with_operator', 'without_operator'] as OperatorChoice[]).map((opt) => {
                const disabled = operatorMandatory && opt === 'without_operator';
                return (
                  <button key={opt} disabled={disabled} onClick={() => update('operator', opt)}
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      form.operator === opt ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted hover:border-yellow-accent/50'
                    }`}>
                    {ar ? operatorLabels[opt].ar : operatorLabels[opt].en}
                    {disabled && <span className="block text-xs text-red-500 mt-0.5">{ar ? 'إلزامي' : 'Mandatory'}</span>}
                  </button>
                );
              })}
            </div>
            {operatorMandatory && (
              <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                {ar ? 'الرافعات الشوكية فوق 7 أطنان تتطلب مشغلاً إلزامياً' : 'Forklifts above 7 tons require a mandatory operator'}
              </p>
            )}
          </div>
          {/* Diesel */}
          <div>
            <label className={labelClass}>{ar ? 'الديزل' : 'Diesel'}</label>
            <div className="flex flex-wrap gap-2">
              {(['customer', 'sahab', 'agreement'] as DieselChoice[]).map((opt) => (
                <button key={opt} onClick={() => update('diesel', opt)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.diesel === opt ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted hover:border-yellow-accent/50'
                  }`}>
                  {ar ? dieselLabels[opt].ar : dieselLabels[opt].en}
                </button>
              ))}
            </div>
          </div>
          {/* Transport */}
          <div>
            <label className={labelClass}>{ar ? 'النقل' : 'Transport'}</label>
            <div className="flex flex-wrap gap-2">
              {(['required', 'not_required', 'agreement'] as TransportChoice[]).map((opt) => (
                <button key={opt} onClick={() => update('transport', opt)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.transport === opt ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent' : 'border-base text-base-muted hover:border-yellow-accent/50'
                  }`}>
                  {ar ? transportLabels[opt].ar : transportLabels[opt].en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Project */}
      {step === 3 && (
        <div className="card-industrial p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-base-primary">{ar ? 'بيانات المشروع' : 'Project Details'}</h2>
          <div>
            <label className={labelClass}>{ar ? 'اسم المشروع/الموقع' : 'Project/Site Name'}</label>
            <input className={inputClass} value={form.projectName} onChange={(e) => update('projectName', e.target.value)} placeholder={ar ? 'مشروع الرياض' : 'Riyadh Project'} />
          </div>
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
            <label className={labelClass}>{ar ? 'موقع المشروع التفصيلي' : 'Site Location'}</label>
            <input className={inputClass} value={form.siteLocation} onChange={(e) => update('siteLocation', e.target.value)} placeholder={ar ? 'الحي الصناعي' : 'Industrial District'} />
          </div>
          <div>
            <label className={labelClass}>{ar ? 'ملاحظات / متطلبات خاصة' : 'Notes / Special Requirements'}</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder={ar ? 'أي ملاحظات أو متطلبات إضافية...' : 'Any additional notes or requirements...'} />
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          {/* Equipment items review */}
          <div className="card-industrial p-6">
            <h2 className="text-lg font-bold text-base-primary mb-4">{ar ? 'مراجعة الطلب' : 'Review Request'}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Package size={14} /> {ar ? 'المعدات' : 'Equipment'} ({form.items.length})</h3>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="p-3 rounded-lg bg-base border border-base text-sm">
                      <div className="font-semibold text-base-primary mb-1">#{i + 1}: {ar ? it.categoryNameAr : it.categoryNameEn}</div>
                      <div className="text-xs text-base-muted space-y-0.5">
                        <div>{ar ? 'الحجم' : 'Size'}: {ar ? it.variantLabelAr : it.variantLabelEn}</div>
                        <div>{ar ? 'الماركة' : 'Brand'}: {ar ? it.brandNameAr : it.brandNameEn}</div>
                        {it.modelNameEn && <div>{ar ? 'الموديل' : 'Model'}: {ar ? it.modelNameAr : it.modelNameEn}</div>}
                        <div>{ar ? 'الكمية' : 'Quantity'}: {it.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-px bg-base" />
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><Calendar size={14} /> {ar ? 'الإيجار' : 'Rental'}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-base-muted">{ar ? 'المدة' : 'Duration'}: </span><span className="font-semibold text-base-primary">{ar ? durationLabels[form.duration].ar : durationLabels[form.duration].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'البدء' : 'Start'}: </span><span className="font-semibold text-base-primary">{form.startDate || '—'}</span></div>
                  <div><span className="text-base-muted">{ar ? 'المشغل' : 'Operator'}: </span><span className="font-semibold text-base-primary">{ar ? operatorLabels[form.operator].ar : operatorLabels[form.operator].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'الديزل' : 'Diesel'}: </span><span className="font-semibold text-base-primary">{ar ? dieselLabels[form.diesel].ar : dieselLabels[form.diesel].en}</span></div>
                  <div><span className="text-base-muted">{ar ? 'النقل' : 'Transport'}: </span><span className="font-semibold text-base-primary">{ar ? transportLabels[form.transport].ar : transportLabels[form.transport].en}</span></div>
                </div>
              </div>
              <div className="h-px bg-base" />
              <div>
                <h3 className="text-xs font-bold text-yellow-accent uppercase mb-2 flex items-center gap-1"><MapPin size={14} /> {ar ? 'المشروع' : 'Project'}</h3>
                <div className="text-sm"><span className="font-semibold text-base-primary">{form.projectName}</span> — {form.region}, {form.city}</div>
                <div className="text-sm text-base-muted">{form.siteLocation}</div>
                {form.notes && <div className="text-sm text-base-muted mt-1">{form.notes}</div>}
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
              {ar ? 'إرسال الطلب' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
