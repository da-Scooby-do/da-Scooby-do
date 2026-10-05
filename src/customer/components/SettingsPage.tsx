import { useState } from 'react';
import { Settings, User, Mail, Phone, Lock, Eye, EyeOff, Save, CheckCircle, Bell, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { supabase } from '@/lib/supabase';
import NotificationSettingsPage from '@/admin/components/NotificationSettingsPage';

export default function SettingsPage() {
  const { lang } = useApp();
  const { user, updateUser } = useCustomer();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const inputClass = 'w-full ps-10 pe-4 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';
  const ar = lang === 'ar';

  const saveProfile = async () => {
    setProfileError(null);
    setSavingProfile(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, mobile },
      });
      if (updateError) throw updateError;
      updateUser({ fullName, mobile });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile', err);
      setProfileError(ar ? 'فشل حفظ البيانات' : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(ar ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 3000);
    } catch (err: any) {
      console.error('Failed to update password', err);
      setPasswordError(ar ? 'فشل تحديث كلمة المرور' : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1 flex items-center gap-2">
          <Settings size={28} className="text-yellow-accent" />
          {ar ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-base-muted text-sm">{ar ? 'إدارة معلوماتك الشخصية' : 'Manage your personal information'}</p>
      </div>

      {/* Profile info */}
      <div className="card-industrial p-6">
        <h2 className="text-lg font-bold text-base-primary mb-4 flex items-center gap-2">
          <User size={20} className="text-yellow-accent" />
          {ar ? 'المعلومات الشخصية' : 'Personal Information'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{ar ? 'الاسم' : 'Name'}</label>
            <div className="relative">
              <User size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'رقم الجوال' : 'Mobile'}</label>
            <div className="relative">
              <Phone size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>{ar ? 'البريد الإلكتروني' : 'Email'}</label>
            <div className="relative">
              <Mail size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input className={inputClass} value={email} disabled dir="ltr" />
            </div>
            <p className="text-xs text-base-muted mt-1">{ar ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}</p>
          </div>
        </div>
        {profileError && (
          <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
            <AlertCircle size={14} />
            {profileError}
          </div>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary text-sm">
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {ar ? 'حفظ' : 'Save'}
          </button>
          {savedProfile && (
            <span className="text-sm text-green-500 flex items-center gap-1 animate-fade-in">
              <CheckCircle size={14} />
              {ar ? 'تم الحفظ' : 'Saved'}
            </span>
          )}
        </div>
      </div>

      {/* Password change */}
      <div className="card-industrial p-6">
        <h2 className="text-lg font-bold text-base-primary mb-4 flex items-center gap-2">
          <Lock size={20} className="text-yellow-accent" />
          {ar ? 'تغيير كلمة المرور' : 'Change Password'}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>{ar ? 'كلمة المرور الحالية' : 'Current Password'}</label>
            <div className="relative">
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input type={showCurrent ? 'text' : 'password'} className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'كلمة المرور الجديدة' : 'New Password'}</label>
            <div className="relative">
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input type={showNew ? 'text' : 'password'} className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>{ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
            <div className="relative">
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
              <input type={showConfirm ? 'text' : 'password'} className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-base-muted hover:text-yellow-accent">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        {passwordError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm mt-3">{passwordError}</div>}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={savePassword} disabled={savingPassword} className="btn-primary text-sm">
            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {ar ? 'تحديث كلمة المرور' : 'Update Password'}
          </button>
          {savedPassword && (
            <span className="text-sm text-green-500 flex items-center gap-1 animate-fade-in">
              <CheckCircle size={14} />
              {ar ? 'تم التحديث' : 'Updated'}
            </span>
          )}
        </div>
      </div>

      {/* Notification settings */}
      <div className="card-industrial p-6">
        <NotificationSettingsPage />
      </div>
    </div>
  );
}
