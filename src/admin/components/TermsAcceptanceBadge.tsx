import { ShieldCheck, ShieldQuestion } from 'lucide-react';

interface Props {
  accepted?: boolean | null;
  acceptedAt?: string | null;
  lang: 'ar' | 'en';
}

/** Shows whether (and when) the customer agreed to the terms & privacy policy. */
export default function TermsAcceptanceBadge({ accepted, acceptedAt, lang }: Props) {
  const ar = lang === 'ar';
  if (accepted && acceptedAt) {
    const when = new Date(acceptedAt).toLocaleString(ar ? 'ar-SA' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm">
        <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-green-500">
            {ar ? 'وافق العميل على الشروط والأحكام وسياسة الخصوصية' : 'Customer agreed to the Terms & Conditions and Privacy Policy'}
          </div>
          <div className="text-xs text-base-muted mt-0.5">{ar ? `بتاريخ ${when}` : `on ${when}`}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-base bg-base text-sm text-base-muted">
      <ShieldQuestion size={18} className="shrink-0" />
      {ar ? 'لا توجد موافقة مسجلة على الشروط (طلب قديم أو أُنشئ من لوحة التحكم)' : 'No recorded terms agreement (older request or created by staff)'}
    </div>
  );
}
