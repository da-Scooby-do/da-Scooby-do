import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from './CustomerContext';
import AuthPages from './components/AuthPages';
import CompanyOnboarding from './components/CompanyOnboarding';
import CustomerRouter from './CustomerRouter';
import { clearPendingRequest, loadPendingRequest } from '@/lib/pendingRequest';
import { submitPublicRequest } from '@/lib/publicRequests';

export default function CustomerApp() {
  const { lang } = useApp();
  const { isAuthenticated, authLoading, hasCompany, user, setView } = useCustomer();
  const [pending] = useState(loadPendingRequest);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const sending = useRef(false);

  // A request filled in before signing in (e.g. while confirming the email) is sent
  // once the customer is signed in with a company profile.
  useEffect(() => {
    const p = loadPendingRequest();
    if (!p || !user?.email || hasCompany !== true || sending.current) return;
    sending.current = true;
    submitPublicRequest(p.table, { ...p.row, email: user.email })
      .then((row) => {
        clearPendingRequest();
        setSentRef(row.request_reference || '—');
        setView(p.table === 'rental_requests' ? 'rental-requests' : 'project-requests');
      })
      .catch((err) => {
        console.error('Sending saved request failed', err);
        setSendError(lang === 'ar' ? 'تعذر إرسال طلبك المحفوظ. أعد إرساله من صفحة المعدة أو الخدمة.' : 'Your saved request could not be sent. Please send it again from the equipment or service page.');
        clearPendingRequest();
      });
  }, [user?.email, hasCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || (isAuthenticated && hasCompany === null)) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPages pendingLabel={pending?.label} />;
  }

  if (hasCompany === false) {
    return <CompanyOnboarding pendingLabel={pending?.label} />;
  }

  return (
    <>
      {(sentRef || sendError) && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:end-4 z-[150] max-w-md mx-auto sm:mx-0 animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl bg-elevated ${sentRef ? 'border-green-500/40' : 'border-red-500/40'}`}>
            {sentRef && <CheckCircle2 size={22} className="text-green-500 shrink-0" />}
            <div className="text-sm flex-1">
              {sentRef ? (
                <>
                  <div className="font-bold text-base-primary">{lang === 'ar' ? 'تم إرسال طلبك' : 'Your request was sent'}</div>
                  <div className="text-base-muted">{lang === 'ar' ? 'رقم الطلب: ' : 'Reference: '}<span className="font-mono text-yellow-accent">{sentRef}</span></div>
                </>
              ) : (
                <div className="text-red-500">{sendError}</div>
              )}
            </div>
            <button onClick={() => { setSentRef(null); setSendError(null); }} className="text-base-muted hover:text-yellow-accent" aria-label="close">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <CustomerRouter />
    </>
  );
}
