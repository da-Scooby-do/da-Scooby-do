export interface SpecField {
  key: string;
  labelAr: string;
  labelEn: string;
  unitAr: string;
  unitEn: string;
}

export interface RentalPeriod {
  id: string;
  labelAr: string;
  labelEn: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  image: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
  specFields: SpecField[];
  displayOrder: number;
  hidden: boolean;
}

export interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
  /** Uploaded logo URL; empty shows the first letter. */
  logo?: string;
}

export interface EquipmentVariant {
  id: string;
  sizeLabelAr: string;
  sizeLabelEn: string;
  specs: Record<string, string>;
  published: boolean;
  displayOrder: number;
}

export interface EquipmentModel {
  id: string;
  categoryId: string;
  brandId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  gallery: string[];
  featuresAr: string[];
  featuresEn: string[];
  rentalTermsAr: string;
  rentalTermsEn: string;
  variants: EquipmentVariant[];
  published: boolean;
  displayOrder: number;
}

export interface CatalogRoute {
  level: 'categories' | 'brands' | 'models' | 'details';
  categoryId?: string;
  brandId?: string;
  modelId?: string;
}

export interface RequestEquipment {
  categoryId: string;
  brandId: string;
  modelId: string;
  variantId: string;
}

export const rentalPeriods: RentalPeriod[] = [
  { id: 'daily', labelAr: 'يومي', labelEn: 'Daily' },
  { id: 'weekly', labelAr: 'أسبوعي', labelEn: 'Weekly' },
  { id: 'monthly', labelAr: 'شهري', labelEn: 'Monthly' },
  { id: '6months', labelAr: '6 أشهر', labelEn: '6 Months' },
  { id: 'yearly', labelAr: 'سنة', labelEn: 'Yearly' },
];
