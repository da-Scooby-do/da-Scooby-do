import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { loadAdminCatalog } from '@/catalog/catalogApi';
import type { AdminCategoryRow, AdminBrandRow, AdminModelRow, AdminVariantRow } from '@/catalog/catalogApi';
import type { AdminView } from './types';

interface AdminContextValue {
  categories: AdminCategoryRow[];
  brands: AdminBrandRow[];
  models: AdminModelRow[];
  variants: AdminVariantRow[];
  view: AdminView;
  setView: (v: AdminView) => void;
  loading: boolean;
  reload: () => Promise<void>;
  addModel: (data: Partial<AdminModelRow>) => Promise<string>;
  updateModel: (id: string, data: Partial<AdminModelRow>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  archiveModel: (id: string, archived: boolean) => Promise<void>;
  toggleModelPublished: (id: string, published: boolean) => Promise<void>;
  updateModelAvailability: (id: string, availability: string) => Promise<void>;
  reorderModel: (id: string, dir: 'up' | 'down') => Promise<void>;
  setModelVariants: (modelId: string, variants: AdminVariantRow[]) => Promise<void>;
  addCategory: (data: Partial<AdminCategoryRow>) => Promise<void>;
  updateCategory: (id: string, data: Partial<AdminCategoryRow>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryHidden: (id: string, hidden: boolean) => Promise<void>;
  reorderCategory: (id: string, dir: 'up' | 'down') => Promise<void>;
  addBrand: (data: Partial<AdminBrandRow>) => Promise<void>;
  updateBrand: (id: string, data: Partial<AdminBrandRow>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  toggleBrandHidden: (id: string, hidden: boolean) => Promise<void>;
  reorderBrand: (id: string, dir: 'up' | 'down') => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [models, setModels] = useState<AdminModelRow[]>([]);
  const [variants, setVariants] = useState<AdminVariantRow[]>([]);
  const [view, setView] = useState<AdminView>('dashboard');
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await loadAdminCatalog();
      setCategories(data.categories);
      setBrands(data.brands);
      setModels(data.models);
      setVariants(data.variants);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  // ─── Equipment Models ──────────────────────────────────────
  const addModel = async (data: Partial<AdminModelRow>): Promise<string> => {
    const { data: inserted, error } = await supabase
      .from('equipment_models')
      .insert(data)
      .select('id')
      .single();
    if (error) throw error;
    await reload();
    return inserted.id;
  };

  const updateModel = async (id: string, data: Partial<AdminModelRow>) => {
    const { error } = await supabase.from('equipment_models').update(data).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const deleteModel = async (id: string) => {
    const { error } = await supabase.from('equipment_models').delete().eq('id', id);
    if (error) throw error;
    await reload();
  };

  const archiveModel = async (id: string, archived: boolean) => {
    const { error } = await supabase.from('equipment_models').update({ archived }).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const toggleModelPublished = async (id: string, published: boolean) => {
    const { error } = await supabase.from('equipment_models').update({ published }).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const updateModelAvailability = async (id: string, availability: string) => {
    const { error } = await supabase.from('equipment_models').update({ availability }).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const reorderModel = async (id: string, dir: 'up' | 'down') => {
    const sorted = [...models].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const m1 = sorted[idx];
    const m2 = sorted[swapIdx];
    await Promise.all([
      supabase.from('equipment_models').update({ display_order: m2.display_order }).eq('id', m1.id),
      supabase.from('equipment_models').update({ display_order: m1.display_order }).eq('id', m2.id),
    ]);
    await reload();
  };

  const setModelVariants = async (modelId: string, newVariants: AdminVariantRow[]) => {
    // Delete existing variants, then insert new ones
    await supabase.from('equipment_variants').delete().eq('model_id', modelId);
    if (newVariants.length > 0) {
      const inserts = newVariants.map((v) => ({
        id: v.id,
        model_id: modelId,
        size_label_ar: v.size_label_ar,
        size_label_en: v.size_label_en,
        specs: v.specs,
        published: v.published,
        display_order: v.display_order,
      }));
      const { error } = await supabase.from('equipment_variants').insert(inserts);
      if (error) throw error;
    }
    await reload();
  };

  // ─── Categories ────────────────────────────────────────────
  const addCategory = async (data: Partial<AdminCategoryRow>) => {
    const { error } = await supabase.from('categories').insert(data);
    if (error) throw error;
    await reload();
  };

  const updateCategory = async (id: string, data: Partial<AdminCategoryRow>) => {
    const { error } = await supabase.from('categories').update(data).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    await reload();
  };

  const toggleCategoryHidden = async (id: string, hidden: boolean) => {
    const { error } = await supabase.from('categories').update({ hidden }).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const reorderCategory = async (id: string, dir: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const c1 = sorted[idx];
    const c2 = sorted[swapIdx];
    await Promise.all([
      supabase.from('categories').update({ display_order: c2.display_order }).eq('id', c1.id),
      supabase.from('categories').update({ display_order: c1.display_order }).eq('id', c2.id),
    ]);
    await reload();
  };

  // ─── Brands ────────────────────────────────────────────────
  const addBrand = async (data: Partial<AdminBrandRow>) => {
    const { error } = await supabase.from('brands').insert(data);
    if (error) throw error;
    await reload();
  };

  const updateBrand = async (id: string, data: Partial<AdminBrandRow>) => {
    const { error } = await supabase.from('brands').update(data).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const deleteBrand = async (id: string) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
    await reload();
  };

  const toggleBrandHidden = async (id: string, hidden: boolean) => {
    const { error } = await supabase.from('brands').update({ hidden }).eq('id', id);
    if (error) throw error;
    await reload();
  };

  const reorderBrand = async (id: string, dir: 'up' | 'down') => {
    const sorted = [...brands].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const b1 = sorted[idx];
    const b2 = sorted[swapIdx];
    await Promise.all([
      supabase.from('brands').update({ display_order: b2.display_order }).eq('id', b1.id),
      supabase.from('brands').update({ display_order: b1.display_order }).eq('id', b2.id),
    ]);
    await reload();
  };

  return (
    <AdminContext.Provider
      value={{
        categories, brands, models, variants, view, setView, loading, reload,
        addModel, updateModel, deleteModel, archiveModel, toggleModelPublished,
        updateModelAvailability, reorderModel, setModelVariants,
        addCategory, updateCategory, deleteCategory, toggleCategoryHidden, reorderCategory,
        addBrand, updateBrand, deleteBrand, toggleBrandHidden, reorderBrand,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
