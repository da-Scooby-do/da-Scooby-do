import { useContext } from 'react';
import { CatalogContext } from './CatalogContext';
import type { Category, Brand, EquipmentModel } from './types';

interface CatalogDataState {
  categories: Category[];
  brands: Brand[];
  models: EquipmentModel[];
  loading: boolean;
  error: string | null;
}

export function useCatalogData(): CatalogDataState {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    return { categories: [], brands: [], models: [], loading: false, error: 'Catalog context not available' };
  }
  return {
    categories: ctx.categories,
    brands: ctx.brands,
    models: ctx.models,
    loading: ctx.loading,
    error: ctx.error,
  };
}
