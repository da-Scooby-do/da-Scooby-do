import { supabase } from '@/lib/supabase';
import type { Category, Brand, EquipmentModel, EquipmentVariant, SpecField } from './types';

// ─── DB Row Types ─────────────────────────────────────────────
interface CategoryRow {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image: string;
  icon: string;
  description_ar: string;
  description_en: string;
  spec_fields: SpecField[];
  display_order: number;
  hidden: boolean;
}

interface BrandRow {
  id: string;
  name_ar: string;
  name_en: string;
  display_order: number;
  hidden: boolean;
}

interface EquipmentModelRow {
  id: string;
  category_id: string;
  brand_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  gallery: string[];
  features_ar: string[];
  features_en: string[];
  rental_terms_ar: string;
  rental_terms_en: string;
  year: string;
  short_description_ar: string;
  short_description_en: string;
  rental_info: Record<string, string>;
  published: boolean;
  hidden: boolean;
  archived: boolean;
  availability: string;
  display_order: number;
}

interface EquipmentVariantRow {
  id: string;
  model_id: string;
  size_label_ar: string;
  size_label_en: string;
  specs: Record<string, string>;
  published: boolean;
  display_order: number;
}

// ─── Mappers ──────────────────────────────────────────────────
function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    slug: row.slug,
    image: row.image,
    icon: row.icon,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    specFields: row.spec_fields || [],
    displayOrder: row.display_order,
    hidden: row.hidden,
  };
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
  };
}

function mapModel(row: EquipmentModelRow, variants: EquipmentVariant[]): EquipmentModel {
  return {
    id: row.id,
    categoryId: row.category_id,
    brandId: row.brand_id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    image: row.image,
    gallery: row.gallery || [],
    featuresAr: row.features_ar || [],
    featuresEn: row.features_en || [],
    rentalTermsAr: row.rental_terms_ar,
    rentalTermsEn: row.rental_terms_en,
    variants,
    published: row.published,
    displayOrder: row.display_order,
  };
}

function mapVariant(row: EquipmentVariantRow): EquipmentVariant {
  return {
    id: row.id,
    sizeLabelAr: row.size_label_ar,
    sizeLabelEn: row.size_label_en,
    specs: row.specs || {},
    published: row.published,
    displayOrder: row.display_order,
  };
}

// ─── Admin Row Types (includes hidden, archived, availability, rental_info) ───
export interface AdminCategoryRow extends CategoryRow {}
export interface AdminBrandRow extends BrandRow {}
export interface AdminModelRow extends EquipmentModelRow {}
export interface AdminVariantRow extends EquipmentVariantRow {}

// ─── Public Catalog Loader ────────────────────────────────────
export interface CatalogData {
  categories: Category[];
  brands: Brand[];
  models: EquipmentModel[];
}

export async function loadPublicCatalog(): Promise<CatalogData> {
  const [catRes, brandRes, modelRes, variantRes] = await Promise.all([
    supabase.from('categories').select('*').eq('hidden', false).order('display_order'),
    supabase.from('brands').select('*').eq('hidden', false),
    supabase.from('equipment_models').select('*').eq('published', true).eq('hidden', false).eq('archived', false).order('display_order'),
    supabase.from('equipment_variants').select('*').eq('published', true).order('display_order'),
  ]);

  const categories = (catRes.data as CategoryRow[] | null || []).map(mapCategory);
  const brands = (brandRes.data as BrandRow[] | null || []).map(mapBrand);
  const variantsByModel = new Map<string, EquipmentVariant[]>();
  (variantRes.data as EquipmentVariantRow[] | null || []).forEach((v) => {
    const arr = variantsByModel.get(v.model_id) || [];
    arr.push(mapVariant(v));
    variantsByModel.set(v.model_id, arr);
  });
  const models = (modelRes.data as EquipmentModelRow[] | null || []).map((m) =>
    mapModel(m, variantsByModel.get(m.id) || []),
  );

  return { categories, brands, models };
}

// ─── Admin Catalog Loader (includes hidden, archived, etc.) ───
export async function loadAdminCatalog(): Promise<{
  categories: AdminCategoryRow[];
  brands: AdminBrandRow[];
  models: AdminModelRow[];
  variants: AdminVariantRow[];
}> {
  const [catRes, brandRes, modelRes, variantRes] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('brands').select('*').order('display_order'),
    supabase.from('equipment_models').select('*').order('display_order'),
    supabase.from('equipment_variants').select('*').order('display_order'),
  ]);

  return {
    categories: (catRes.data as AdminCategoryRow[] | null || []),
    brands: (brandRes.data as AdminBrandRow[] | null || []),
    models: (modelRes.data as AdminModelRow[] | null || []),
    variants: (variantRes.data as AdminVariantRow[] | null || []),
  };
}

// ─── Query Helpers (operate on loaded data) ───────────────────
export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getBrandById(brands: Brand[], id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}

export function getModelById(models: EquipmentModel[], id: string): EquipmentModel | undefined {
  return models.find((m) => m.id === id);
}

export function getBrandsByCategory(models: EquipmentModel[], brands: Brand[], categoryId: string): Brand[] {
  const brandIds = [...new Set(models.filter((m) => m.categoryId === categoryId).map((m) => m.brandId))];
  return brandIds.map((id) => brands.find((b) => b.id === id)).filter((b): b is Brand => !!b);
}

export function getModelsByCategoryAndBrand(models: EquipmentModel[], categoryId: string, brandId: string): EquipmentModel[] {
  return models.filter((m) => m.categoryId === categoryId && m.brandId === brandId);
}

export function getModelsByCategory(models: EquipmentModel[], categoryId: string): EquipmentModel[] {
  return models.filter((m) => m.categoryId === categoryId);
}

export function getModelCountByCategory(models: EquipmentModel[], categoryId: string): number {
  return getModelsByCategory(models, categoryId).length;
}

export function getModelCountByBrand(models: EquipmentModel[], categoryId: string, brandId: string): number {
  return getModelsByCategoryAndBrand(models, categoryId, brandId).length;
}
