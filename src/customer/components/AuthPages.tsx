import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { supabase } from '@/lib/supabase';
import type { AuthView } from '../types';

export default function AuthPages({ initialView = 'login' }: { initialView?: AuthView }) {
  const { lang, dir } = useApp();
  const { login, register } = useCustomer();
  const [view, setView] = useState<AuthView>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember, setRemember] = useState(false);

  // Register state
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '#/account' },
      });
    } catch (e: any) {
      console.error('Google sign-in failed', e);
      setError(lang === 'ar' ? 'تعذر تسجيل الدخول بحساب Google' : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = await login(loginEmail, password);
    if (err) setError(err);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة / Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('يجب الموافقة على الشروط والأحكام / You must accept terms and conditions');
      return;
    }
    const err = await register({ fullName, mobile, email, password });
    if (err) setError(err);
  };

  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('بريد إلكتروني غير صالح / Invalid email');
      return;
    }
    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: window.location.origin + '#/account' }
      );
      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(lang === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again');
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = 'w-full ps-10 pe-4 py-3 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4" dir={dir}>
      {/* Background pattern */}
      <div className="absolute inset-0 industrial-pattern opacity-30" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="#home" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-yellow-accent rounded-lg flex items-center justify-center font-black text-black text-2xl">S</div>
            <div className="text-start">
              <div className="text-2xl font-black text-base-primary">SAHAB</div>
              <div className="text-xs text-base-muted">{lang === 'ar' ? 'معدات ومقاولات' : 'EQUIPMENT & CONTRACTING'}</div>
            </div>
          </a>
        </div>

        <div className="card-industrial p-6 lg:p-8 animate-scale-in">
          {/* LOGIN */}
          {view === 'login' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'مرحباً بعودتك إلى حسابك' : 'Welcome back to your account'}</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type="email" className={inputClass} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={lang === 'ar' ? 'name@example.com' : 'name@example.com'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showPassword ? 'text' : 'password'} className={inputClass} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                    <span className="text-sm text-base-muted">{lang === 'ar' ? 'تذكرني' : 'Remember me'}</span>
                  </label>
                  <button type="button" onClick={() => setView('forgot')} className="text-sm text-yellow-accent hover:underline">
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}

                <button type="submit" className="btn-primary w-full justify-center">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </form>

              {/* Google Sign-In */}
              <div className="relative mt-6 pt-6 border-t border-base">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 bg-card text-xs text-base-muted">
                  {lang === 'ar' ? 'أو' : 'or'}
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-base bg-base hover:bg-elevated transition-colors text-sm font-semibold text-base-primary disabled:opacity-50"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-base-muted border-t-yellow-accent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {lang === 'ar' ? 'المتابعة مع Google' : 'Continue with Google'}
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-base-muted">{lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}</p>
                <button onClick={() => { setView('register'); setError(null); }} className="btn-secondary mt-3 w-full justify-center">
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                </button>
              </div>
            </>
          )}

          {/* REGISTER */}
          {view === 'register' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'انضم إلى سحاب لتأجير المعدات والمقاولات' : 'Join SAHAB for equipment rental and contracting'}</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <User size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={lang === 'ar' ? 'محمد عبدالله' : 'John Doe'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'رقم الجوال' : 'Mobile'}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+966500000000" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showPassword ? 'text' : 'password'} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                    <input type={showConfirm ? 'text' : 'password'} className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 accent-yellow-accent mt-0.5" />
                  <span className="text-sm text-base-muted">
                    {lang === 'ar' ? 'أوافق على الشروط والأحكام وسياسة الخصوصية' : 'I agree to the Terms & Conditions and Privacy Policy'}
                  </span>
                </label>

                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}

                <button type="submit" className="btn-primary w-full justify-center">
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                  {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-base">
                <p className="text-sm text-base-muted">{lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}</p>
                <button onClick={() => { setView('login'); setError(null); }} className="btn-secondary mt-3 w-full justify-center">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </button>
              </div>
            </>
          )}

          {/* FORGOT */}
          {view === 'forgot' && (
            <>
              <h1 className="text-2xl font-black text-base-primary mb-1">{lang === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password'}</h1>
              <p className="text-sm text-base-muted mb-6">{lang === 'ar' ? 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور' : 'Enter your email to reset your password'}</p>

              {forgotSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <p className="text-sm text-base-primary font-semibold">{lang === 'ar' ? 'تم إرسال تعليمات الاستعادة' : 'Reset instructions sent'}</p>
                  <p className="text-xs text-base-muted">{lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</p>
                  <button onClick={() => { setView('login'); setForgotSent(false); }} className="btn-secondary w-full justify-center">
                    {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className={labelClass}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
                      <input type="email" className={inputClass} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="name@example.com" />
                    </div>
                  </div>
                  {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full justify-center">
                    {forgotLoading
                      ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                      : (lang === 'ar' ? 'إرسال' : 'Send')}
                  </button>
                  <button type="button" onClick={() => setView('login')} className="btn-secondary w-full justify-center">
                    {lang === 'ar' ? 'العودة' : 'Back'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="#home" className="text-sm text-base-muted hover:text-yellow-accent transition-colors">
            {lang === 'ar' ? 'العودة للموقع' : 'Back to site'}
          </a>
        </div>
      </div>
    </div>
  );
}
