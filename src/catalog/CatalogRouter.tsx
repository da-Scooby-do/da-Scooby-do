import { useCatalog } from './CatalogContext';
import CategorySelectionPage from './components/CategorySelectionPage';
import BrandSelectionPage from './components/BrandSelectionPage';
import ModelSelectionPage from './components/ModelSelectionPage';
import DetailsPage from './components/DetailsPage';
import RentalRequestModal from './components/RentalRequestModal';

export default function CatalogRouter() {
  const { route } = useCatalog();

  return (
    <>
      {route.level === 'categories' && <CategorySelectionPage />}
      {route.level === 'brands' && <BrandSelectionPage />}
      {route.level === 'models' && <ModelSelectionPage />}
      {route.level === 'details' && <DetailsPage />}
      <RentalRequestModal />
    </>
  );
}
