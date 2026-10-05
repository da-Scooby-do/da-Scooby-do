// ─── Notification System Types ────────────────────────────────

export type NotificationType =
  | 'request'
  | 'quotation'
  | 'contract'
  | 'delivery'
  | 'return'
  | 'project'
  | 'equipment'
  | 'system';

export type NotificationPriority = 'normal' | 'important' | 'urgent';

export type NotificationStatus = 'unread' | 'read';

export type RecipientType = 'customer' | 'employee';

export type PreferenceKey =
  | 'requests'
  | 'quotations'
  | 'contracts'
  | 'deliveries'
  | 'projects'
  | 'equipment';

// ─── Notification ──────────────────────────────────────────────

export interface AppNotification {
  id: string;
  recipientId: string; // customer user id or employee id
  recipientType: RecipientType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: NotificationType;
  priority: NotificationPriority;
  relatedEntityType: string; // e.g. 'rental_request', 'quotation', 'contract', 'delivery'
  relatedEntityId: string;
  relatedEntityNumber: string; // display number like REQ-2024-001
  deepLink: string; // e.g. 'rental-requests', 'contracts'
  status: NotificationStatus;
  createdAt: string; // ISO datetime
  readAt: string | null;
}

// ─── Notification Preferences ──────────────────────────────────

export interface NotificationPreferences {
  requests: boolean;
  quotations: boolean;
  contracts: boolean;
  deliveries: boolean;
  projects: boolean;
  equipment: boolean;
}

// ─── Labels ────────────────────────────────────────────────────

export const notificationTypeLabels: Record<NotificationType, { ar: string; en: string }> = {
  request: { ar: 'طلب', en: 'Request' },
  quotation: { ar: 'عرض سعر', en: 'Quotation' },
  contract: { ar: 'عقد', en: 'Contract' },
  delivery: { ar: 'تسليم', en: 'Delivery' },
  return: { ar: 'استلام', en: 'Return' },
  project: { ar: 'مشروع', en: 'Project' },
  equipment: { ar: 'معدة', en: 'Equipment' },
  system: { ar: 'نظام', en: 'System' },
};

export const notificationTypeColors: Record<NotificationType, string> = {
  request: 'bg-yellow-accent/10 text-yellow-accent',
  quotation: 'bg-green-500/10 text-green-500',
  contract: 'bg-blue-500/10 text-blue-500',
  delivery: 'bg-teal-500/10 text-teal-500',
  return: 'bg-orange-500/10 text-orange-500',
  project: 'bg-purple-500/10 text-purple-500',
  equipment: 'bg-indigo-500/10 text-indigo-500',
  system: 'bg-base-muted/10 text-base-muted',
};

export const notificationPriorityLabels: Record<NotificationPriority, { ar: string; en: string }> = {
  normal: { ar: 'عادي', en: 'Normal' },
  important: { ar: 'مهم', en: 'Important' },
  urgent: { ar: 'عاجل', en: 'Urgent' },
};

export const notificationPriorityColors: Record<NotificationPriority, string> = {
  normal: 'text-base-muted',
  important: 'text-orange-500',
  urgent: 'text-red-500',
};

export const preferenceLabels: Record<PreferenceKey, { ar: string; en: string }> = {
  requests: { ar: 'طلبات التأجير', en: 'Rental Requests' },
  quotations: { ar: 'عروض الأسعار', en: 'Quotations' },
  contracts: { ar: 'العقود', en: 'Contracts' },
  deliveries: { ar: 'التسليم والاستلام', en: 'Delivery & Return' },
  projects: { ar: 'المشاريع', en: 'Projects' },
  equipment: { ar: 'المعدات', en: 'Equipment' },
};

// Map notification type to preference key
export const typeToPreference: Record<NotificationType, PreferenceKey> = {
  request: 'requests',
  quotation: 'quotations',
  contract: 'contracts',
  delivery: 'deliveries',
  return: 'deliveries',
  project: 'projects',
  equipment: 'equipment',
  system: 'requests', // system notifications always shown
};

