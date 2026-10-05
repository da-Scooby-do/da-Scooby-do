import type { EquipmentModel, EquipmentVariant } from '@/catalog/types';

export type AdminView = 'dashboard' | 'requests-center' | 'equipment' | 'categories' | 'brands' | 'rental-requests' | 'quotations' | 'purchase-orders' | 'contracts' | 'rental-operations' | 'projects' | 'service-requests' | 'employees' | 'roles-permissions' | 'audit-log' | 'equipment-units' | 'equipment-sources' | 'allocations' | 'unit-availability' | 'deliveries' | 'admin-notifications' | 'notification-settings' | 'renewals' | 'site-content';

export type OperatorOption = 'with_operator' | 'without_operator';
export type DieselOption = 'customer' | 'sahab' | 'agreement';
export type TransportOption = 'available' | 'agreement';

export interface RentalInfo {
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  sixMonthPrice: string;
  annualPrice: string;
  operator: OperatorOption;
  diesel: DieselOption;
  transport: TransportOption;
  deposit: string;
  additionalTermsAr: string;
  additionalTermsEn: string;
}

export interface AdminVariant extends EquipmentVariant {
  year: string;
}

export interface AdminEquipmentModel extends Omit<EquipmentModel, 'variants'> {
  year: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  rentalInfo: RentalInfo;
  lastUpdated: string;
  variants: AdminVariant[];
}
