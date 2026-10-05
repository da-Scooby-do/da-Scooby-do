import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Package, FileText, PenTool, Truck, RotateCcw, HardHat, Wrench, Info, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/admin/NotificationContext';
import {
  notificationTypeColors, notificationPriorityColors,
  type AppNotification, type NotificationType,
} from '@/admin/notification-types';

interface Props {
  recipientId: string;
  recipientType: 'customer' | 'employee';
  onNavigate: (deepLink: string) => void;
}

const iconForType: Record<NotificationType, typeof Bell> = {
  request: Package,
  quotation: FileText,
  contract: PenTool,
  delivery: Truck,
  return: RotateCcw,
  project: HardHat,
  equipment: Wrench,
  system: Info,
};

export default function NotificationBell({ recipientId, recipientType, onNavigate }: Props) {
  const { lang } = useApp();
  const { notificationsFor, unreadCountFor, markAsRead, markAllRead } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ar = lang === 'ar';

  const myNotifications = notificationsFor(recipientId, recipientType);
  const unreadCount = unreadCountFor(recipientId, recipientType);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: AppNotification) => {
    markAsRead(n.id);
    onNavigate(n.deepLink);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent hover:border-yellow-accent/30 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -top-1 ltr:-right-1 rtl:-left-1 w-5 h-5 rounded-full bg-yellow-accent text-black text-xs font-bold flex items-center justify-center animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 ltr:right-0 rtl:left-0 w-80 sm:w-96 bg-elevated rounded-2xl border border-base shadow-2xl z-50 animate-scale-in max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-base flex items-center justify-between">
            <h3 className="text-sm font-bold text-base-primary">{ar ? 'الإشعارات' : 'Notifications'}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAllRead(recipientId, recipientType)} className="text-xs text-yellow-accent hover:underline flex items-center gap-1">
                  <CheckCheck size={14} />
                  {ar ? 'تعليم الكل كمقروء' : 'Mark all read'}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded text-base-muted hover:text-base-primary">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="mx-auto mb-2 text-base-muted opacity-30" />
                <p className="text-sm text-base-muted">{ar ? 'لا توجد إشعارات' : 'No notifications'}</p>
              </div>
            ) : (
              <div className="divide-y divide-base">
                {myNotifications.slice(0, 20).map((n) => {
                  const Icon = iconForType[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full p-3 flex items-start gap-3 text-start hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${n.status === 'unread' ? 'bg-yellow-accent/5' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notificationTypeColors[n.type]}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-base-primary truncate">{ar ? n.titleAr : n.titleEn}</span>
                          {n.status === 'unread' && <span className="w-2 h-2 rounded-full bg-yellow-accent flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-base-muted mt-0.5 line-clamp-2">{ar ? n.messageAr : n.messageEn}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-base-muted">{n.relatedEntityNumber}</span>
                          {n.priority !== 'normal' && (
                            <span className={`text-xs font-semibold ${notificationPriorityColors[n.priority]}`}>
                              {n.priority === 'urgent' ? (ar ? 'عاجل' : 'Urgent') : (ar ? 'مهم' : 'Important')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {myNotifications.length > 0 && (
            <div className="p-3 border-t border-base">
              <button onClick={() => { onNavigate('notifications'); setOpen(false); }} className="w-full text-center text-xs font-semibold text-yellow-accent hover:underline">
                {ar ? 'عرض جميع الإشعارات' : 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
