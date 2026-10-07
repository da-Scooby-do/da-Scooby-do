import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { authReturnUrl, isEmailNotConfirmed } from '@/lib/authRedirect';
import type { CustomerUser, CompanyProfile, CustomerView } from './types';
import { emptyCompanyProfile } from './types';
import { loadCompanyProfile, saveCompanyProfile } from '@/lib/customerProfile';

interface CustomerContextValue {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  /** Resolves to an error message, 'CONFIRM_EMAIL' when the account must be confirmed from the inbox, or null when signed in. */
  register: (data: { fullName: string; mobile: string; email: string; password: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  updateUser: (u: Partial<CustomerUser>) => void;
  company: CompanyProfile;
  /** null while loading; false when the customer has not created a company profile yet. */
  hasCompany: boolean | null;
  updateCompany: (c: CompanyProfile) => Promise<void>;
  view: CustomerView;
  setView: (v: CustomerView) => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile>(emptyCompanyProfile());
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [view, setView] = useState<CustomerView>('overview');

  // Restore session on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setUser({
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name || '',
            mobile: session.user.user_metadata?.mobile || '',
            email: session.user.email || '',
            createdAt: session.user.created_at?.split('T')[0] || '',
          });
          setCompany((prev) => ({
            ...prev,
            contactPerson: session.user.user_metadata?.full_name || '',
            officialEmail: session.user.email || '',
            companyPhone: session.user.user_metadata?.mobile || '',
          }));
        }
      } catch {
        // Session restore failed — stay logged out
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({
          id: session.user.id,
          fullName: session.user.user_metadata?.full_name || '',
          mobile: session.user.user_metadata?.mobile || '',
          email: session.user.email || '',
          createdAt: session.user.created_at?.split('T')[0] || '',
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Load the saved company profile whenever the signed-in customer changes.
  useEffect(() => {
    if (!user) {
      setHasCompany(null);
      return;
    }
    let cancelled = false;
    setHasCompany(null);
    loadCompanyProfile(user.id)
      .then((p) => {
        if (cancelled) return;
        if (p) setCompany(p);
        else setCompany((prev) => ({ ...prev, contactPerson: prev.contactPerson || user.fullName, companyPhone: prev.companyPhone || user.mobile, officialEmail: prev.officialEmail || user.email }));
        setHasCompany(!!p);
      })
      .catch(() => !cancelled && setHasCompany(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!email.trim()) return 'البريد الإلكتروني مطلوب / Email is required';
    if (!password) return 'كلمة المرور مطلوبة / Password is required';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (isEmailNotConfirmed(error)) return 'EMAIL_NOT_CONFIRMED';
    if (error) {
      console.error('Sign-in failed', error);
      return 'بيانات الدخول غير صحيحة / Invalid email or password';
    }
    return null;
  }, []);

  const register = useCallback(async (data: { fullName: string; mobile: string; email: string; password: string }): Promise<string | null> => {
    if (!data.fullName.trim()) return 'الاسم الكامل مطلوب / Full name is required';
    if (!data.mobile.trim()) return 'رقم الجوال مطلوب / Mobile is required';
    if (!data.email.trim()) return 'البريد الإلكتروني مطلوب / Email is required';
    if (!data.email.includes('@')) return 'بريد إلكتروني غير صالح / Invalid email';
    if (data.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل / Password must be at least 6 characters';

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, mobile: data.mobile },
        emailRedirectTo: authReturnUrl('verified'),
      },
    });
    if (error) {
      // Never surface the provider message: it distinguishes existing accounts from new ones.
      console.error('Registration failed', error);
      return 'تعذر إنشاء الحساب. تحقق من البيانات أو حاول لاحقاً / Could not create the account. Please check your details or try again later';
    }
    return signUpData.session ? null : 'CONFIRM_EMAIL';
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('overview');
  }, []);

  const updateUser = useCallback((u: Partial<CustomerUser>) => {
    setUser((prev) => (prev ? { ...prev, ...u } : prev));
  }, []);

  const updateCompany = useCallback(async (c: CompanyProfile) => {
    if (!user) return;
    await saveCompanyProfile(user.id, c);
    setCompany(c);
    setHasCompany(true);
  }, [user]);

  return (
    <CustomerContext.Provider
      value={{
        user, isAuthenticated: !!user, authLoading,
        login, register, logout, updateUser,
        company, hasCompany, updateCompany, view, setView,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
