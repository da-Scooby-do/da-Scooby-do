import { useState } from 'react';
import { X, Check, Send, FileText, AlertCircle, Loader2, Truck, Fuel } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getCategoryById, getBrandById, getModelById } from '../catalogApi';
import { rentalPeriods } from '../types';
import { useRental } from '@/rental/RentalContext';
import TermsConsent from '@/components/TermsConsent';
import type { RentalDuration, ResponsibleParty } from '@/rental/types';
import { responsiblePartyLabels } from '@/rental/types';

export default function RentalRequestModal() {
  const { lang, dir } = useApp();
  const { showRequestModal, setShowRequestModal, requestItem, categories, brands, models } = useCatalog();
  const { submitRequest } = useRental();

  const [selectedPeriod, setSelectedPeriod] = useState<RentalDuration>('daily');
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [projectCity, setProjectCity] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [transportBy, setTransportBy] = useState<ResponsibleParty | null>(null);
  const [fuelBy, setFuelBy] = useState<ResponsibleParty | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);

  if (!showRequestModal || !requestItem) return null;

  const category = getCategoryById(categories, requestItem.categoryId);
  const brand = getBrandById(brands, requestItem.brandId);
  const model = getModelById(models, requestItem.modelId);
  const variant = model?.variants.find((v) => v.id === requestItem.variantId);

  if (!category || !brand || !model || !variant) return null;

  const ar = lang === 'ar';

  const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-base border border-base text-base-primary text-sm focus:border-yellow-accent focus:outline-none transition-colors';

  const handleClose = () => {
    setShowRequestModal(false);
    setSubmitted(false);
    setSelectedPeriod('daily');
    setReference('');
    setSubmitting(false);
    setSubmitError(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setProjectCity('');
    setProjectLocation('');
    setNotes('');
    setTransportBy(null);
    setFuelBy(null);
    setAgreed(false);
    setConsentInvalid(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;
    if (!transportBy || !fuelBy) {
      setSubmitError(
        ar
          ? 'يرجى تحديد مسؤولية نقل المعدة والديزل.'
          : 'Please choose who handles transport and diesel.'
      );
      return;
    }
    if (!agreed) {
      setConsentInvalid(true);
      setSubmitError(
        ar
          ? 'يجب الموافقة على الشروط والأحكام وسياسة الخصوصية لإرسال الطلب.'
          : 'Please agree to the Terms & Conditions and Privacy Policy to submit.'
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitRequest({
        equipment_model_id: model.id,
        equipment_variant_id: variant.id,
        equipment_name: `${brand.nameEn} ${model.nameEn} — ${variant.sizeLabelEn}`,
        equipment_name_ar: `${brand.nameAr} ${model.nameAr} — ${variant.sizeLabelAr}`,
        customer_name: fullName,
        company_name: company || undefined,
        phone,
        email: email || undefined,
        rental_period: selectedPeriod,
        project_city: projectCity || undefined,
        project_location: projectLocation || undefined,
        notes: notes || undefined,
        transport_by: transportBy,
        fuel_by: fuelBy,
        terms_accepted: agreed,
      });

      if (result) {
        setReference(result.request_reference);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Rental request submission failed', err);
      setSubmitError(
        ar
          ? 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا هاتفياً.'
          : 'We could not submit your request. Please try again or contact us by phone.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-elevated border-b border-base p-5 lg:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
              <FileText size={20} className="text-yellow-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-primary">
                {ar ? 'طلب تأجير المعدة' : 'Equipment Rental Request'}
              </h2>
              <p className="text-xs text-base-muted">
                {ar ? 'سيتم تحويل بيانات المعدة المختارة تلقائياً' : 'Selected equipment will be transferred automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent hover:border-yellow-accent transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="p-8 lg:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-accent/10 border-2 border-yellow-accent flex items-center justify-center animate-scale-in">
              <Check size={40} className="text-yellow-accent" />
            </div>
            <h3 className="text-2xl font-bold text-base-primary mb-3">
              {ar ? 'تم استلام طلب التأجير' : 'Rental Request Received'}
            </h3>
            <p className="text-base-muted mb-2 max-w-md mx-auto">
              {ar
                ? 'تم استلام طلبك وسيقوم فريق SAHAB بمراجعة الطلب والتواصل معك.'
                : 'Your request has been received. The SAHAB team will review it and contact you.'}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-base border border-base mb-6">
              <span className="text-sm text-base-muted">{ar ? 'رقم الطلب' : 'Request Number'}:</span>
              <span className="text-lg font-black text-yellow-accent font-mono">{reference}</span>
            </div>
            <div className="max-w-md mx-auto mb-6 p-4 rounded-lg bg-yellow-accent/5 border border-yellow-accent/20">
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
            <div>
              <button onClick={handleClose} className="btn-primary">
                {ar ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 lg:p-6">
            {/* Auto-filled equipment info */}
            <div className="card-industrial p-4 mb-6 bg-base">
              <h3 className="text-xs font-bold text-base-muted uppercase tracking-wider mb-3">
                {ar ? 'المعدة المختارة' : 'Selected Equipment'}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-base-muted mb-0.5">{ar ? 'الفئة' : 'Category'}</div>
                  <div className="font-semibold text-base-primary">{ar ? category.nameAr : category.nameEn}</div>
                </div>
                <div>
                  <div className="text-xs text-base-muted mb-0.5">{ar ? 'الماركة' : 'Brand'}</div>
                  <div className="font-semibold text-base-primary">{ar ? brand.nameAr : brand.nameEn}</div>
                </div>
                <div>
                  <div className="text-xs text-base-muted mb-0.5">{ar ? 'الموديل' : 'Model'}</div>
                  <div className="font-semibold text-base-primary">{ar ? model.nameAr : model.nameEn}</div>
                </div>
                <div>
                  <div className="text-xs text-base-muted mb-0.5">{ar ? 'الحجم / السعة' : 'Size / Capacity'}</div>
                  <div className="font-semibold text-yellow-accent">{ar ? variant.sizeLabelAr : variant.sizeLabelEn}</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rental period */}
              <div>
                <label className="block text-sm font-semibold text-base-primary mb-2">
                  {ar ? 'مدة التأجير' : 'Rental Period'} <span className="text-yellow-accent">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {rentalPeriods.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedPeriod(period.id as RentalDuration)}
                      className={`px-3.5 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                        selectedPeriod === period.id
                          ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                          : 'border-base text-base-muted hover:border-yellow-accent/50'
                      }`}
                    >
                      {ar ? period.labelAr : period.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport + diesel responsibility */}
              {([
                { key: 'transport', icon: Truck, labelAr: 'نقل المعدة (التوصيل والإرجاع)', labelEn: 'Equipment transport (delivery & return)', value: transportBy, set: setTransportBy },
                { key: 'fuel', icon: Fuel, labelAr: 'الديزل (الوقود)', labelEn: 'Diesel (fuel)', value: fuelBy, set: setFuelBy },
              ] as const).map((field) => (
                <div key={field.key} role="radiogroup" aria-label={ar ? field.labelAr : field.labelEn}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-base-primary mb-2">
                    <field.icon size={16} className="text-yellow-accent" />
                    {ar ? field.labelAr : field.labelEn} <span className="text-yellow-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['sahab', 'customer'] as const).map((party) => {
                      const active = field.value === party;
                      return (
                        <button
                          key={party}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            field.set(party);
                            setSubmitError(null);
                          }}
                          className={`px-3 py-3 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            active
                              ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                              : 'border-base text-base-muted hover:border-yellow-accent/50'
                          }`}
                        >
                          {active && <Check size={15} />}
                          {ar ? responsiblePartyLabels[party].ar : responsiblePartyLabels[party].en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-base-primary mb-2">
                    {ar ? 'الاسم الكامل' : 'Full Name'} <span className="text-yellow-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    placeholder={ar ? 'اسمك الكامل' : 'Your full name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-base-primary mb-2">
                    {ar ? 'رقم الجوال' : 'Phone'} <span className="text-yellow-accent">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    className={inputClass}
                    placeholder="+966 5X XXX XXXX"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Email + Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-base-primary mb-2">
                    {ar ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="email@example.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-base-primary mb-2">
                    {ar ? 'اسم الشركة' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={ar ? 'اسم الشركة' : 'Company name'}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              {/* Project city */}
              <div>
                <label className="block text-sm font-semibold text-base-primary mb-2">
                  {ar ? 'المدينة / موقع المشروع' : 'Project City / Location'}
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={ar ? 'مدينة / منطقة المشروع' : 'Project city / region'}
                  value={projectCity}
                  onChange={(e) => setProjectCity(e.target.value)}
                />
              </div>

              {/* Project location detail */}
              <div>
                <label className="block text-sm font-semibold text-base-primary mb-2">
                  {ar ? 'موقع المشروع التفصيلي' : 'Detailed Project Location'}
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={ar ? 'الحي / المنطقة الصناعية' : 'District / Industrial area'}
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-base-primary mb-2">
                  {ar ? 'ملاحظات إضافية' : 'Additional Notes'}
                </label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder={ar ? 'أي تفاصيل إضافية حول احتياجك...' : 'Any additional details about your needs...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Terms consent */}
              <TermsConsent
                checked={agreed}
                onChange={(v) => {
                  setAgreed(v);
                  if (v) {
                    setConsentInvalid(false);
                    setSubmitError(null);
                  }
                }}
                lang={lang}
                invalid={consentInvalid}
              />

              {/* Error */}
              {submitError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center group">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {ar ? 'جاري الإرسال...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {ar ? 'إرسال الطلب' : 'Submit Request'}
                  </>
                )}
              </button>

              <p className="text-xs text-base-muted text-center">
                {ar
                  ? 'سيتم تحويل بيانات المعدة المختارة تلقائياً مع طلبك.'
                  : 'Selected equipment details will be automatically included with your request.'}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
