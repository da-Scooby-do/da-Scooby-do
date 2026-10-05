import { Save, CheckCircle, Bell, Package, FileText, PenTool, Truck, HardHat, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/admin/NotificationContext';
import { preferenceLabels, type PreferenceKey } from '@/admin/notification-types';

const iconForPref: Record<PreferenceKey, typeof Bell> = {
  requests: Package,
  quotations: FileText,
  contracts: PenTool,
  deliveries: Truck,
  projects: HardHat,
  equipment: Wrench,
};

export default function NotificationSettingsPage() {
  const { lang } = useApp();
  const { preferences, updatePreferences } = useNotification();
  const [local, setLocal] = useState(preferences);
  const [saved, setSaved] = useState(false);
  const ar = lang === 'ar';

  const keys: PreferenceKey[] = ['requests', 'quotations', 'contracts', 'deliveries', 'projects', 'equipment'];

  const handleSave = () => {
    updatePreferences(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggle = (key: PreferenceKey) => setLocal((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-base-primary flex items-center gap-2">
          <Bell size={20} className="text-yellow-accent" />
          {ar ? 'إعدادات الإشعارات' : 'Notification Settings'}
        </h2>
        <p className="text-sm text-base-muted mt-1">{ar ? 'تحكم في أنواع الإشعارات التي تستقبلها داخل التطبيق' : 'Control which in-app notifications you receive'}</p>
      </div>

      <div className="card-industrial p-5 space-y-3">
        {keys.map((key) => {
          const Icon = iconForPref[key];
          const enabled = local[key];
          return (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-base border border-base">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Icon size={16} className="text-base-muted" />
                </div>
                <span className="text-sm font-semibold text-base-primary">{ar ? preferenceLabels[key].ar : preferenceLabels[key].en}</span>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-yellow-accent' : 'bg-base-muted/30'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${enabled ? 'ltr:left-6 rtl:right-6' : 'ltr:left-0.5 rtl:right-0.5'}`} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">
          <Save size={16} />
          {ar ? 'حفظ' : 'Save'}
        </button>
        {saved && (
          <span className="text-sm text-green-500 flex items-center gap-1 animate-fade-in">
            <CheckCircle size={14} />
            {ar ? 'تم الحفظ' : 'Saved'}
          </span>
        )}
      </div>
    </div>
  );
}
