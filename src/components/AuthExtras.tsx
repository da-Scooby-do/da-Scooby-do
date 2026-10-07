import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { isGoogleSignInEnabled, signInWithGoogle } from '@/lib/authRedirect';

/** Password field with a show/hide (eye) button. */
export function PasswordInput({
  value,
  onChange,
  className,
  autoComplete,
  id,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  autoComplete: 'current-password' | 'new-password';
  id?: string;
  placeholder?: string;
}) {
  const { lang } = useApp();
  const [show, setShow] = useState(false);
  return (
    <div className="relative" dir="ltr">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        dir="ltr"
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${className} pr-11`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-base-muted hover:text-yellow-accent"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * "Continue with Google". Shown only when Google sign-in is switched on in
 * Supabase, so visitors never hit a "provider is not enabled" error page.
 * `beforeRedirect` runs first (e.g. to keep the pending request on the device).
 */
export function GoogleSignInButton({ beforeRedirect, onError }: { beforeRedirect?: () => void; onError?: (msg: string) => void }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    isGoogleSignInEnabled().then((v) => alive && setEnabled(v));
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled) return null;

  const go = async () => {
    setBusy(true);
    beforeRedirect?.();
    const err = await signInWithGoogle();
    if (err) {
      setBusy(false);
      onError?.(ar ? 'تعذر الاتصال بـ Google، حاول مرة أخرى.' : 'Could not reach Google, please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border border-base bg-white text-gray-800 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleLogo />}
        {ar ? 'المتابعة باستخدام Google' : 'Continue with Google'}
      </button>
      <div className="flex items-center gap-3 text-xs text-base-muted">
        <span className="flex-1 h-px bg-base-muted/20" />
        {ar ? 'أو بالبريد الإلكتروني' : 'or with email'}
        <span className="flex-1 h-px bg-base-muted/20" />
      </div>
    </div>
  );
}
