import { useState } from 'react';
import { Building2, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { COMPANY_FIELDS, REQUIRED_COMPANY_FIELDS, missingCompanyFields } from '@/lib/customerProfile';
import type { CompanyProfile } from '../types';

/** First-time step after creating an account: the company profile is required before using the portal. */
export default function CompanyOnboarding({ pendingLabel }: { pendingLabel?: string }) {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';
  const { company, updateCompany, logout } = useCustomer();
  const [form, setForm] = useState<CompanyProfile>(company);
  const [invalid, setInvalid] = useState<(keyof CompanyProfile)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingCompanyFields(form);
    setInvalid(missing);
    if (missing.length) {
      setError(ar ? 'أكمل الحقول المطلوبة المعلّمة بـ *' : 'Fill in the required fields marked *');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCompany(form);
    } catch (err) {
      console.error('Saving company profile failed', err);
      setError(ar ? 'تعذر حفظ بيانات الشركة، حاول مرة أخرى' : 'Could not save the company profile, please try again');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 py-10" dir={dir}>
      <form onSubmit={submit} className="w-full max-w-2xl card-industrial p-6 lg:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-accent/10 border border-yellow-accent/30 flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-yellow-accent" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-base-primary">{ar ? 'أنشئ ملف شركتك' : 'Create your company profile'}</h1>
            <p className="text-sm text-base-muted mt-1">
              {ar ? 'مطلوب مرة واحدة قبل إرسال الطلبات، ويُستخدم في عروض الأسعار والعقود.' : 'Required once before sending requests; used on quotations and contracts.'}
            </p>
          </div>
        </div>
        {pendingLabel && (
          <div className="p-3 rounded-lg border border-yellow-accent/30 bg-yellow-accent/5 text-sm text-base-primary">
            {ar ? 'طلبك المحفوظ سيُرسل تلقائياً بعد الحفظ: ' : 'Your saved request will be sent after saving: '}
            <span className="font-bold text-yellow-accent">{pendingLabel}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-500">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMPANY_FIELDS.map((f) => {
            const required = REQUIRED_COMPANY_FIELDS.includes(f.key);
            const bad = invalid.includes(f.key) && !form[f.key].trim();
            return (
              <div key={f.key} className={f.key === 'companyName' || f.key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-base-muted mb-1.5">{ar ? f.labelAr : f.labelEn}{required && ' *'}</label>
                <input
                  className={`${input} ${bad ? 'border-red-500/70' : ''}`}
                  dir={f.ltr ? 'ltr' : undefined}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((c) => ({ ...c, [f.key]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
          <button type="button" onClick={logout} className="btn-secondary justify-center text-sm">
            <LogOut size={16} /> {ar ? 'تسجيل الخروج' : 'Sign out'}
          </button>
          <button type="submit" disabled={saving} className="btn-primary justify-center disabled:opacity-60">
            {saving && <Loader2 size={18} className="animate-spin" />}
            {ar ? 'حفظ والمتابعة' : 'Save & continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
