import { Package, HardHat, FileText, PenTool, Bell } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';

export default function AccountOverview() {
  const { lang } = useApp();
  const { user, company, setView } = useCustomer();

  const stats = [
    { labelAr: 'طلبات التأجير', labelEn: 'Rental Requests', icon: Package, color: 'text-yellow-accent', onClick: () => setView('rental-requests') },
    { labelAr: 'طلبات المشاريع', labelEn: 'Project Requests', icon: HardHat, color: 'text-blue-500', onClick: () => setView('project-requests') },
    { labelAr: 'عروض الأسعار', labelEn: 'Quotations', icon: FileText, color: 'text-green-500', onClick: () => setView('quotations') },
    { labelAr: 'العقود', labelEn: 'Contracts', icon: PenTool, color: 'text-purple-500', onClick: () => setView('contracts') },
    { labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell, color: 'text-orange-500', onClick: () => setView('notifications') },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">
          {lang === 'ar' ? `مرحباً، ${user?.fullName || ''}` : `Welcome, ${user?.fullName || ''}`}
        </h1>
        <p className="text-base-muted text-sm">{lang === 'ar' ? 'نظرة عامة على حسابك ونشاطك' : 'Overview of your account and activity'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button key={i} onClick={stat.onClick} className="card-industrial p-5 text-start hover-lift">
              <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <Icon size={20} className={stat.color} />
              </div>
              <div className="text-xs text-base-muted mt-1">{lang === 'ar' ? stat.labelAr : stat.labelEn}</div>
            </button>
          );
        })}
      </div>

      {/* Company info summary */}
      <div className="card-industrial p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-base-primary flex items-center gap-2">
            <HardHat size={20} className="text-yellow-accent" />
            {lang === 'ar' ? 'بيانات الشركة' : 'Company Information'}
          </h2>
          <button onClick={() => setView('company')} className="text-sm text-yellow-accent hover:underline">
            {lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-base-muted mb-1">{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</div>
            <div className="text-sm font-semibold text-base-primary">{company.companyName || (lang === 'ar' ? 'غير محدد' : 'Not set')}</div>
          </div>
          <div>
            <div className="text-xs text-base-muted mb-1">{lang === 'ar' ? 'السجل التجاري' : 'Commercial Registration'}</div>
            <div className="text-sm font-semibold text-base-primary">{company.commercialRegistration || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-base-muted mb-1">{lang === 'ar' ? 'المنطقة' : 'Region'}</div>
            <div className="text-sm font-semibold text-base-primary">{company.region || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-base-muted mb-1">{lang === 'ar' ? 'الشخص المسؤول' : 'Contact Person'}</div>
            <div className="text-sm font-semibold text-base-primary">{company.contactPerson || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
