import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { CustomerUser, CompanyProfile, CustomerView } from './types';
import { emptyCompanyProfile } from './types';

interface CustomerContextValue {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: { fullName: string; mobile: string; email: string; password: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  updateUser: (u: Partial<CustomerUser>) => void;
  company: CompanyProfile;
  updateCompany: (c: CompanyProfile) => void;
  view: CustomerView;
  setView: (v: CustomerView) => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile>(emptyCompanyProfile());
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

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!email.trim()) return 'البريد الإلكتروني مطلوب / Email is required';
    if (!password) return 'كلمة المرور مطلوبة / Password is required';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, mobile: data.mobile },
      },
    });
    if (error) {
      // Never surface the provider message: it distinguishes existing accounts from new ones.
      console.error('Registration failed', error);
      return 'تعذر إنشاء الحساب. تحقق من البيانات أو حاول لاحقاً / Could not create the account. Please check your details or try again later';
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('overview');
  }, []);

  const updateUser = useCallback((u: Partial<CustomerUser>) => {
    setUser((prev) => (prev ? { ...prev, ...u } : prev));
  }, []);

  const updateCompany = useCallback((c: CompanyProfile) => setCompany(c), []);

  return (
    <CustomerContext.Provider
      value={{
        user, isAuthenticated: !!user, authLoading,
        login, register, logout, updateUser,
        company, updateCompany, view, setView,
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
