import { useEffect, useState } from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { SiteContentProvider } from '@/contexts/SiteContentContext';
import { CatalogProvider } from '@/catalog/CatalogContext';
import { AdminProvider } from '@/admin/AdminContext';
import { EmployeeProvider } from '@/admin/EmployeeContext';
import { EquipmentUnitProvider } from '@/admin/EquipmentUnitContext';
import { AllocationProvider } from '@/admin/AllocationContext';
import { DeliveryProvider } from '@/admin/DeliveryContext';
import { NotificationProvider } from '@/admin/NotificationContext';
import { RenewalProvider } from '@/admin/RenewalContext';
import { CustomerProvider } from '@/customer/CustomerContext';
import { RentalProvider } from '@/rental/RentalContext';
import { QuotationProvider } from '@/quotation/QuotationContext';
import { ContractProvider } from '@/contract/ContractContext';
import { PurchaseOrderProvider } from '@/purchase-orders/PurchaseOrderContext';
import { RentalOperationProvider } from '@/rental-operations/RentalOperationContext';
import { ProjectProvider } from '@/project/ProjectContext';
import { ServicesProvider } from '@/services/ServicesContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EquipmentCategorySection from '@/components/EquipmentCategorySection';
import ContractingSection from '@/components/ContractingSection';
import WhySahab from '@/components/WhySahab';
import RentalProcess from '@/components/RentalProcess';
import ServicesSection from '@/services/components/ServicesSection';
import Company from '@/components/Company';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import FloatingActions from '@/components/FloatingActions';
import { useAnchorScroll, useCinematicEffects } from '@/hooks/useCinematicEffects';
import LegalPageView from '@/components/LegalPageView';
import CatalogRouter from '@/catalog/CatalogRouter';
import ServicesRouter from '@/services/ServicesRouter';
import AdminRouter from '@/admin/AdminRouter';
import CustomerApp from '@/customer/CustomerApp';

type RouteType = 'public' | 'catalog' | 'services' | 'admin' | 'customer' | 'legal' | 'project-request';

function getRouteType(): RouteType {
  const hash = window.location.hash;
  if (hash.startsWith('#/admin')) return 'admin';
  if (hash.startsWith('#/account')) return 'customer';
  if (hash.startsWith('#/catalog')) return 'catalog';
  if (hash.startsWith('#/services')) return 'services';
  if (hash.startsWith('#/legal/')) return 'legal';
  if (hash.startsWith('#/services/project-request')) return 'project-request';
  return 'public';
}

function useRouteType() {
  const [routeType, setRouteType] = useState<RouteType>(getRouteType);
  useEffect(() => {
    const onHashChange = () => setRouteType(getRouteType());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return routeType;
}

function App() {
  const routeType = useRouteType();
  useCinematicEffects();
  useAnchorScroll();

  if (routeType === 'admin') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <RentalProvider>
          <QuotationProvider>
            <PurchaseOrderProvider>
              <ContractProvider>
                <RentalOperationProvider>
                <ProjectProvider>
                  <ServicesProvider>
                    <CatalogProvider>
                    <AdminProvider>
                    <EmployeeProvider>
                      <EquipmentUnitProvider>
                        <AllocationProvider>
                          <DeliveryProvider>
                            <NotificationProvider>
                              <RenewalProvider>
                                <AdminRouter />
                              </RenewalProvider>
                            </NotificationProvider>
                          </DeliveryProvider>
                        </AllocationProvider>
                      </EquipmentUnitProvider>
                    </EmployeeProvider>
                  </AdminProvider>
                    </CatalogProvider>
                  </ServicesProvider>
                </ProjectProvider>
                </RentalOperationProvider>
              </ContractProvider>
            </PurchaseOrderProvider>
          </QuotationProvider>
        </RentalProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'customer') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <RentalProvider>
          <QuotationProvider>
            <ContractProvider>
              <ProjectProvider>
                <CustomerProvider>
                  <DeliveryProvider>
                    <NotificationProvider>
                      <RenewalProvider>
                        <CustomerApp />
                      </RenewalProvider>
                    </NotificationProvider>
                  </DeliveryProvider>
                </CustomerProvider>
              </ProjectProvider>
            </ContractProvider>
          </QuotationProvider>
        </RentalProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'catalog') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <RentalProvider>
        <CatalogProvider>
          <div className="min-h-screen bg-base">
            <Header />
            <main><CatalogRouter /></main>
            <Footer />
            <FloatingActions />
          </div>
        </CatalogProvider>
        </RentalProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'services' || routeType === 'project-request') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <ServicesProvider>
          <div className="min-h-screen bg-base">
            <Header />
            <main><ServicesRouter /></main>
            <Footer />
            <FloatingActions />
          </div>
        </ServicesProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'legal') {
    const pageId = window.location.hash.replace('#/legal/', '');
    return (
      <AppProvider>
        <SiteContentProvider>
          <LegalPageView pageId={pageId} />
        </SiteContentProvider>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <SiteContentProvider>
      <RentalProvider>
      <CatalogProvider>
        <div className="min-h-screen bg-base">
          <Header />
          <main>
            <Hero />
            <EquipmentCategorySection />
            <ContractingSection />
            <ServicesSection />
            <WhySahab />
            <RentalProcess />
            <Company />
            <CTA />
          </main>
          <Footer />
          <FloatingActions />
        </div>
      </CatalogProvider>
      </RentalProvider>
      </SiteContentProvider>
    </AppProvider>
  );
}

export default App;
