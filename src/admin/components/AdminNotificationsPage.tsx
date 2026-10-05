import { useState } from 'react';
import { Bell, CheckCheck, Package, FileText, PenTool, Truck, RotateCcw, HardHat, Wrench, Info, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '../NotificationContext';
import { useEmployee } from '../EmployeeContext';
import {
  notificationTypeLabels, notificationTypeColors, notificationPriorityLabels, notificationPriorityColors,
  type NotificationType,
} from '../notification-types';

const iconForType: Record<NotificationType, typeof Bell> = {
  request: Package, quotation: FileText, contract: PenTool,
  delivery: Truck, return: RotateCcw, project: HardHat,
  equipment: Wrench, system: Info,
};

export default function AdminNotificationsPage() {
  const { lang } = useApp();
  const { notificationsFor, unreadCountFor, markAsRead, markAsUnread, markAllRead } = useNotification();
  const { currentEmployee } = useEmployee();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const ar = lang === 'ar';
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';

  const empId = currentEmployee?.id ?? 'emp-owner';
  const myNotifications = notificationsFor(empId, 'employee');
  const unreadCount = unreadCountFor(empId, 'employee');

  const filtered = myNotifications.filter((n) => {
    const matchSearch = !search ||
      n.titleAr.includes(search) || n.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      n.messageAr.includes(search) || n.messageEn.toLowerCase().includes(search.toLowerCase()) ||
      n.relatedEntityNumber.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const matchStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const types: NotificationType[] = ['request', 'quotation', 'contract', 'delivery', 'return', 'project', 'equipment', 'system'];

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
          <button onClick={() => markAllRead(empId, 'employee')} className="btn-secondary text-sm">
            <CheckCheck size={16} />
            {ar ? 'تعليم الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card-industrial p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-base-muted" />
            <input className={`${inputClass} ps-10`} placeholder={ar ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الأنواع' : 'All types'}</option>
            {types.map((t) => <option key={t} value={t}>{ar ? notificationTypeLabels[t].ar : notificationTypeLabels[t].en}</option>)}
          </select>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{ar ? 'كل الحالات' : 'All'}</option>
            <option value="unread">{ar ? 'غير مقروء' : 'Unread'}</option>
            <option value="read">{ar ? 'مقروء' : 'Read'}</option>
          </select>
        </div>
      </div>

      {/* List */}
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
              <div key={n.id} className={`card-industrial p-4 flex items-start gap-4 ${n.status === 'unread' ? 'border-yellow-accent/30' : ''}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notificationTypeColors[n.type]}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-base-primary">{ar ? n.titleAr : n.titleEn}</span>
                    {n.status === 'unread' && <span className="w-2 h-2 rounded-full bg-yellow-accent flex-shrink-0" />}
                    {n.priority !== 'normal' && (
                      <span className={`text-xs font-semibold ${notificationPriorityColors[n.priority]}`}>
                        {ar ? notificationPriorityLabels[n.priority].ar : notificationPriorityLabels[n.priority].en}
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
                <div className="flex flex-col gap-1">
                  {n.status === 'unread' ? (
                    <button onClick={() => markAsRead(n.id)} className="text-xs text-yellow-accent hover:underline">{ar ? 'مقروء' : 'Read'}</button>
                  ) : (
                    <button onClick={() => markAsUnread(n.id)} className="text-xs text-base-muted hover:underline">{ar ? 'غير مقروء' : 'Unread'}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
