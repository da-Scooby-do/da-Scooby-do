export interface CustomerUser {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  createdAt: string;
}

export interface CompanyProfile {
  companyName: string;
  commercialRegistration: string;
  nationalUnifiedNumber: string;
  vatNumber: string;
  companyPhone: string;
  officialEmail: string;
  region: string;
  city: string;
  address: string;
  contactPerson: string;
  jobTitle: string;
}

export type RequestType = 'rental' | 'project';
export type RequestStatus = 'pending' | 'reviewing' | 'quoted' | 'approved' | 'rejected' | 'completed';

export interface CustomerRequest {
  id: string;
  requestNumber: string;
  type: RequestType;
  date: string;
  status: RequestStatus;
  titleAr: string;
  titleEn: string;
  detailsAr: string;
  detailsEn: string;
}

export type QuotationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Quotation {
  id: string;
  quotationNumber: string;
  relatedRequestNumber: string;
  date: string;
  total: string;
  validUntil: string;
  status: QuotationStatus;
  rejectReason?: string;
}

export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'active' | 'expired';
export type SignatureStatus = 'unsigned' | 'customer_signed' | 'fully_signed';

export interface Contract {
  id: string;
  contractNumber: string;
  relatedQuotationNumber: string;
  date: string;
  contractStatus: ContractStatus;
  signatureStatus: SignatureStatus;
}

export type NotificationType = 'request' | 'quotation' | 'contract' | 'system';

export interface CustomerNotification {
  id: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  date: string;
  read: boolean;
}

export type CustomerView =
  | 'overview'
  | 'company'
  | 'rental-requests'
  | 'project-requests'
  | 'quotations'
  | 'contracts'
  | 'deliveries'
  | 'renewals'
  | 'notifications'
  | 'settings';

export type AuthView = 'login' | 'register' | 'forgot';

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyCompanyProfile(): CompanyProfile {
  return {
    companyName: '',
    commercialRegistration: '',
    nationalUnifiedNumber: '',
    vatNumber: '',
    companyPhone: '',
    officialEmail: '',
    region: '',
    city: '',
    address: '',
    contactPerson: '',
    jobTitle: '',
  };
}