export const allPreferenceKeys: PreferenceKey[] = ['requests', 'quotations', 'contracts', 'deliveries', 'projects', 'equipment'];

// ─── Helpers ───────────────────────────────────────────────────

export function generateNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultPreferences(): NotificationPreferences {
  return {
    requests: true,
    quotations: true,
    contracts: true,
    deliveries: true,
    projects: true,
    equipment: true,
  };
}

// ─── Event Trigger Builder ─────────────────────────────────────
// Reusable factory functions for creating notifications from workflow events.
// Each function returns a partial notification (without id, recipientId, recipientType, status, createdAt, readAt).

export interface NotificationSeed {
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: NotificationType;
  priority: NotificationPriority;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityNumber: string;
  deepLink: string;
}

// Customer event triggers
export const customerTriggers = {
  rentalRequestCreated: (reqNumber: string, reqId: string): NotificationSeed => ({
    titleAr: 'تم إنشاء طلب التأجير',
    titleEn: 'Rental Request Created',
    messageAr: `تم إنشاء طلبك ${reqNumber} بنجاح`,
    messageEn: `Your request ${reqNumber} has been created successfully`,
    type: 'request', priority: 'normal',
    relatedEntityType: 'rental_request', relatedEntityId: reqId, relatedEntityNumber: reqNumber,
    deepLink: 'rental-requests',
  }),
  rentalRequestStatusChanged: (reqNumber: string, reqId: string, statusAr: string, statusEn: string): NotificationSeed => ({
    titleAr: 'تحديث حالة الطلب',
    titleEn: 'Request Status Updated',
    messageAr: `طلبك ${reqNumber} أصبح: ${statusAr}`,
    messageEn: `Your request ${reqNumber} is now: ${statusEn}`,
    type: 'request', priority: 'normal',
    relatedEntityType: 'rental_request', relatedEntityId: reqId, relatedEntityNumber: reqNumber,
    deepLink: 'rental-requests',
  }),
  quotationCreated: (quoNumber: string, quoId: string): NotificationSeed => ({
    titleAr: 'عرض سعر جديد',
    titleEn: 'New Quotation',
    messageAr: `تم إصدار عرض سعر ${quoNumber}`,
    messageEn: `Quotation ${quoNumber} has been issued`,
    type: 'quotation', priority: 'normal',
    relatedEntityType: 'quotation', relatedEntityId: quoId, relatedEntityNumber: quoNumber,
    deepLink: 'quotations',
  }),
  quotationAccepted: (quoNumber: string, quoId: string): NotificationSeed => ({
    titleAr: 'تم قبول عرض السعر',
    titleEn: 'Quotation Accepted',
    messageAr: `تم قبول عرض السعر ${quoNumber}`,
    messageEn: `Quotation ${quoNumber} has been accepted`,
    type: 'quotation', priority: 'normal',
    relatedEntityType: 'quotation', relatedEntityId: quoId, relatedEntityNumber: quoNumber,
    deepLink: 'quotations',
  }),
  quotationRejected: (quoNumber: string, quoId: string): NotificationSeed => ({
    titleAr: 'تم رفض عرض السعر',
    titleEn: 'Quotation Rejected',
    messageAr: `تم رفض عرض السعر ${quoNumber}`,
    messageEn: `Quotation ${quoNumber} has been rejected`,
    type: 'quotation', priority: 'normal',
    relatedEntityType: 'quotation', relatedEntityId: quoId, relatedEntityNumber: quoNumber,
    deepLink: 'quotations',
  }),
  contractCreated: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'عقد جديد',
    titleEn: 'New Contract',
    messageAr: `تم إنشاء العقد ${conNumber}`,
    messageEn: `Contract ${conNumber} has been created`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  contractRequiresSignature: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'العقد بانتظار التوقيع',
    titleEn: 'Contract Requires Signature',
    messageAr: `العقد ${conNumber} جاهز للتوقيع`,
    messageEn: `Contract ${conNumber} is ready for your signature`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  contractSigned: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'تم توقيع العقد',
    titleEn: 'Contract Signed',
    messageAr: `تم توقيع العقد ${conNumber} بنجاح`,
    messageEn: `Contract ${conNumber} has been signed`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  contractActivated: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'تم تفعيل العقد',
    titleEn: 'Contract Activated',
    messageAr: `العقد ${conNumber} أصبح سارياً`,
    messageEn: `Contract ${conNumber} is now active`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  deliveryScheduled: (dlvNumber: string, dlvId: string): NotificationSeed => ({
    titleAr: 'تم جدولة التسليم',
    titleEn: 'Delivery Scheduled',
    messageAr: `تم جدولة تسليم المعدة ${dlvNumber}`,
    messageEn: `Equipment delivery ${dlvNumber} has been scheduled`,
    type: 'delivery', priority: 'normal',
    relatedEntityType: 'delivery', relatedEntityId: dlvId, relatedEntityNumber: dlvNumber,
    deepLink: 'deliveries',
  }),
  equipmentDelivered: (dlvNumber: string, dlvId: string): NotificationSeed => ({
    titleAr: 'تم تسليم المعدة',
    titleEn: 'Equipment Delivered',
    messageAr: `تم تسليم المعدة بنجاح (${dlvNumber})`,
    messageEn: `Equipment has been delivered (${dlvNumber})`,
    type: 'delivery', priority: 'normal',
    relatedEntityType: 'delivery', relatedEntityId: dlvId, relatedEntityNumber: dlvNumber,
    deepLink: 'deliveries',
  }),
  returnScheduled: (rtnNumber: string, rtnId: string): NotificationSeed => ({
    titleAr: 'تم جدولة الاستلام',
    titleEn: 'Return Scheduled',
    messageAr: `تم جدولة استلام المعدة (${rtnNumber})`,
    messageEn: `Equipment return has been scheduled (${rtnNumber})`,
    type: 'return', priority: 'normal',
    relatedEntityType: 'return', relatedEntityId: rtnId, relatedEntityNumber: rtnNumber,
    deepLink: 'deliveries',
  }),
  equipmentReturned: (rtnNumber: string, rtnId: string): NotificationSeed => ({
    titleAr: 'تم استلام المعدة',
    titleEn: 'Equipment Returned',
    messageAr: `تم استلام المعدة بنجاح (${rtnNumber})`,
    messageEn: `Equipment has been returned (${rtnNumber})`,
    type: 'return', priority: 'normal',
    relatedEntityType: 'return', relatedEntityId: rtnId, relatedEntityNumber: rtnNumber,
    deepLink: 'deliveries',
  }),
  returnIssue: (rtnNumber: string, rtnId: string): NotificationSeed => ({
    titleAr: 'مشكلة في الاستلام',
    titleEn: 'Return Issue',
    messageAr: `تم رصد مشكلة عند استلام المعدة (${rtnNumber})`,
    messageEn: `An issue was found during equipment return (${rtnNumber})`,
    type: 'return', priority: 'urgent',
    relatedEntityType: 'return', relatedEntityId: rtnId, relatedEntityNumber: rtnNumber,
    deepLink: 'deliveries',
  }),
  projectStatusChanged: (reqNumber: string, reqId: string, statusAr: string, statusEn: string): NotificationSeed => ({
    titleAr: 'تحديث حالة طلب المشروع',
    titleEn: 'Project Request Status Updated',
    messageAr: `طلب مشروعك ${reqNumber} أصبح: ${statusAr}`,
    messageEn: `Your project request ${reqNumber} is now: ${statusEn}`,
    type: 'project', priority: 'normal',
    relatedEntityType: 'project_request', relatedEntityId: reqId, relatedEntityNumber: reqNumber,
    deepLink: 'project-requests',
  }),
  contractExpiring: (conNumber: string, conId: string, days: number): NotificationSeed => ({
    titleAr: 'عقد قريب من الانتهاء',
    titleEn: 'Contract Expiring Soon',
    messageAr: `عقدك ${conNumber} ينتهي خلال ${days} يوم`,
    messageEn: `Your contract ${conNumber} expires in ${days} days`,
    type: 'contract', priority: days <= 7 ? 'urgent' : 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'renewals',
  }),
  renewalOffer: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'عرض تجديد متاح',
    titleEn: 'Renewal Offer Available',
    messageAr: `عرض تجديد جديد ${rnwNumber} متاح للمراجعة`,
    messageEn: `Renewal offer ${rnwNumber} is available for review`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
  renewalApproved: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'تم اعتماد التجديد',
    titleEn: 'Renewal Approved',
    messageAr: `تم اعتماد تجديدك ${rnwNumber}، جاري تحضير العقد`,
    messageEn: `Your renewal ${rnwNumber} has been approved, contract preparation in progress`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
  renewalRejected: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'تم رفض التجديد',
    titleEn: 'Renewal Rejected',
    messageAr: `تم رفض عرض التجديد ${rnwNumber}`,
    messageEn: `Renewal offer ${rnwNumber} has been rejected`,
    type: 'contract', priority: 'normal',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
};

