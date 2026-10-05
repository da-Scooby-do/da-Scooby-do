import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CatalogRoute, RequestEquipment, Category, Brand, EquipmentModel } from './types';
import { loadPublicCatalog } from './catalogApi';

interface CatalogContextValue {
  route: CatalogRoute;
  navigate: (route: CatalogRoute) => void;
  requestItem: RequestEquipment | null;
  setRequestItem: (item: RequestEquipment | null) => void;
  showRequestModal: boolean;
  setShowRequestModal: (show: boolean) => void;
  categories: Category[];
  brands: Brand[];
  models: EquipmentModel[];
  loading: boolean;
  error: string | null;
}

export const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

function parseHash(): CatalogRoute {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === 'home' || parts[0] === 'equipment' || parts[0] === 'contracting' || parts[0] === 'about' || parts[0] === 'contact') {
    return { level: 'categories' };
  }

  if (parts[0] === 'catalog') {
    if (parts.length === 1) return { level: 'categories' };
    if (parts.length === 2) return { level: 'brands', categoryId: parts[1] };
    if (parts.length === 3) return { level: 'models', categoryId: parts[1], brandId: parts[2] };
    if (parts.length >= 4) return { level: 'details', categoryId: parts[1], brandId: parts[2], modelId: parts[3] };
  }

  return { level: 'categories' };
}

function routeToHash(route: CatalogRoute): string {
  switch (route.level) {
    case 'categories': return '#/catalog';
    case 'brands': return `#/catalog/${route.categoryId}`;
    case 'models': return `#/catalog/${route.categoryId}/${route.brandId}`;
    case 'details': return `#/catalog/${route.categoryId}/${route.brandId}/${route.modelId}`;
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<CatalogRoute>(parseHash());
  const [requestItem, setRequestItem] = useState<RequestEquipment | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicCatalog()
      .then((data) => {
        setCategories(data.categories);
        setBrands(data.brands);
        setModels(data.models);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load catalog');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (newRoute: CatalogRoute) => {
    window.location.hash = routeToHash(newRoute);
  };

  return (
    <CatalogContext.Provider
      value={{ route, navigate, requestItem, setRequestItem, showRequestModal, setShowRequestModal, categories, brands, models, loading, error }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
