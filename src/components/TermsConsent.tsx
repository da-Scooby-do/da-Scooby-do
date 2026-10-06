import { Check } from 'lucide-react';

interface TermsConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  lang: 'ar' | 'en';
  /** Highlight the box when the user tried to submit without agreeing. */
  invalid?: boolean;
}

/** Required agreement to the terms & conditions and privacy policy on request forms. */
export default function TermsConsent({ checked, onChange, lang, invalid }: TermsConsentProps) {
  const ar = lang === 'ar';
  const link = 'text-yellow-accent font-semibold underline underline-offset-2 hover:opacity-80';
  return (
    <label
      className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-colors ${
        invalid && !checked ? 'border-red-500/60 bg-red-500/5' : checked ? 'border-yellow-accent/50 bg-yellow-accent/5' : 'border-base'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid && !checked ? true : undefined}
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-accent ${
          checked ? 'bg-yellow-accent border-yellow-accent text-black' : 'border-base-muted/60'
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="text-sm text-base-muted leading-relaxed">
        {ar ? 'أقر بأنني اطلعت ووافقت على ' : 'I have read and agree to the '}
        <a href="#/legal/terms" target="_blank" rel="noopener noreferrer" className={link} onClick={(e) => e.stopPropagation()}>
          {ar ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </a>
        {ar ? ' و' : ' and the '}
        <a href="#/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={link} onClick={(e) => e.stopPropagation()}>
          {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </a>
        {ar ? ' الخاصة بشركة سحاب.' : ' of SAHAB.'} <span className="text-yellow-accent">*</span>
      </span>
    </label>
  );
}