// Employee/Admin event triggers
export const employeeTriggers = {
  newRentalRequest: (reqNumber: string, reqId: string): NotificationSeed => ({
    titleAr: 'طلب تأجير جديد',
    titleEn: 'New Rental Request',
    messageAr: `طلب تأجير جديد: ${reqNumber}`,
    messageEn: `New rental request: ${reqNumber}`,
    type: 'request', priority: 'normal',
    relatedEntityType: 'rental_request', relatedEntityId: reqId, relatedEntityNumber: reqNumber,
    deepLink: 'rental-requests',
  }),
  newProjectRequest: (reqNumber: string, reqId: string): NotificationSeed => ({
    titleAr: 'طلب مشروع جديد',
    titleEn: 'New Project Request',
    messageAr: `طلب مشروع جديد: ${reqNumber}`,
    messageEn: `New project request: ${reqNumber}`,
    type: 'project', priority: 'normal',
    relatedEntityType: 'project_request', relatedEntityId: reqId, relatedEntityNumber: reqNumber,
    deepLink: 'projects',
  }),
  quotationAccepted: (quoNumber: string, quoId: string): NotificationSeed => ({
    titleAr: 'تم قبول عرض السعر',
    titleEn: 'Quotation Accepted',
    messageAr: `العميل قبل عرض السعر ${quoNumber}`,
    messageEn: `Customer accepted quotation ${quoNumber}`,
    type: 'quotation', priority: 'important',
    relatedEntityType: 'quotation', relatedEntityId: quoId, relatedEntityNumber: quoNumber,
    deepLink: 'quotations',
  }),
  quotationRejected: (quoNumber: string, quoId: string): NotificationSeed => ({
    titleAr: 'تم رفض عرض السعر',
    titleEn: 'Quotation Rejected',
    messageAr: `العميل رفض عرض السعر ${quoNumber}`,
    messageEn: `Customer rejected quotation ${quoNumber}`,
    type: 'quotation', priority: 'important',
    relatedEntityType: 'quotation', relatedEntityId: quoId, relatedEntityNumber: quoNumber,
    deepLink: 'quotations',
  }),
  contractRequiresAction: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'العقد يتطلب إجراء',
    titleEn: 'Contract Requires Action',
    messageAr: `العقد ${conNumber} يتطلب إجراء`,
    messageEn: `Contract ${conNumber} requires action`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  contractSigned: (conNumber: string, conId: string): NotificationSeed => ({
    titleAr: 'تم توقيع العقد',
    titleEn: 'Contract Signed',
    messageAr: `تم توقيع العقد ${conNumber} من قبل العميل`,
    messageEn: `Contract ${conNumber} has been signed by customer`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'contracts',
  }),
  deliveryRequiresScheduling: (allocNumber: string, allocId: string): NotificationSeed => ({
    titleAr: 'تسليم يتطلب جدولة',
    titleEn: 'Delivery Requires Scheduling',
    messageAr: `التخصيص ${allocNumber} جاهز لجدولة التسليم`,
    messageEn: `Allocation ${allocNumber} is ready for delivery scheduling`,
    type: 'delivery', priority: 'important',
    relatedEntityType: 'allocation', relatedEntityId: allocId, relatedEntityNumber: allocNumber,
    deepLink: 'deliveries',
  }),
  returnExpected: (dlvNumber: string, dlvId: string): NotificationSeed => ({
    titleAr: 'استلام متوقع',
    titleEn: 'Return Expected',
    messageAr: `استلام المعدة ${dlvNumber} متوقع قريباً`,
    messageEn: `Equipment return for ${dlvNumber} is expected soon`,
    type: 'return', priority: 'normal',
    relatedEntityType: 'delivery', relatedEntityId: dlvId, relatedEntityNumber: dlvNumber,
    deepLink: 'deliveries',
  }),
  returnIssue: (rtnNumber: string, rtnId: string): NotificationSeed => ({
    titleAr: 'مشكلة في الاستلام',
    titleEn: 'Return Issue',
    messageAr: `مشكلة في استلام المعدة (${rtnNumber})`,
    messageEn: `Return issue detected (${rtnNumber})`,
    type: 'return', priority: 'urgent',
    relatedEntityType: 'return', relatedEntityId: rtnId, relatedEntityNumber: rtnNumber,
    deepLink: 'deliveries',
  }),
  equipmentRequiresMaintenance: (unitCode: string, unitId: string): NotificationSeed => ({
    titleAr: 'المعدة تحتاج صيانة',
    titleEn: 'Equipment Requires Maintenance',
    messageAr: `الوحدة ${unitCode} تحتاج صيانة`,
    messageEn: `Unit ${unitCode} requires maintenance`,
    type: 'equipment', priority: 'important',
    relatedEntityType: 'equipment_unit', relatedEntityId: unitId, relatedEntityNumber: unitCode,
    deepLink: 'equipment-units',
  }),
  contractExpiring: (conNumber: string, conId: string, days: number): NotificationSeed => ({
    titleAr: 'عقد قريب من الانتهاء',
    titleEn: 'Contract Expiring Soon',
    messageAr: `العقد ${conNumber} ينتهي خلال ${days} يوم`,
    messageEn: `Contract ${conNumber} expires in ${days} days`,
    type: 'contract', priority: days <= 7 ? 'urgent' : 'important',
    relatedEntityType: 'contract', relatedEntityId: conId, relatedEntityNumber: conNumber,
    deepLink: 'renewals',
  }),
  renewalCreated: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'تجديد جديد',
    titleEn: 'New Renewal Created',
    messageAr: `تم إنشاء تجديد ${rnwNumber}`, messageEn: `Renewal ${rnwNumber} has been created`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
  renewalPendingReview: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'تجديد بانتظار المراجعة',
    titleEn: 'Renewal Pending Review',
    messageAr: `التجديد ${rnwNumber} بانتظار المراجعة الداخلية`,
    messageEn: `Renewal ${rnwNumber} is pending internal review`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
  renewalCustomerApproved: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'وافق العميل على التجديد',
    titleEn: 'Customer Approved Renewal',
    messageAr: `وافق العميل على التجديد ${rnwNumber}`, messageEn: `Customer approved renewal ${rnwNumber}`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
  renewalCustomerRejected: (rnwNumber: string, rnwId: string): NotificationSeed => ({
    titleAr: 'رفض العميل التجديد',
    titleEn: 'Customer Rejected Renewal',
    messageAr: `رفض العميل التجديد ${rnwNumber}`, messageEn: `Customer rejected renewal ${rnwNumber}`,
    type: 'contract', priority: 'important',
    relatedEntityType: 'renewal', relatedEntityId: rnwId, relatedEntityNumber: rnwNumber,
    deepLink: 'renewals',
  }),
};
