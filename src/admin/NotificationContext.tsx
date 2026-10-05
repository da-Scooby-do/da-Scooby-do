import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppNotification, NotificationPreferences, NotificationType, NotificationPriority,
  RecipientType, PreferenceKey, NotificationSeed,
} from './notification-types';
import {
  generateNotificationId, createDefaultPreferences, typeToPreference,
} from './notification-types';

interface NotificationContextValue {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  // Queries
  notificationsFor: (recipientId: string, recipientType: RecipientType) => AppNotification[];
  unreadCountFor: (recipientId: string, recipientType: RecipientType) => number;
  // Actions
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllRead: (recipientId: string, recipientType: RecipientType) => void;
  // Preferences
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  isTypeEnabled: (type: NotificationType) => boolean;
  // Trigger
  notify: (recipientId: string, recipientType: RecipientType, seed: NotificationSeed) => void;
  notifyMany: (recipients: { id: string; type: RecipientType }[], seed: NotificationSeed) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];

// ─── Seed Data ─────────────────────────────────────────────────

const seedNotifications: AppNotification[] = [
  {
    id: 'notif-seed-1',
    recipientId: 'cust-demo-1',
    recipientType: 'customer',
    titleAr: 'عرض سعر جديد',
    titleEn: 'New Quotation',
    messageAr: 'تم إصدار عرض سعر QUO-2024-001 لطلبك REQ-2024-001',
    messageEn: 'Quotation QUO-2024-001 has been issued for your request REQ-2024-001',
    type: 'quotation', priority: 'normal',
    relatedEntityType: 'quotation', relatedEntityId: 'q1', relatedEntityNumber: 'QUO-2024-001',
    deepLink: 'quotations',
    status: 'unread', createdAt: today(), readAt: null,
  },
  {
    id: 'notif-seed-2',
    recipientId: 'cust-demo-1',
    recipientType: 'customer',
    titleAr: 'تحديث حالة الطلب',
    titleEn: 'Request Status Update',
    messageAr: 'طلبك REQ-2024-002 قيد المراجعة',
    messageEn: 'Your request REQ-2024-002 is under review',
    type: 'request', priority: 'normal',
    relatedEntityType: 'rental_request', relatedEntityId: 'r2', relatedEntityNumber: 'REQ-2024-002',
    deepLink: 'rental-requests',
    status: 'unread', createdAt: today(), readAt: null,
  },
  {
    id: 'notif-seed-3',
    recipientId: 'cust-demo-1',
    recipientType: 'customer',
    titleAr: 'عقد جاهز للتوقيع',
    titleEn: 'Contract Ready for Signature',
    messageAr: 'العقد CON-2024-001 جاهز للتوقيع',
    messageEn: 'Contract CON-2024-001 is ready for signature',
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: 'c1', relatedEntityNumber: 'CON-2024-001',
    deepLink: 'contracts',
    status: 'read', createdAt: today(), readAt: today(),
  },
  {
    id: 'notif-seed-4',
    recipientId: 'emp-owner',
    recipientType: 'employee',
    titleAr: 'طلب تأجير جديد',
    titleEn: 'New Rental Request',
    messageAr: 'طلب تأجير جديد: REQ-2024-001',
    messageEn: 'New rental request: REQ-2024-001',
    type: 'request', priority: 'normal',
    relatedEntityType: 'rental_request', relatedEntityId: 'r1', relatedEntityNumber: 'REQ-2024-001',
    deepLink: 'rental-requests',
    status: 'unread', createdAt: today(), readAt: null,
  },
  {
    id: 'notif-seed-5',
    recipientId: 'emp-owner',
    recipientType: 'employee',
    titleAr: 'استلام متوقع',
    titleEn: 'Return Expected',
    messageAr: 'استلام المعدة DLV-2026-0001 متوقع قريباً',
    messageEn: 'Equipment return for DLV-2026-0001 is expected soon',
    type: 'return', priority: 'normal',
    relatedEntityType: 'delivery', relatedEntityId: 'dlv-001', relatedEntityNumber: 'DLV-2026-0001',
    deepLink: 'deliveries',
    status: 'unread', createdAt: today(), readAt: null,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>(createDefaultPreferences());

  const notificationsFor = useCallback(
    (recipientId: string, recipientType: RecipientType) =>
      notifications
        .filter((n) => n.recipientId === recipientId && n.recipientType === recipientType)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  );

  const unreadCountFor = useCallback(
    (recipientId: string, recipientType: RecipientType) =>
      notifications.filter((n) => n.recipientId === recipientId && n.recipientType === recipientType && n.status === 'unread').length,
    [notifications],
  );

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' as const, readAt: now() } : n)));

  const markAsUnread = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'unread' as const, readAt: null } : n)));

  const markAllRead = (recipientId: string, recipientType: RecipientType) =>
    setNotifications((prev) => prev.map((n) =>
      n.recipientId === recipientId && n.recipientType === recipientType && n.status === 'unread'
        ? { ...n, status: 'read' as const, readAt: now() }
        : n,
    ));

  const updatePreferences = (prefs: Partial<NotificationPreferences>) =>
    setPreferences((prev) => ({ ...prev, ...prefs }));

  const isTypeEnabled = (type: NotificationType) => {
    const prefKey = typeToPreference[type];
    return preferences[prefKey];
  };

  const notify = (recipientId: string, recipientType: RecipientType, seed: NotificationSeed) => {
    // Check preferences
    if (!isTypeEnabled(seed.type)) return;
    const n: AppNotification = {
      id: generateNotificationId(),
      recipientId,
      recipientType,
      titleAr: seed.titleAr,
      titleEn: seed.titleEn,
      messageAr: seed.messageAr,
      messageEn: seed.messageEn,
      type: seed.type,
      priority: seed.priority,
      relatedEntityType: seed.relatedEntityType,
      relatedEntityId: seed.relatedEntityId,
      relatedEntityNumber: seed.relatedEntityNumber,
      deepLink: seed.deepLink,
      status: 'unread',
      createdAt: now(),
      readAt: null,
    };
    setNotifications((prev) => [n, ...prev]);
  };

  const notifyMany = (recipients: { id: string; type: RecipientType }[], seed: NotificationSeed) => {
    if (!isTypeEnabled(seed.type)) return;
    const newNotifs: AppNotification[] = recipients.map((r) => ({
      id: generateNotificationId(),
      recipientId: r.id,
      recipientType: r.type,
      titleAr: seed.titleAr,
      titleEn: seed.titleEn,
      messageAr: seed.messageAr,
      messageEn: seed.messageEn,
      type: seed.type,
      priority: seed.priority,
      relatedEntityType: seed.relatedEntityType,
      relatedEntityId: seed.relatedEntityId,
      relatedEntityNumber: seed.relatedEntityNumber,
      deepLink: seed.deepLink,
      status: 'unread' as const,
      createdAt: now(),
      readAt: null,
    }));
    setNotifications((prev) => [...newNotifs, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications, preferences,
        notificationsFor, unreadCountFor,
        markAsRead, markAsUnread, markAllRead,
        updatePreferences, isTypeEnabled,
        notify, notifyMany,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
