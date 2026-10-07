import { useState } from 'react';
import { Building2, Pencil, Save, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import type { CompanyProfile } from '../types';
import { missingCompanyFields } from '@/lib/customerProfile';

export default function CompanyProfilePage() {
  const { lang } = useApp();
  const { company, updateCompany } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyProfile>(company);

  const [saveError, setSaveError] = useState<string | null>(null);
  const save = async () => {
    const missing = missingCompanyFields(form);
    if (missing.length) {
      setSaveError(lang === 'ar' ? 'أكمل الحقول المطلوبة: اسم الشركة، السجل التجاري، هاتف الشركة، المدينة، الشخص المسؤول' : 'Fill in the required fields: company name, CR, company phone, city, contact person');
      return;
    }
    try {
      await updateCompany(form);
      setSaveError(null);
      setEditing(false);
    } catch {
      setSaveError(lang === 'ar' ? 'تعذر الحفظ، حاول مرة أخرى' : 'Could not save, please try again');
    }
  };
  const cancel = () => {
    setForm(company);
    setEditing(false);
  };

  const update = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  const fields: { key: keyof CompanyProfile; labelAr: string; labelEn: string; placeholder?: string }[] = [
    { key: 'companyName', labelAr: 'اسم الشركة', labelEn: 'Company Name', placeholder: 'شركة سحاب للمقاولات' },
    { key: 'commercialRegistration', labelAr: 'السجل التجاري', labelEn: 'Commercial Registration', placeholder: '1010xxxxxx' },
    { key: 'nationalUnifiedNumber', labelAr: 'الرقم الوطني الموحد', labelEn: 'National Unified Number', placeholder: '1000xxxxxx' },
    { key: 'vatNumber', labelAr: 'الرقم الضريبي', labelEn: 'VAT Number', placeholder: '3000xxxxxx' },
    { key: 'companyPhone', labelAr: 'هاتف الشركة', labelEn: 'Company Phone', placeholder: '+9661xxxxxxx' },
    { key: 'officialEmail', labelAr: 'البريد الرسمي', labelEn: 'Official Email', placeholder: 'info@company.com' },
    { key: 'region', labelAr: 'المنطقة', labelEn: 'Region', placeholder: lang === 'ar' ? 'الرياض' : 'Riyadh' },
    { key: 'city', labelAr: 'المدينة', labelEn: 'City', placeholder: lang === 'ar' ? 'الرياض' : 'Riyadh' },
    { key: 'address', labelAr: 'العنوان', labelEn: 'Address', placeholder: '...' },
    { key: 'contactPerson', labelAr: 'الشخص المسؤول', labelEn: 'Contact Person', placeholder: '...' },
    { key: 'jobTitle', labelAr: 'المسمى الوظيفي', labelEn: 'Job Title', placeholder: lang === 'ar' ? 'مدير' : 'Manager' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
            <Building2 size={28} className="text-yellow-accent" />
            {lang === 'ar' ? 'بيانات الشركة' : 'Company Profile'}
          </h1>
          <p className="text-base-muted text-sm">{lang === 'ar' ? 'معلومات شركتك الرسمية' : 'Your company official information'}</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
            <Pencil size={16} />
            {lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancel} className="btn-secondary text-sm">
              <X size={16} />
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={save} className="btn-primary text-sm">
              <Save size={16} />
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {saveError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">{saveError}</div>}
      <div className="card-industrial p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{lang === 'ar' ? field.labelAr : field.labelEn}</label>
              {editing ? (
                <input
                  className={inputClass}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : (
                <div className="px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary min-h-[42px] flex items-center">
                  {company[field.key] || <span className="text-base-muted">—</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
