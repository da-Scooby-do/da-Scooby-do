import { Bell, CheckCheck, Package, FileText, PenTool, Truck, RotateCcw, HardHat, Info, Search } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import { useNotification } from '@/admin/NotificationContext';
import {
  notificationTypeLabels, notificationTypeColors, notificationPriorityColors,
  type NotificationType,
} from '@/admin/notification-types';

const iconForType: Record<NotificationType, typeof Bell> = {
  request: Package, quotation: FileText, contract: PenTool,
  delivery: Truck, return: RotateCcw, project: HardHat,
  equipment: Info, system: Info,
};

export default function NotificationsPage() {
  const { lang } = useApp();
  const { user, setView } = useCustomer();
  const { notificationsFor, unreadCountFor, markAsRead, markAsUnread, markAllRead } = useNotification();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const ar = lang === 'ar';
  const custId = user?.id ?? 'cust-demo-1';
  const myNotifications = notificationsFor(custId, 'customer');
  const unreadCount = unreadCountFor(custId, 'customer');
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const filtered = myNotifications.filter((n) => {
    const matchSearch = !search ||
      n.titleAr.includes(search) || n.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      n.messageAr.includes(search) || n.messageEn.toLowerCase().includes(search.toLowerCase()) ||
      n.relatedEntityNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleClick = (n: typeof myNotifications[0]) => {
    markAsRead(n.id);
    if (n.deepLink && n.deepLink !== 'notifications') {
      setView(n.deepLink as never);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary flex items-center gap-2">
            <Bell size={28} className="text-yellow-accent" />
            {ar ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-base-muted text-sm">{ar ? `${unreadCount} غير مقروء من ${myNotifications.length}` : `${unreadCount} unread of ${myNotifications.length}`}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead(custId, 'customer')} className="btn-secondary text-sm">
            <CheckCheck size={16} />
            {ar ? 'تعليم الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'الكل' : 'All'}</option>
            <option value="unread">{ar ? 'غير مقروء' : 'Unread'}</option>
            <option value="read">{ar ? 'مقروء' : 'Read'}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-base-muted opacity-30" />
          <p className="text-sm text-base-muted">{myNotifications.length === 0 ? (ar ? 'لا توجد إشعارات' : 'No notifications') : (ar ? 'لا توجد نتائج' : 'No results')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = iconForType[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`card-industrial p-4 flex items-start gap-4 w-full text-start hover-lift ${n.status === 'unread' ? 'border-yellow-accent/30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notificationTypeColors[n.type]}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-base-primary">{ar ? n.titleAr : n.titleEn}</span>
                    {n.status === 'unread' && <span className="w-2 h-2 rounded-full bg-yellow-accent flex-shrink-0" />}
                    {n.priority !== 'normal' && (
                      <span className={`text-xs font-semibold ${notificationPriorityColors[n.priority]}`}>
                        {n.priority === 'urgent' ? (ar ? 'عاجل' : 'Urgent') : (ar ? 'مهم' : 'Important')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-base-muted">{ar ? n.messageAr : n.messageEn}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-base-muted">{n.relatedEntityNumber}</span>
                    <span className="text-xs text-base-muted">•</span>
                    <span className="text-xs text-base-muted">{new Date(n.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>
                {n.status === 'read' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsUnread(n.id); }}
                    className="text-xs text-base-muted hover:underline flex-shrink-0"
                  >
                    {ar ? 'غير مقروء' : 'Unread'}
                  </button>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
