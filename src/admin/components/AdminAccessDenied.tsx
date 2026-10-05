import { useState } from 'react';
import { ShieldX, LogOut, ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '../EmployeeContext';

/** Shown when a signed-in account has no active staff profile. */
export default function AdminAccessDenied() {
  const { lang, dir } = useApp();
  const { session, signOut } = useEmployee();
  const ar = lang === 'ar';
  const [signingOut, setSigningOut] = useState(false);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md card-industrial p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <ShieldX size={30} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-base-primary">{ar ? 'لا تملك صلاحية الدخول' : 'Access denied'}</h1>
          <p className="text-sm text-base-muted mt-2 leading-relaxed">
            {ar
              ? 'هذا الحساب ليس حساب موظف مفعّل، لذلك لا يمكنه فتح لوحة التحكم.'
              : 'This account is not an active staff account, so it cannot open the admin dashboard.'}
          </p>
          {session?.user.email && (
            <p className="text-xs text-base-muted mt-3" dir="ltr">{session.user.email}</p>
          )}
        </div>
        <button
          type="button"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            await signOut();
          }}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          <LogOut size={18} />
          {ar ? 'تسجيل الخروج والدخول بحساب آخر' : 'Sign out and use another account'}
        </button>
        <a href="#home" className="inline-flex items-center gap-1.5 text-sm text-base-muted hover:text-yellow-accent">
          <ArrowLeft size={15} className={dir === 'rtl' ? 'rotate-180' : ''} />
          {ar ? 'العودة للموقع' : 'Back to site'}
        </a>
      </div>
    </div>
  );
}
